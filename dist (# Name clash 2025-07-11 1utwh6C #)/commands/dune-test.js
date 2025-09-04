"use strict";
/**
 * Advanced Dune 2d20 Test Commands
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.damageData = exports.data = void 0;
exports.execute = execute;
exports.executeDamage = executeDamage;
const discord_js_1 = require("discord.js");
const character_manager_1 = require("../utils/character-manager");
const scene_manager_1 = require("../utils/scene-manager");
const dune_dice_1 = require("../utils/dune-dice");
const logger_1 = require("../utils/logger");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('test')
    .setDescription('Perform Dune 2d20 skill tests')
    .addStringOption(option => option
    .setName('attribute')
    .setDescription('Attribute to use for the test')
    .setRequired(true)
    .addChoices({ name: 'Muscle', value: 'muscle' }, { name: 'Move', value: 'move' }, { name: 'Intellect', value: 'intellect' }, { name: 'Awareness', value: 'awareness' }, { name: 'Communication', value: 'communication' }, { name: 'Discipline', value: 'discipline' }))
    .addStringOption(option => option
    .setName('skill')
    .setDescription('Skill to use for the test')
    .setRequired(true)
    .addChoices({ name: 'Battle', value: 'Battle' }, { name: 'Command', value: 'Command' }, { name: 'Discipline', value: 'Discipline' }, { name: 'Drive', value: 'Drive' }, { name: 'Infiltrate', value: 'Infiltrate' }, { name: 'Investigate', value: 'Investigate' }, { name: 'Lore', value: 'Lore' }, { name: 'Medicine', value: 'Medicine' }, { name: 'Mentat', value: 'Mentat' }, { name: 'Persuade', value: 'Persuade' }, { name: 'Pilot', value: 'Pilot' }, { name: 'Spice', value: 'Spice' }, { name: 'Stealth', value: 'Stealth' }, { name: 'Survival', value: 'Survival' }, { name: 'Tech', value: 'Tech' }, { name: 'Understand', value: 'Understand' }))
    .addIntegerOption(option => option
    .setName('difficulty')
    .setDescription('Test difficulty (default: 1)')
    .setRequired(false)
    .setMinValue(0)
    .setMaxValue(5))
    .addIntegerOption(option => option
    .setName('bonus')
    .setDescription('Bonus dice from circumstances')
    .setRequired(false)
    .setMinValue(0)
    .setMaxValue(5))
    .addStringOption(option => option
    .setName('assets')
    .setDescription('Assets to use (comma-separated names)')
    .setRequired(false))
    .addBooleanOption(option => option
    .setName('determination')
    .setDescription('Spend determination for an extra die')
    .setRequired(false))
    .addIntegerOption(option => option
    .setName('momentum')
    .setDescription('Spend momentum for extra dice')
    .setRequired(false)
    .setMinValue(0)
    .setMaxValue(5))
    .addStringOption(option => option
    .setName('description')
    .setDescription('Describe what you\'re attempting')
    .setRequired(false));
async function execute(interaction) {
    if (!interaction.guild || !interaction.member) {
        await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
        return;
    }
    const member = interaction.member;
    const character = character_manager_1.characterManager.getUserActiveCharacter(member.id, interaction.guild.id);
    if (!character) {
        await interaction.reply({
            content: 'You need a character to perform tests. Use `/sheet create` to make one!',
            ephemeral: true
        });
        return;
    }
    const attributeName = interaction.options.getString('attribute');
    const skillName = interaction.options.getString('skill');
    const difficulty = interaction.options.getInteger('difficulty') || 1;
    const bonusDice = interaction.options.getInteger('bonus') || 0;
    const assetsString = interaction.options.getString('assets');
    const useDetermination = interaction.options.getBoolean('determination') || false;
    const momentumSpent = interaction.options.getInteger('momentum') || 0;
    const description = interaction.options.getString('description');
    await interaction.deferReply();
    try {
        // Parse assets
        const assets = assetsString ? assetsString.split(',').map(a => a.trim()) : [];
        // Validate assets exist on character
        const validAssets = assets.filter(assetName => character.assets.some(asset => asset.name.toLowerCase().includes(assetName.toLowerCase())));
        if (assets.length > validAssets.length) {
            const invalidAssets = assets.filter(a => !validAssets.includes(a));
            await interaction.editReply({
                content: `⚠️ Warning: Assets not found on your character: ${invalidAssets.join(', ')}`
            });
        }
        // Check determination
        if (useDetermination && character.determination <= 0) {
            await interaction.editReply({
                content: '❌ You don\'t have any determination to spend!'
            });
            return;
        }
        // Get scene for momentum/threat tracking
        let scene = null;
        if (interaction.channel?.isThread()) {
            scene = scene_manager_1.sceneManager.getSceneByThread(interaction.channel.id);
        }
        // Check momentum availability
        if (momentumSpent > 0) {
            if (!scene) {
                await interaction.editReply({
                    content: '❌ You can only spend momentum in an active scene thread!'
                });
                return;
            }
            if (scene.resources.momentum < momentumSpent) {
                await interaction.editReply({
                    content: `❌ Not enough momentum! Scene has ${scene.resources.momentum}, you tried to spend ${momentumSpent}.`
                });
                return;
            }
        }
        // Prepare roll options
        const rollOptions = {
            difficulty,
            bonusDice: bonusDice + momentumSpent,
            assets: validAssets,
            useDetermination,
            complicationRange: 20
        };
        // Perform the test
        const result = dune_dice_1.DuneDiceEngine.performTest(character, attributeName, skillName, rollOptions);
        // Update resources
        if (useDetermination) {
            await character_manager_1.characterManager.updateDetermination(character.id, -1);
        }
        if (scene && (momentumSpent > 0 || result.momentum > 0 || result.threat > 0)) {
            const resourceUpdates = {};
            if (momentumSpent > 0 || result.momentum > 0) {
                resourceUpdates.momentum = Math.max(0, scene.resources.momentum - momentumSpent + result.momentum);
            }
            if (result.threat > 0) {
                resourceUpdates.threat = scene.resources.threat + result.threat;
            }
            await scene_manager_1.sceneManager.updateResources(interaction.channel.id, resourceUpdates);
        }
        // Create result embed
        const embed = createTestResultEmbed(character, result, attributeName, skillName, description, member);
        await interaction.editReply({ embeds: [embed] });
        // Post resource update if in scene
        if (scene && (result.momentum > 0 || result.threat > 0)) {
            const resourceEmbed = new discord_js_1.EmbedBuilder()
                .setColor(result.momentum > 0 ? 0x00FF00 : 0xFF4500)
                .setDescription(`⚡ **Scene Resources Updated**\nMomentum: ${scene.resources.momentum - momentumSpent + result.momentum}\nThreat: ${scene.resources.threat + result.threat}`)
                .setTimestamp();
            await interaction.followUp({ embeds: [resourceEmbed] });
        }
    }
    catch (error) {
        logger_1.logger.error('Test command error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
        await interaction.editReply({ content: `❌ ${errorMessage}` });
    }
}
function createTestResultEmbed(character, result, attributeName, skillName, description, member) {
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(result.success ? 0x00FF00 : 0xFF0000)
        .setTitle(`🎲 ${character.name} - ${skillName} Test`)
        .setThumbnail(member.displayAvatarURL())
        .setDescription(description || `Testing ${attributeName.charAt(0).toUpperCase() + attributeName.slice(1)} + ${skillName}`)
        .addFields({
        name: '🎯 Test Details',
        value: `**Target:** ${result.details.attribute + result.details.skill}\n**Difficulty:** ${result.difficulty}\n**Dice Pool:** ${result.rolls.length}d20`,
        inline: true
    }, {
        name: '📊 Results',
        value: `**Successes:** ${result.successes}\n**Complications:** ${result.complications}\n**Critical Hits:** ${result.criticalHits}`,
        inline: true
    }, {
        name: '⚡ Resources',
        value: `**Momentum:** +${result.momentum}\n**Threat:** +${result.threat}`,
        inline: true
    });
    // Add dice rolls
    const diceDisplay = result.rolls.map((roll, index) => {
        let emoji = '⚪'; // Default
        if (roll <= result.details.attribute + result.details.skill) {
            emoji = roll === 1 ? '🎯' : '✅'; // Critical or success
        }
        if (roll >= 20) {
            emoji = '⚠️'; // Complication
        }
        return `${emoji}${roll}`;
    }).join(' ');
    embed.addFields({
        name: '🎲 Dice Rolls',
        value: diceDisplay,
        inline: false
    });
    // Add narrative result
    embed.addFields({
        name: '📖 Result',
        value: result.narrative,
        inline: false
    });
    // Add modifiers used
    const modifiers = [];
    if (result.details.bonusDice > 0)
        modifiers.push(`+${result.details.bonusDice} bonus dice`);
    if (result.details.assets.length > 0)
        modifiers.push(`Assets: ${result.details.assets.join(', ')}`);
    if (result.details.determination)
        modifiers.push('Determination spent');
    if (modifiers.length > 0) {
        embed.addFields({
            name: '🔧 Modifiers',
            value: modifiers.join('\n'),
            inline: false
        });
    }
    embed.setFooter({ text: `Rolled by ${member.displayName}` })
        .setTimestamp();
    return embed;
}
// Additional command for damage rolls
exports.damageData = new discord_js_1.SlashCommandBuilder()
    .setName('damage')
    .setDescription('Roll damage for attacks')
    .addIntegerOption(option => option
    .setName('base')
    .setDescription('Base damage value')
    .setRequired(true)
    .setMinValue(0)
    .setMaxValue(20))
    .addIntegerOption(option => option
    .setName('effects')
    .setDescription('Base effects value')
    .setRequired(false)
    .setMinValue(0)
    .setMaxValue(10))
    .addStringOption(option => option
    .setName('qualities')
    .setDescription('Weapon qualities (comma-separated)')
    .setRequired(false))
    .addStringOption(option => option
    .setName('description')
    .setDescription('Describe the attack')
    .setRequired(false));
async function executeDamage(interaction) {
    const baseDamage = interaction.options.getInteger('base');
    const baseEffects = interaction.options.getInteger('effects') || 0;
    const qualitiesString = interaction.options.getString('qualities');
    const description = interaction.options.getString('description');
    const qualities = qualitiesString ? qualitiesString.split(',').map(q => q.trim()) : [];
    const result = dune_dice_1.DuneDiceEngine.rollDamage(baseDamage, baseEffects, qualities);
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(0xFF4500)
        .setTitle('⚔️ Damage Roll')
        .setDescription(description || 'Rolling damage...')
        .addFields({
        name: '💥 Damage',
        value: `**Total:** ${result.damage}\n**Base:** ${baseDamage} + **Roll:** ${result.damage - baseDamage}`,
        inline: true
    }, {
        name: '✨ Effects',
        value: `**Total:** ${result.effects}\n**Base:** ${baseEffects} + **Roll:** ${result.effects - baseEffects}`,
        inline: true
    });
    if (qualities.length > 0) {
        embed.addFields({
            name: '🔧 Weapon Qualities',
            value: qualities.join(', '),
            inline: false
        });
    }
    if (result.special.length > 0) {
        embed.addFields({
            name: '⭐ Special Effects',
            value: result.special.join('\n'),
            inline: false
        });
    }
    embed.setTimestamp();
    await interaction.reply({ embeds: [embed] });
}
