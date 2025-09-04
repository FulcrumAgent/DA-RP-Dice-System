"use strict";
/**
 * NPC Management Commands
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const character_manager_1 = require("../utils/character-manager");
const dune_dice_1 = require("../utils/dune-dice");
const logger_1 = require("../utils/logger");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('npc')
    .setDescription('NPC management commands')
    .addSubcommand(subcommand => subcommand
    .setName('create')
    .setDescription('Create a new NPC')
    .addStringOption(option => option
    .setName('name')
    .setDescription('NPC name')
    .setRequired(true))
    .addStringOption(option => option
    .setName('concept')
    .setDescription('NPC concept (e.g., "Harkonnen Guard", "Fremen Warrior")')
    .setRequired(true))
    .addStringOption(option => option
    .setName('description')
    .setDescription('Detailed description of the NPC')
    .setRequired(true))
    .addStringOption(option => option
    .setName('tier')
    .setDescription('NPC tier/power level')
    .setRequired(false)
    .addChoices({ name: 'Minion', value: 'minion' }, { name: 'Toughened', value: 'toughened' }, { name: 'Nemesis', value: 'nemesis' })))
    .addSubcommand(subcommand => subcommand
    .setName('list')
    .setDescription('List all NPCs in this server'))
    .addSubcommand(subcommand => subcommand
    .setName('view')
    .setDescription('View detailed NPC information')
    .addStringOption(option => option
    .setName('name')
    .setDescription('NPC name to view')
    .setRequired(true)))
    .addSubcommand(subcommand => subcommand
    .setName('edit')
    .setDescription('Edit an existing NPC')
    .addStringOption(option => option
    .setName('name')
    .setDescription('NPC name to edit')
    .setRequired(true))
    .addStringOption(option => option
    .setName('field')
    .setDescription('Field to edit')
    .setRequired(true)
    .addChoices({ name: 'Name', value: 'name' }, { name: 'Concept', value: 'concept' }, { name: 'Description', value: 'description' }))
    .addStringOption(option => option
    .setName('value')
    .setDescription('New value')
    .setRequired(true)))
    .addSubcommand(subcommand => subcommand
    .setName('roll')
    .setDescription('Make a roll for an NPC')
    .addStringOption(option => option
    .setName('name')
    .setDescription('NPC name')
    .setRequired(true))
    .addStringOption(option => option
    .setName('attribute')
    .setDescription('Attribute to use')
    .setRequired(true)
    .addChoices({ name: 'Muscle', value: 'muscle' }, { name: 'Move', value: 'move' }, { name: 'Intellect', value: 'intellect' }, { name: 'Awareness', value: 'awareness' }, { name: 'Communication', value: 'communication' }, { name: 'Discipline', value: 'discipline' }))
    .addStringOption(option => option
    .setName('skill')
    .setDescription('Skill to use')
    .setRequired(true))
    .addIntegerOption(option => option
    .setName('difficulty')
    .setDescription('Test difficulty')
    .setRequired(false)
    .setMinValue(0)
    .setMaxValue(5))
    .addStringOption(option => option
    .setName('description')
    .setDescription('What is the NPC attempting?')
    .setRequired(false)))
    .addSubcommand(subcommand => subcommand
    .setName('generate')
    .setDescription('Generate quick NPC stats')
    .addStringOption(option => option
    .setName('tier')
    .setDescription('NPC tier/power level')
    .setRequired(true)
    .addChoices({ name: 'Minion', value: 'minion' }, { name: 'Toughened', value: 'toughened' }, { name: 'Nemesis', value: 'nemesis' }))
    .addStringOption(option => option
    .setName('concept')
    .setDescription('NPC concept for stat generation')
    .setRequired(true)))
    .addSubcommand(subcommand => subcommand
    .setName('delete')
    .setDescription('Delete an NPC (requires manage server permission)')
    .addStringOption(option => option
    .setName('name')
    .setDescription('NPC name to delete')
    .setRequired(true)));
async function execute(interaction) {
    if (!interaction.guild || !interaction.member) {
        await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
        return;
    }
    const subcommand = interaction.options.getSubcommand();
    const member = interaction.member;
    try {
        switch (subcommand) {
            case 'create':
                await handleCreateNPC(interaction, member);
                break;
            case 'list':
                await handleListNPCs(interaction);
                break;
            case 'view':
                await handleViewNPC(interaction);
                break;
            case 'edit':
                await handleEditNPC(interaction, member);
                break;
            case 'roll':
                await handleNPCRoll(interaction);
                break;
            case 'generate':
                await handleGenerateNPC(interaction);
                break;
            case 'delete':
                await handleDeleteNPC(interaction, member);
                break;
            default:
                await interaction.reply({ content: 'Unknown subcommand.', ephemeral: true });
        }
    }
    catch (error) {
        logger_1.logger.error('NPC command error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: `❌ ${errorMessage}`, ephemeral: true });
        }
        else {
            await interaction.reply({ content: `❌ ${errorMessage}`, ephemeral: true });
        }
    }
}
async function handleCreateNPC(interaction, member) {
    const name = interaction.options.getString('name');
    const concept = interaction.options.getString('concept');
    const description = interaction.options.getString('description');
    const tier = interaction.options.getString('tier') || 'minion';
    await interaction.deferReply();
    try {
        // Generate base stats for the tier
        const baseStats = dune_dice_1.DuneDiceEngine.generateNPCStats(tier, concept);
        const npc = await character_manager_1.characterManager.createNPC(name, interaction.guild.id, concept, description, member.id, {
            attributes: baseStats.attributes,
            skills: Object.entries(baseStats.skills).map(([skillName, value]) => ({
                name: skillName,
                value: value
            }))
        });
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0x8B4513)
            .setTitle('👤 NPC Created!')
            .setDescription(`**${npc.name}** has been added to the server.`)
            .addFields({ name: '🎯 Concept', value: npc.concept, inline: true }, { name: '⭐ Tier', value: tier.charAt(0).toUpperCase() + tier.slice(1), inline: true }, { name: '👤 Created By', value: `<@${member.id}>`, inline: true }, { name: '📝 Description', value: npc.description, inline: false })
            .setFooter({ text: 'Use /npc view to see full stats' })
            .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
    }
    catch (error) {
        await interaction.editReply({ content: `Failed to create NPC: ${error}` });
    }
}
async function handleListNPCs(interaction) {
    const npcs = await character_manager_1.characterManager.getGuildNPCs(interaction.guild.id);
    if (npcs.length === 0) {
        await interaction.reply({ content: 'No NPCs found in this server. Use `/npc create` to add some!', ephemeral: true });
        return;
    }
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(0x9370DB)
        .setTitle('👥 Server NPCs')
        .setDescription(`Found ${npcs.length} NPC(s):`)
        .setTimestamp();
    // Group NPCs by concept for better organization
    const npcList = npcs.map((npc, index) => `**${index + 1}. ${npc.name}**\n*${npc.concept}*\nCreated by <@${npc.createdBy}>`).join('\n\n');
    // Split into multiple fields if too long
    if (npcList.length > 4096) {
        const chunks = npcList.match(/.{1,1000}/g) || [npcList];
        chunks.forEach((chunk, index) => {
            embed.addFields({
                name: index === 0 ? 'NPCs' : `NPCs (continued ${index + 1})`,
                value: chunk,
                inline: false
            });
        });
    }
    else {
        embed.setDescription(`Found ${npcs.length} NPC(s):\n\n${npcList}`);
    }
    await interaction.reply({ embeds: [embed] });
}
async function handleViewNPC(interaction) {
    const npcName = interaction.options.getString('name');
    const npc = await character_manager_1.characterManager.getNPCByName(npcName, interaction.guild.id);
    if (!npc) {
        await interaction.reply({
            content: `❌ NPC "${npcName}" not found.`,
            ephemeral: true
        });
        return;
    }
    const embed = createNPCEmbed(npc);
    await interaction.reply({ embeds: [embed] });
}
async function handleEditNPC(interaction, member) {
    const npcName = interaction.options.getString('name');
    const field = interaction.options.getString('field');
    const value = interaction.options.getString('value');
    const npc = await character_manager_1.characterManager.getNPCByName(npcName, interaction.guild.id);
    if (!npc) {
        await interaction.reply({
            content: `❌ NPC "${npcName}" not found.`,
            ephemeral: true
        });
        return;
    }
    // Check permissions - only creator or server managers can edit
    if (npc.createdBy !== member.id && !member.permissions.has(discord_js_1.PermissionFlagsBits.ManageGuild)) {
        await interaction.reply({
            content: '❌ You can only edit NPCs you created, or you need Manage Server permission.',
            ephemeral: true
        });
        return;
    }
    await interaction.deferReply({ ephemeral: true });
    try {
        // Update the NPC (this would need to be implemented in characterManager)
        // For now, just acknowledge the request
        await interaction.editReply({
            content: `✅ Would update ${field} of ${npcName} to "${value}" (Edit functionality needs to be implemented in characterManager)`
        });
    }
    catch (error) {
        await interaction.editReply({ content: `Failed to edit NPC: ${error}` });
    }
}
async function handleNPCRoll(interaction) {
    const npcName = interaction.options.getString('name');
    const attributeName = interaction.options.getString('attribute');
    const skillName = interaction.options.getString('skill');
    const difficulty = interaction.options.getInteger('difficulty') || 1;
    const description = interaction.options.getString('description');
    const npc = await character_manager_1.characterManager.getNPCByName(npcName, interaction.guild.id);
    if (!npc) {
        await interaction.reply({
            content: `❌ NPC "${npcName}" not found.`,
            ephemeral: true
        });
        return;
    }
    await interaction.deferReply();
    try {
        // Get attribute value
        const attributeValue = npc.attributes?.[attributeName] || 8;
        // Get skill value
        const skill = npc.skills?.find(s => s.name.toLowerCase() === skillName.toLowerCase());
        const skillValue = skill?.value || 0;
        // Create a mock character object for the dice engine
        const mockCharacter = {
            attributes: { [attributeName]: attributeValue },
            skills: [{ name: skillName, value: skillValue }]
        };
        // Perform the roll
        const result = dune_dice_1.DuneDiceEngine.performTest(mockCharacter, attributeName, skillName, { difficulty });
        // Create result embed
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(result.success ? 0x00FF00 : 0xFF0000)
            .setTitle(`🎲 ${npc.name} - ${skillName} Test`)
            .setDescription(description || `${npc.name} attempts a ${skillName} test`)
            .addFields({
            name: '🎯 Test Details',
            value: `**Target:** ${attributeValue + skillValue}\n**Difficulty:** ${difficulty}\n**Dice Pool:** ${result.rolls.length}d20`,
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
        const diceDisplay = result.rolls.map((roll) => {
            let emoji = '⚪'; // Default
            if (roll <= attributeValue + skillValue) {
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
        embed.addFields({
            name: '📖 Result',
            value: result.narrative,
            inline: false
        });
        embed.setFooter({ text: `${npc.concept}` })
            .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
    }
    catch (error) {
        await interaction.editReply({ content: `Failed to roll for NPC: ${error}` });
    }
}
async function handleGenerateNPC(interaction) {
    const tier = interaction.options.getString('tier');
    const concept = interaction.options.getString('concept');
    const stats = dune_dice_1.DuneDiceEngine.generateNPCStats(tier, concept);
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(0x4169E1)
        .setTitle(`🎲 Generated ${tier.charAt(0).toUpperCase() + tier.slice(1)} Stats`)
        .setDescription(`*${concept}*`)
        .addFields({
        name: '⚡ Attributes',
        value: Object.entries(stats.attributes)
            .map(([name, value]) => `**${name.charAt(0).toUpperCase() + name.slice(1)}:** ${value}`)
            .join('\n'),
        inline: true
    }, {
        name: '🎯 Skills',
        value: Object.entries(stats.skills)
            .map(([name, value]) => `**${name.charAt(0).toUpperCase() + name.slice(1)}:** ${value}`)
            .join('\n'),
        inline: true
    }, {
        name: '❤️ Health',
        value: `**Vigor:** ${stats.vigor}\n**Resolve:** ${stats.resolve}`,
        inline: true
    })
        .setFooter({ text: 'Use /npc create to save this as a permanent NPC' })
        .setTimestamp();
    await interaction.reply({ embeds: [embed] });
}
async function handleDeleteNPC(interaction, member) {
    const npcName = interaction.options.getString('name');
    const npc = await character_manager_1.characterManager.getNPCByName(npcName, interaction.guild.id);
    if (!npc) {
        await interaction.reply({
            content: `❌ NPC "${npcName}" not found.`,
            ephemeral: true
        });
        return;
    }
    // Check permissions
    if (npc.createdBy !== member.id && !member.permissions.has(discord_js_1.PermissionFlagsBits.ManageGuild)) {
        await interaction.reply({
            content: '❌ You can only delete NPCs you created, or you need Manage Server permission.',
            ephemeral: true
        });
        return;
    }
    await interaction.deferReply({ ephemeral: true });
    try {
        // Delete functionality would need to be implemented in characterManager
        await interaction.editReply({
            content: `✅ Would delete NPC "${npcName}" (Delete functionality needs to be implemented in characterManager)`
        });
    }
    catch (error) {
        await interaction.editReply({ content: `Failed to delete NPC: ${error}` });
    }
}
function createNPCEmbed(npc) {
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(0x8B4513)
        .setTitle(`👤 ${npc.name}`)
        .setDescription(`*${npc.concept}*\n\n${npc.description}`)
        .setFooter({ text: `Created by ${npc.createdBy} • ${new Date(npc.createdAt).toLocaleDateString()}` })
        .setTimestamp();
    // Add attributes if present
    if (npc.attributes) {
        const attrs = Object.entries(npc.attributes)
            .map(([name, value]) => `**${name.charAt(0).toUpperCase() + name.slice(1)}:** ${value}`)
            .join('\n');
        embed.addFields({ name: '⚡ Attributes', value: attrs, inline: true });
    }
    // Add skills if present
    if (npc.skills && npc.skills.length > 0) {
        const skills = npc.skills
            .filter(skill => skill.value > 0)
            .map(skill => `**${skill.name}:** ${skill.value}`)
            .join('\n');
        if (skills) {
            embed.addFields({ name: '🎯 Skills', value: skills, inline: true });
        }
    }
    // Add assets if present
    if (npc.assets && npc.assets.length > 0) {
        const assets = npc.assets
            .map(asset => `**${asset.name}** (${asset.type}): ${asset.description}`)
            .join('\n');
        embed.addFields({ name: '🎒 Assets', value: assets.length > 1024 ? assets.substring(0, 1020) + '...' : assets, inline: false });
    }
    // Add traits if present
    if (npc.traits && npc.traits.length > 0) {
        const traits = npc.traits
            .map(trait => `**${trait.name}** (${trait.type}): ${trait.description}`)
            .join('\n');
        embed.addFields({ name: '✨ Traits', value: traits.length > 1024 ? traits.substring(0, 1020) + '...' : traits, inline: false });
    }
    return embed;
}
