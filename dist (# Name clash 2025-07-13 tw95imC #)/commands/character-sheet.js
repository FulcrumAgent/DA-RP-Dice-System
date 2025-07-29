"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
exports.handleButtonInteraction = handleButtonInteraction;
exports.handleInteraction = handleInteraction;
const discord_js_1 = require("discord.js");
const character_manager_1 = require("../utils/character-manager");
const character_creation_state_1 = require("../utils/character-creation-state");
const focus_manager_1 = require("../utils/focus-manager");
const logger_1 = require("../utils/logger");
const character_creation_flow_1 = require("./character-creation-flow");
const character_creation_flow_2 = require("./character-creation-flow");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('sheet')
    .setDescription('Character sheet management commands')
    .addSubcommand(subcommand => subcommand
    .setName('create')
    .setDescription('Start creating a new character (step-by-step process)'))
    .addSubcommand(subcommand => subcommand
    .setName('concept')
    .setDescription('Select character concepts (up to 5)'))
    .addSubcommand(subcommand => subcommand
    .setName('archetype')
    .setDescription('Select character archetype'))
    .addSubcommand(subcommand => subcommand
    .setName('skills')
    .setDescription('Assign skill points using point-buy system'))
    .addSubcommand(subcommand => subcommand
    .setName('focuses')
    .setDescription('Add focuses to your skills'))
    .addSubcommand(subcommand => subcommand
    .setName('drives')
    .setDescription('Assign drive points using point-buy system'))
    .addSubcommand(subcommand => subcommand
    .setName('statements')
    .setDescription('Write your drive statements'))
    .addSubcommand(subcommand => subcommand
    .setName('talents')
    .setDescription('Select 3 talents from the available lists'))
    .addSubcommand(subcommand => subcommand
    .setName('assets')
    .setDescription('Select 3 assets from the available lists'))
    .addSubcommand(subcommand => subcommand
    .setName('details')
    .setDescription('Add optional house and homeworld details')
    .addStringOption(option => option
    .setName('house')
    .setDescription('Great House affiliation')
    .setRequired(false))
    .addStringOption(option => option
    .setName('homeworld')
    .setDescription('Character homeworld')
    .setRequired(false)))
    .addSubcommand(subcommand => subcommand
    .setName('review')
    .setDescription('Review your character before finalizing'))
    .addSubcommand(subcommand => subcommand
    .setName('finalize')
    .setDescription('Complete character creation and make it active'))
    .addSubcommand(subcommand => subcommand
    .setName('cancel')
    .setDescription('Cancel current character creation'))
    .addSubcommand(subcommand => subcommand
    .setName('view')
    .setDescription('View a character sheet')
    .addUserOption(option => option
    .setName('user')
    .setDescription('User whose character to view (defaults to yourself)')
    .setRequired(false)))
    .addSubcommand(subcommand => subcommand
    .setName('edit')
    .setDescription('Edit your character')
    .addStringOption(option => option
    .setName('field')
    .setDescription('Field to edit')
    .setRequired(true)
    .addChoices({ name: 'Name', value: 'name' }, { name: 'Concept', value: 'concept' }, { name: 'House', value: 'house' }, { name: 'Homeworld', value: 'homeworld' }))
    .addStringOption(option => option
    .setName('value')
    .setDescription('New value')
    .setRequired(true)))
    .addSubcommand(subcommand => subcommand
    .setName('determination')
    .setDescription('Update your determination')
    .addIntegerOption(option => option
    .setName('change')
    .setDescription('Change in determination (+/- value)')
    .setRequired(true)
    .setMinValue(-10)
    .setMaxValue(10)))
    .addSubcommand(subcommand => subcommand
    .setName('delete')
    .setDescription('Delete your character (cannot be undone!)'));
async function execute(interaction) {
    if (!interaction.isChatInputCommand())
        return;
    if (!interaction.guild) {
        await interaction.reply('This command can only be used in a server.');
        return;
    }
    const member = interaction.member;
    const subcommand = interaction.options.getSubcommand();
    try {
        if (subcommand === 'cancel') {
            await handleCancelCreation(interaction, member);
            return;
        }
        if (subcommand === 'create') {
            const { CharacterCreator } = await Promise.resolve().then(() => __importStar(require('./character-creator.js')));
            await CharacterCreator.startCreation(interaction, member);
            return;
        }
        const state = character_creation_state_1.characterCreationState.getState(member.id, interaction.guild.id);
        if (!state) {
            await interaction.reply({
                content: 'You don\'t have an active character creation. Use `/sheet create` to start.',
                ephemeral: true
            });
            return;
        }
        const stepValues = Object.values(character_creation_flow_2.CREATION_STEPS);
        const currentStep = (state.step && Object.values(character_creation_flow_2.CREATION_STEPS).includes(state.step))
            ? String(state.step)
            : 'NAME';
        const stepIndex = stepValues.indexOf(currentStep);
        const nextStep = stepIndex >= 0 && stepIndex < stepValues.length - 1
            ? stepValues[stepIndex + 1]
            : 'NAME';
        await (0, character_creation_flow_1.showCreationPanel)(interaction, member, nextStep);
    }
    catch (error) {
        logger_1.logger.error('Character sheet command error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: `❌ ${errorMessage}`, ephemeral: true });
        }
        else {
            await interaction.reply({ content: `❌ ${errorMessage}`, ephemeral: true });
        }
    }
}
async function handleStartCreation(interaction, member) {
    try {
        const existingState = character_creation_state_1.characterCreationState.getState(member.id, interaction.guild.id);
        if (existingState) {
            await interaction.reply({
                content: '⚠️ You already have a character creation in progress! Use `/sheet cancel` to start over, or continue with the next step.',
                ephemeral: true
            });
            return;
        }
        const session = {
            guildId: interaction.guild.id,
            userId: member.id,
            channelId: interaction.channelId,
            currentStep: character_creation_flow_2.CREATION_STEPS.NAME,
            characterData: {
                resourcePools: {
                    health: 10,
                    resolve: 10,
                    momentum: 2
                }
            },
            lastUpdated: Date.now()
        };
        const { characterCreationSessions } = await Promise.resolve().then(() => __importStar(require('./character-creation-flow')));
        characterCreationSessions.set(member.id, session);
        await (0, character_creation_flow_1.showCreationPanel)(interaction, member, character_creation_flow_2.CREATION_STEPS.NAME);
        logger_1.logger.info(`Started character creation for user ${member.id} in guild ${interaction.guild.id}`);
    }
    catch (error) {
        logger_1.logger.error('Character creation start error:', error);
        throw error;
    }
}
async function handleAssignSkills(interaction, member) {
    await interaction.deferReply();
    try {
        const state = character_creation_state_1.characterCreationState.getState(member.id, interaction.guild.id);
        if (!state || !state.data.name) {
            await interaction.editReply({
                content: '❌ No character creation in progress. Use `/sheet create` first!'
            });
            return;
        }
        const skillRows = createSkillAssignmentRows();
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0xD4AF37)
            .setTitle('⚔️ Assign Skill Points')
            .setDescription(`**${state.data.name}** - Assign your skill values`)
            .addFields({ name: '📊 Point-Buy Values', value: 'Use each value exactly once: **9, 7, 6, 5, 4**', inline: false }, { name: '🎯 Skills to Assign', value: '• **Battle** - Combat and warfare\n• **Communicate** - Social interaction\n• **Discipline** - Mental fortitude\n• **Move** - Physical actions\n• **Understand** - Knowledge and analysis', inline: false })
            .setFooter({ text: 'Select a skill and then choose its value' });
        await interaction.editReply({
            embeds: [embed],
            components: skillRows
        });
    }
    catch (error) {
        logger_1.logger.error('Skill assignment error:', error);
        throw error;
    }
}
function createSkillAssignmentRows() {
    const skillSelect = new discord_js_1.StringSelectMenuBuilder()
        .setCustomId('skill_select')
        .setPlaceholder('Choose a skill to assign')
        .addOptions([
        { label: 'Battle', value: 'Battle', description: 'Combat and warfare skills' },
        { label: 'Communicate', value: 'Communicate', description: 'Social interaction and persuasion' },
        { label: 'Discipline', value: 'Discipline', description: 'Mental fortitude and self-control' },
        { label: 'Move', value: 'Move', description: 'Physical actions and mobility' },
        { label: 'Understand', value: 'Understand', description: 'Knowledge and analysis' }
    ]);
    const valueSelect = new discord_js_1.StringSelectMenuBuilder()
        .setCustomId('skill_value_select')
        .setPlaceholder('Choose the value for this skill')
        .addOptions([
        { label: '9 (Highest)', value: '9', description: 'Your best skill' },
        { label: '7 (High)', value: '7', description: 'A strong skill' },
        { label: '6 (Good)', value: '6', description: 'A decent skill' },
        { label: '5 (Average)', value: '5', description: 'A basic skill' },
        { label: '4 (Lowest)', value: '4', description: 'Your weakest skill' }
    ]);
    return [
        new discord_js_1.ActionRowBuilder().addComponents(skillSelect),
        new discord_js_1.ActionRowBuilder().addComponents(valueSelect)
    ];
}
function createDriveAssignmentRows() {
    const driveSelect = new discord_js_1.StringSelectMenuBuilder()
        .setCustomId('drive_select')
        .setPlaceholder('Choose a drive to assign')
        .addOptions([
        { label: 'Duty', value: 'Duty', description: 'Loyalty and obligation to others' },
        { label: 'Faith', value: 'Faith', description: 'Belief and conviction in ideals' },
        { label: 'Justice', value: 'Justice', description: 'Fairness and righteousness' },
        { label: 'Power', value: 'Power', description: 'Control and influence over others' },
        { label: 'Truth', value: 'Truth', description: 'Knowledge and honesty' }
    ]);
    const driveValueSelect = new discord_js_1.StringSelectMenuBuilder()
        .setCustomId('drive_value_select')
        .setPlaceholder('Choose the value for this drive')
        .addOptions([
        { label: '9 (Highest)', value: '9', description: 'Your strongest drive' },
        { label: '7 (High)', value: '7', description: 'A strong drive' },
        { label: '6 (Good)', value: '6', description: 'A decent drive' },
        { label: '5 (Average)', value: '5', description: 'A basic drive' },
        { label: '4 (Lowest)', value: '4', description: 'Your weakest drive' }
    ]);
    return [
        new discord_js_1.ActionRowBuilder().addComponents(driveSelect),
        new discord_js_1.ActionRowBuilder().addComponents(driveValueSelect)
    ];
}
async function handleAssignFocuses(interaction, member) {
    await interaction.deferReply();
    const userId = member.id;
    const guildId = interaction.guild.id;
    const creationState = character_creation_state_1.characterCreationState.getState(userId, guildId);
    if (!creationState) {
        await interaction.editReply({ content: '❌ No character creation in progress. Use `/sheet create` to start!' });
        return;
    }
    if (!creationState.data.skills || Object.keys(creationState.data.skills).length < 5) {
        await interaction.editReply({ content: '❌ You need to assign skills first! Use `/sheet skills` to continue.' });
        return;
    }
    if (!creationState.data.focuses) {
        creationState.data.focuses = {};
    }
    const currentFocuses = creationState.data.focuses || {};
    const focusDisplay = Object.keys(creationState.data.skills).map(skill => {
        const focuses = currentFocuses[skill] || [];
        const focusText = Array.isArray(focuses) && focuses.length > 0 ? focuses.join(', ') : 'None selected';
        return `• **${skill}**: ${focusText}`;
    }).join('\n');
    const totalFocuses = Object.values(currentFocuses).reduce((sum, focuses) => sum + focuses.length, 0);
    const skillCount = Object.keys(creationState.data.skills).length;
    const maxFocuses = skillCount * 1;
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('🎯 Assign Skill Focuses')
        .setDescription('Select focuses from the fixed list to specialize your skills.')
        .addFields({ name: '📊 Your Skills & Focuses', value: focusDisplay, inline: false }, { name: '🎯 Focus Rules', value: `• Each skill can have up to 1 focus\n• All focuses must be from the predefined list\n• Focuses provide +1 bonus in specific situations\n• Progress: ${totalFocuses}/${maxFocuses} focuses assigned`, inline: false }, { name: '📝 Instructions', value: 'Select a skill to assign focuses from the available options', inline: false })
        .setColor(0x8B4513);
    const skillOptions = Object.keys(creationState.data.skills).map(skill => {
        const currentSkillFocuses = currentFocuses[skill] || [];
        const focusCount = currentSkillFocuses.length;
        return {
            label: `${skill} (${focusCount}/1 focus)`,
            value: skill,
            description: `Available focuses: ${focus_manager_1.FocusManager.getSkillFocuses(skill).length}`
        };
    });
    const skillSelect = new discord_js_1.StringSelectMenuBuilder()
        .setCustomId('focus_skill_select')
        .setPlaceholder('Choose a skill to assign focuses to')
        .addOptions(skillOptions);
    const continueButton = new discord_js_1.ButtonBuilder()
        .setCustomId('focus_continue')
        .setLabel('Continue to Drives')
        .setStyle(discord_js_1.ButtonStyle.Primary)
        .setEmoji('➡️');
    const row1 = new discord_js_1.ActionRowBuilder()
        .addComponents(skillSelect);
    const row2 = new discord_js_1.ActionRowBuilder()
        .addComponents(continueButton);
    await interaction.editReply({
        embeds: [embed],
        components: [row1, row2]
    });
}
async function handleAssignDrives(interaction, member) {
    await interaction.deferReply();
    try {
        const state = character_creation_state_1.characterCreationState.getState(member.id, interaction.guild.id);
        if (!state || !state.data.skills) {
            await interaction.editReply({
                content: '❌ You need to assign skills first! Use `/sheet skills`'
            });
            return;
        }
        const driveRows = createDriveAssignmentRows();
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('🎯 Assign Drive Points')
            .setDescription('Assign your drive values using the point-buy system.')
            .addFields({ name: '📊 Point-Buy Values', value: 'Use each value exactly once: **9, 7, 6, 5, 4**', inline: false }, { name: '🎯 Drives to Assign', value: '• **Duty** - Loyalty and obligation\n• **Faith** - Belief and conviction\n• **Justice** - Fairness and righteousness\n• **Power** - Control and influence\n• **Truth** - Knowledge and honesty', inline: false }, { name: '📝 Instructions', value: 'Select a drive and then choose its value', inline: false })
            .setColor(0x8B4513);
        await interaction.editReply({
            embeds: [embed],
            components: driveRows
        });
    }
    catch (error) {
        logger_1.logger.error('Drive assignment error:', error);
        throw error;
    }
}
async function handleDriveStatements(interaction, member) {
    await interaction.deferReply();
    const userId = member.id;
    const guildId = interaction.guild.id;
    const creationState = character_creation_state_1.characterCreationState.getState(userId, guildId);
    if (!creationState) {
        await interaction.editReply({ content: '❌ No character creation in progress. Use `/sheet create` to start!' });
        return;
    }
    if (!creationState.data.drives || Object.keys(creationState.data.drives).length < 5) {
        await interaction.editReply({ content: '❌ You need to assign drives first! Use `/sheet drives` to continue.' });
        return;
    }
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('📝 Assign Drive Statements')
        .setDescription('Create personal statements that define what each drive means to your character.')
        .addFields({ name: '🎯 Your Drives', value: Object.entries(creationState.data.drives).map(([drive, value]) => `• **${drive}**: ${value}`).join('\n'), inline: false }, { name: '📝 Statement Rules', value: '• Write a personal statement for each drive\n• Statements should reflect your character\'s beliefs\n• Keep statements concise but meaningful', inline: false }, { name: '📝 Instructions', value: 'Select a drive to write a statement for', inline: false })
        .setColor(0x8B4513);
    const driveOptions = Object.keys(creationState.data.drives).map(drive => ({
        label: drive,
        value: drive,
        description: `Write a statement for ${drive}`
    }));
    const driveSelect = new discord_js_1.StringSelectMenuBuilder()
        .setCustomId('statement_drive_select')
        .setPlaceholder('Choose a drive to write a statement for')
        .addOptions(driveOptions);
    const row = new discord_js_1.ActionRowBuilder()
        .addComponents(driveSelect);
    await interaction.editReply({
        embeds: [embed],
        components: [row]
    });
}
async function handleSelectTalents(interaction, member) {
    await interaction.deferReply();
    try {
        const state = character_creation_state_1.characterCreationState.getState(member.id, interaction.guild.id);
        if (!state) {
            await interaction.editReply({
                content: '❌ No character creation in progress. Use `/sheet create` first.'
            });
            return;
        }
        if (!state.data.skills || Object.keys(state.data.skills).length < 5) {
            await interaction.editReply({
                content: '❌ Please complete skill assignment first using `/sheet skills`.'
            });
            return;
        }
        if (!state.data.drives || Object.keys(state.data.drives).length < 5) {
            await interaction.editReply({
                content: '❌ Please complete drive assignment first using `/sheet drives`.'
            });
            return;
        }
        if (!state.data.talents) {
            state.data.talents = [];
        }
        const currentTalents = state.data.talents || [];
        const talentDisplay = currentTalents.length > 0
            ? currentTalents.map(talent => `• ${talent}`).join('\n')
            : 'None selected';
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('🎆 Select Talents')
            .setDescription('Choose talents that define your character\'s special abilities and training.')
            .addFields({ name: '📜 Talent Rules', value: '• Select 3 talents total\n• Each talent provides unique abilities\n• Choose talents that fit your character concept', inline: false }, { name: '🎯 Current Talents', value: talentDisplay, inline: false }, { name: '📝 Instructions', value: 'Select a talent category to browse available talents', inline: false })
            .setColor(0x9932CC);
        const categorySelect = new discord_js_1.StringSelectMenuBuilder()
            .setCustomId('talent_category_select')
            .setPlaceholder('Choose a talent category')
            .addOptions([
            { label: 'Combat Talents', value: 'combat', description: 'Fighting and warfare abilities' },
            { label: 'Social Talents', value: 'social', description: 'Interaction and influence abilities' },
            { label: 'Mental Talents', value: 'mental', description: 'Knowledge and analysis abilities' },
            { label: 'Physical Talents', value: 'physical', description: 'Movement and athletics abilities' },
            { label: 'Mystical Talents', value: 'mystical', description: 'Supernatural and rare abilities' },
            { label: 'General Talents', value: 'general', description: 'Versatile and common abilities' }
        ]);
        const row = new discord_js_1.ActionRowBuilder()
            .addComponents(categorySelect);
        await interaction.editReply({
            embeds: [embed],
            components: [row]
        });
    }
    catch (error) {
        logger_1.logger.error('Talent selection error:', error);
        throw error;
    }
}
async function handleSelectAssets(interaction, member) {
    await interaction.deferReply();
    try {
        const state = character_creation_state_1.characterCreationState.getState(member.id, interaction.guild.id);
        if (!state) {
            await interaction.editReply({
                content: '❌ No character creation in progress. Use `/sheet create` first.'
            });
            return;
        }
        if (!state.data.talents || state.data.talents.length < 3) {
            await interaction.editReply({
                content: '❌ Please complete talent selection first using `/sheet talents`.'
            });
            return;
        }
        if (!state.data.assets) {
            state.data.assets = [];
        }
        const currentAssets = state.data.assets || [];
        const assetDisplay = currentAssets.length > 0
            ? currentAssets.map(asset => `• ${asset}`).join('\n')
            : 'None selected';
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('🏠 Select Assets')
            .setDescription('Choose assets that represent your character\'s possessions, connections, and resources.')
            .addFields({ name: '📜 Asset Rules', value: '• Select up to 3 assets\n• Assets provide material advantages\n• Choose assets that fit your background', inline: false }, { name: '🎯 Current Assets', value: assetDisplay, inline: false }, { name: '📝 Instructions', value: 'Select an asset category to browse available assets', inline: false })
            .setColor(0xFFD700);
        const categorySelect = new discord_js_1.StringSelectMenuBuilder()
            .setCustomId('asset_category_select')
            .setPlaceholder('Choose an asset category')
            .addOptions([
            { label: 'Equipment & Weapons', value: 'equipment', description: 'Tools, weapons, and gear' },
            { label: 'Vehicles & Transport', value: 'vehicles', description: 'Ships, ornithopters, and mounts' },
            { label: 'Property & Holdings', value: 'property', description: 'Land, buildings, and facilities' },
            { label: 'Connections & Allies', value: 'connections', description: 'Contacts and relationships' },
            { label: 'Information & Secrets', value: 'information', description: 'Knowledge and intelligence' },
            { label: 'Wealth & Resources', value: 'wealth', description: 'Money, spice, and valuables' }
        ]);
        const row = new discord_js_1.ActionRowBuilder()
            .addComponents(categorySelect);
        await interaction.editReply({
            embeds: [embed],
            components: [row]
        });
    }
    catch (error) {
        logger_1.logger.error('Asset selection error:', error);
        throw error;
    }
}
async function handleOptionalDetails(interaction, member) {
    const house = interaction.options.getString('house');
    const homeworld = interaction.options.getString('homeworld');
    try {
        const state = character_creation_state_1.characterCreationState.getState(member.id, interaction.guild.id);
        if (!state) {
            await interaction.editReply({
                content: '❌ No character creation in progress. Use `/sheet create` first!'
            });
            return;
        }
        await character_creation_state_1.characterCreationState.updateState(member.id, interaction.guild.id, {
            data: {
                house,
                homeworld
            }
        });
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0xD4AF37)
            .setTitle('🏛️ Optional Details Updated')
            .setDescription(`Updated details for **${state.data.name}**`)
            .addFields({ name: '🏛️ House', value: house || 'None specified', inline: true }, { name: '🌍 Homeworld', value: homeworld || 'None specified', inline: true }, { name: '📋 Next Step', value: 'Use `/sheet review` to see your complete character', inline: false })
            .setFooter({ text: 'These details can be changed later' });
        await interaction.editReply({ embeds: [embed] });
    }
    catch (error) {
        logger_1.logger.error('Optional details error:', error);
        throw error;
    }
}
async function handleReviewCharacter(interaction, member) {
    await interaction.deferReply();
    try {
        const state = character_creation_state_1.characterCreationState.getState(member.id, interaction.guild.id);
        if (!state) {
            await interaction.editReply({
                content: '❌ No character creation in progress. Use `/sheet create` first!'
            });
            return;
        }
        const data = state.data;
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle(`📋 Character Review: ${data.name || 'Unnamed Character'}`)
            .setDescription(`*${data.concepts?.join(', ') || 'No concepts yet'}*`)
            .setColor(0x8B4513)
            .addFields({
            name: '🎯 Skills',
            value: data.skills ? Object.entries(data.skills)
                .map(([skill, value]) => `${skill}: ${value}`)
                .join('\n') : 'None assigned',
            inline: true
        }, {
            name: '🔥 Drives',
            value: Array.isArray(data.drives) ? data.drives.join('\n') : 'None assigned',
            inline: true
        }, {
            name: '🎯 Skill Focuses',
            value: data.focuses ? Object.entries(data.focuses)
                .map(([skill, focus]) => `${skill}: ${focus}`)
                .join('\n') : 'None assigned',
            inline: false
        }, {
            name: '💭 Drive Statements',
            value: Array.isArray(data.statements) ? data.statements.join('\n\n') : 'No statements yet. Use /sheet statement to add some.',
            inline: false
        }, {
            name: '⭐ Talents',
            value: data.talents && data.talents.length > 0
                ? data.talents.map((talent) => `**${talent}**`).join('\n')
                : 'None selected',
            inline: false
        }, {
            name: '🛡️ Assets',
            value: data.assets && data.assets.length > 0
                ? data.assets.map((asset) => `**${asset}**`).join('\n')
                : 'None selected',
            inline: false
        });
        if (data.house || data.homeworld) {
            embed.addFields({
                name: '🏛️ Background',
                value: [
                    data.house ? `**House:** ${data.house}` : '',
                    data.homeworld ? `**Homeworld:** ${data.homeworld}` : ''
                ].filter(Boolean).join('\n'),
                inline: false
            });
        }
        const finalizeButton = new discord_js_1.ActionRowBuilder()
            .addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId('finalize_character')
            .setLabel('✅ Finalize Character')
            .setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder()
            .setCustomId('cancel_creation')
            .setLabel('❌ Cancel Creation')
            .setStyle(discord_js_1.ButtonStyle.Danger));
        await interaction.editReply({
            embeds: [embed],
            components: [finalizeButton]
        });
    }
    catch (error) {
        logger_1.logger.error('Character review error:', error);
        throw error;
    }
}
async function handleFinalizeCharacter(interaction, member) {
    await interaction.deferReply();
    try {
        const state = character_creation_state_1.characterCreationState.getState(member.id, interaction.guild.id);
        if (!state) {
            await interaction.editReply({
                content: '❌ No character creation in progress. Use `/sheet create` first!'
            });
            return;
        }
        await interaction.editReply({
            content: '🚧 Character finalization coming soon!'
        });
    }
    catch (error) {
        logger_1.logger.error('Character finalization error:', error);
        throw error;
    }
}
async function handleCancelCreation(interaction, member) {
    try {
        const state = character_creation_state_1.characterCreationState.getState(member.id, interaction.guild.id);
        if (!state) {
            await interaction.reply({
                content: '❌ No character creation in progress.',
                ephemeral: true
            });
            return;
        }
        const characterName = state.data.name || 'Unnamed Character';
        await character_creation_state_1.characterCreationState.cancelCreation(member.id, interaction.guild.id);
        if (interaction.replied || interaction.deferred) {
            await interaction.editReply({
                content: `❌ Character creation for **${characterName}** has been cancelled.`,
                embeds: [],
                components: []
            });
        }
        else {
            await interaction.reply({
                content: `❌ Character creation for **${characterName}** has been cancelled.`,
                ephemeral: true
            });
        }
        logger_1.logger.info(`Cancelled character creation for user ${member.id} in guild ${interaction.guild.id}`);
    }
    catch (error) {
        logger_1.logger.error('Cancel creation error:', error);
        throw error;
    }
}
async function handleViewCharacter(interaction, member) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const targetMember = interaction.guild.members.cache.get(targetUser.id);
    if (!targetMember) {
        await interaction.reply({ content: 'User not found in this server.', ephemeral: true });
        return;
    }
    const character = character_manager_1.characterManager.getUserActiveCharacter(targetUser.id, interaction.guild.id);
    if (!character) {
        const message = targetUser.id === member.id
            ? 'You don\'t have a character yet. Use `/sheet create` to make one!'
            : `${targetUser.displayName} doesn't have a character in this server.`;
        await interaction.reply({ content: message, ephemeral: true });
        return;
    }
    const embed = createCharacterEmbed(character, targetMember);
    await interaction.reply({ embeds: [embed] });
}
async function handleEditCharacter(interaction, member) {
    const field = interaction.options.getString('field');
    const value = interaction.options.getString('value');
    const character = character_manager_1.characterManager.getUserActiveCharacter(member.id, interaction.guild.id);
    if (!character) {
        await interaction.reply({ content: 'You don\'t have a character yet. Use `/sheet create` to make one!', ephemeral: true });
        return;
    }
    await interaction.deferReply({ ephemeral: true });
    try {
        const updates = {};
        updates[field] = value;
        await character_manager_1.characterManager.updateCharacter(character.id, updates);
        await interaction.editReply({ content: `✅ Updated ${field} to "${value}"` });
    }
    catch (error) {
        await interaction.editReply({ content: `Failed to update character: ${error}` });
    }
}
async function handleAddSkill(interaction, member) {
    const skillName = interaction.options.getString('name');
    const skillValue = interaction.options.getInteger('value');
    const focusString = interaction.options.getString('focus');
    const character = character_manager_1.characterManager.getUserActiveCharacter(member.id, interaction.guild.id);
    if (!character) {
        await interaction.reply({ content: 'You don\'t have a character yet. Use `/sheet create` to make one!', ephemeral: true });
        return;
    }
    await interaction.deferReply({ ephemeral: true });
    try {
        const focus = focusString ? focusString.split(',').map((f) => f.trim()) : undefined;
        await character_manager_1.characterManager.addSkill(character.id, skillName, skillValue, focus);
        const focusText = focus ? ` (Focus: ${focus.join(', ')})` : '';
        await interaction.editReply({ content: `✅ Set ${skillName} to ${skillValue}${focusText}` });
    }
    catch (error) {
        await interaction.editReply({ content: `Failed to add skill: ${error}` });
    }
}
async function handleAddDrive(interaction, member) {
    const driveName = interaction.options.getString('name');
    const driveStatement = interaction.options.getString('statement');
    const driveValue = interaction.options.getInteger('value');
    const character = character_manager_1.characterManager.getUserActiveCharacter(member.id, interaction.guild.id);
    if (!character) {
        await interaction.reply({ content: 'You don\'t have a character yet. Use `/sheet create` to make one!', ephemeral: true });
        return;
    }
    await interaction.deferReply({ ephemeral: true });
    try {
        await character_manager_1.characterManager.addDrive(character.id, driveName, driveStatement, driveValue);
        await interaction.editReply({
            content: `✅ Added drive: **${driveName}** (${driveValue})\n"${driveStatement}"`
        });
    }
    catch (error) {
        await interaction.editReply({ content: `Failed to add drive: ${error}` });
    }
}
async function handleAddAsset(interaction, member) {
    const assetName = interaction.options.getString('name');
    const assetType = interaction.options.getString('type');
    const assetDescription = interaction.options.getString('description');
    const character = character_manager_1.characterManager.getUserActiveCharacter(member.id, interaction.guild.id);
    if (!character) {
        await interaction.reply({ content: 'You don\'t have a character yet. Use `/sheet create` to make one!', ephemeral: true });
        return;
    }
    await interaction.deferReply({ ephemeral: true });
    try {
        const asset = {
            name: assetName,
            type: assetType,
            description: assetDescription
        };
        await character_manager_1.characterManager.addAsset(character.id, asset);
        await interaction.editReply({
            content: `✅ Added ${assetType}: **${assetName}**\n${assetDescription}`
        });
    }
    catch (error) {
        await interaction.editReply({ content: `Failed to add asset: ${error}` });
    }
}
async function handleUpdateDetermination(interaction, member) {
    const change = interaction.options.getInteger('change');
    const character = character_manager_1.characterManager.getUserActiveCharacter(member.id, interaction.guild.id);
    if (!character) {
        await interaction.reply({ content: 'You don\'t have a character yet. Use `/sheet create` to make one!', ephemeral: true });
        return;
    }
    await interaction.deferReply({ ephemeral: true });
    try {
        const updatedCharacter = await character_manager_1.characterManager.updateDetermination(character.id, change);
        const changeText = change > 0 ? `+${change}` : change.toString();
        await interaction.editReply({
            content: `✅ Determination ${changeText}: ${updatedCharacter.determination}/${updatedCharacter.maxDetermination}`
        });
    }
    catch (error) {
        await interaction.editReply({ content: `Failed to update determination: ${error}` });
    }
}
async function handleDeleteCharacter(interaction, member) {
    const userCharacters = character_manager_1.characterManager.getUserCharacters(member.id, interaction.guild.id);
    if (userCharacters.length === 0) {
        await interaction.reply({ content: 'You don\'t have any characters to delete.', ephemeral: true });
        return;
    }
    if (userCharacters.length === 1) {
        const character = userCharacters[0];
        await interaction.deferReply({ ephemeral: true });
        try {
            await character_manager_1.characterManager.deleteCharacter(character.id, member.id);
            await interaction.editReply({
                content: `💀 Character **${character.name}** has been deleted. Farewell, ${character.concepts.join(', ')}.`
            });
        }
        catch (error) {
            await interaction.editReply({ content: `Failed to delete character: ${error}` });
        }
        return;
    }
    const selectMenu = new discord_js_1.StringSelectMenuBuilder()
        .setCustomId('delete_character_select')
        .setPlaceholder('Choose a character to delete')
        .addOptions(userCharacters.map(char => ({
        label: char.name,
        value: char.id,
        description: `${char.concepts.join(', ')} - ${char.house || 'No House'}`,
        emoji: '💀'
    })));
    const row = new discord_js_1.ActionRowBuilder()
        .addComponents(selectMenu);
    const cancelButton = new discord_js_1.ButtonBuilder()
        .setCustomId('delete_character_cancel')
        .setLabel('Cancel')
        .setStyle(discord_js_1.ButtonStyle.Secondary)
        .setEmoji('❌');
    const buttonRow = new discord_js_1.ActionRowBuilder()
        .addComponents(cancelButton);
    await interaction.reply({
        content: `You have **${userCharacters.length}** characters. Select one to delete:`,
        components: [row, buttonRow],
        ephemeral: true
    });
}
function createCharacterEmbed(character, member) {
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(0xD4AF37)
        .setTitle(`🎭 ${character.name}`)
        .setDescription(`*${character.concepts.join(', ')}*`)
        .setThumbnail(member.displayAvatarURL())
        .addFields({
        name: '🏛️ Background',
        value: `**House:** ${character.house || 'None'}\n**Homeworld:** ${character.homeworld || 'Unknown'}`,
        inline: true
    }, {
        name: '💪 Determination',
        value: `${character.determination}/${character.maxDetermination}`,
        inline: true
    }, {
        name: '📊 Experience',
        value: `Available: ${character.experience.available}\nTotal: ${character.experience.total}`,
        inline: true
    });
    const attributes = Object.entries(character.attributes)
        .map(([name, value]) => `**${name.charAt(0).toUpperCase() + name.slice(1)}:** ${value}`)
        .join('\n');
    embed.addFields({ name: '⚡ Attributes', value: attributes, inline: true });
    const skills = character.skills
        .filter(skill => skill.value > 0)
        .map(skill => {
        const focusText = skill.focus && skill.focus.length > 0 ? ` (${skill.focus.join(', ')})` : '';
        return `**${skill.name}:** ${skill.value}${focusText}`;
    })
        .join('\n');
    if (skills) {
        embed.addFields({ name: '🎯 Skills', value: skills, inline: true });
    }
    if (character.drives.length > 0) {
        const drives = character.drives
            .map(drive => `**${drive.name}** (${drive.value}): ${drive.statement}`)
            .join('\n');
        embed.addFields({ name: '🔥 Drives', value: drives, inline: false });
    }
    if (character.assets.length > 0) {
        const assets = character.assets
            .map(asset => `**${asset.name}** (${asset.type}): ${asset.description}`)
            .join('\n');
        embed.addFields({ name: '🎒 Assets', value: assets.length > 1024 ? assets.substring(0, 1020) + '...' : assets, inline: false });
    }
    if (character.traits.length > 0) {
        const traits = character.traits
            .map(trait => `**${trait.name}** (${trait.type}): ${trait.description}`)
            .join('\n');
        embed.addFields({ name: '✨ Traits', value: traits.length > 1024 ? traits.substring(0, 1020) + '...' : traits, inline: false });
    }
    embed.setFooter({ text: `Created: ${new Date(character.createdAt).toLocaleDateString()}` })
        .setTimestamp();
    return embed;
}
async function handleButtonInteraction(interaction) {
    const member = interaction.member;
    if (interaction.customId === 'focus_back') {
        await handleFocusBackButton(interaction, member);
    }
    else if (interaction.customId === 'focus_continue') {
        await handleFocusContinueButton(interaction, member);
    }
    else if (interaction.customId.startsWith('focus_remove_')) {
        await handleFocusRemoveInteraction(interaction, member);
    }
}
async function handleInteraction(interaction) {
    const member = interaction.member;
    if (interaction.customId === 'skill_select' || interaction.customId.startsWith('skill_select_')) {
        await handleSkillSelectInteraction(interaction, member);
    }
    else if (interaction.customId === 'skill_value_select' || interaction.customId.startsWith('skill_value_')) {
        await handleSkillValueInteraction(interaction, member);
    }
    else if (interaction.customId === 'drive_select' || interaction.customId.startsWith('drive_select_')) {
        await handleDriveSelectInteraction(interaction, member);
    }
    else if (interaction.customId === 'drive_value_select' || interaction.customId.startsWith('drive_value_')) {
        await handleDriveValueInteraction(interaction, member);
    }
    else if (interaction.customId === 'focus_skill_select' || interaction.customId.startsWith('focus_skill_')) {
        await handleFocusSkillSelectInteraction(interaction, member);
    }
    else if (interaction.customId.startsWith('focus_select_')) {
        await handleFocusSelectInteraction(interaction, member);
    }
    else if (interaction.customId.startsWith('focus_remove_')) {
        await handleFocusRemoveInteraction(interaction, member);
    }
    else if (interaction.customId === 'focus_back') {
        await handleAssignFocuses(interaction, member);
    }
    else if (interaction.customId === 'statement_drive_select') {
        await handleStatementDriveSelectInteraction(interaction, member);
    }
    else if (interaction.customId.startsWith('statement_input_')) {
        await handleStatementModalSubmit(interaction, member);
    }
    else if (interaction.customId === 'talent_category_select') {
        await handleTalentCategorySelectInteraction(interaction, member);
    }
    else if (interaction.customId === 'talent_select') {
        await handleTalentSelectInteraction(interaction, member);
    }
    else if (interaction.customId === 'asset_category_select') {
        await handleAssetCategorySelectInteraction(interaction, member);
    }
    else if (interaction.customId === 'asset_select') {
        await handleAssetSelectInteraction(interaction, member);
    }
}
async function handleSkillSelectInteraction(interaction, member) {
    const selectedSkill = interaction.values[0];
    const userId = member.id;
    const guildId = interaction.guild.id;
    const creationState = character_creation_state_1.characterCreationState.getState(userId, guildId);
    if (!creationState) {
        await interaction.reply({ content: '❌ No character creation in progress. Use `/sheet create` to start!', flags: discord_js_1.MessageFlags.Ephemeral });
        return;
    }
    if (!creationState.tempData)
        creationState.tempData = {};
    creationState.tempData.selectedSkill = selectedSkill;
    const availableValues = [9, 7, 6, 5, 4].filter(value => !creationState.data.skills || !Object.values(creationState.data.skills).includes(value));
    if (availableValues.length === 0) {
        await interaction.reply({ content: '❌ All values have been assigned!', flags: discord_js_1.MessageFlags.Ephemeral });
        return;
    }
    const valueOptions = availableValues.map(value => ({
        label: value.toString(),
        value: value.toString(),
        description: `Assign ${value} to ${selectedSkill}`
    }));
    const valueSelectMenu = new discord_js_1.StringSelectMenuBuilder()
        .setCustomId(`skill_value_${userId}`)
        .setPlaceholder(`Choose the value for ${selectedSkill}`)
        .addOptions(valueOptions);
    const row = new discord_js_1.ActionRowBuilder()
        .addComponents(valueSelectMenu);
    await interaction.update({
        content: `Selected **${selectedSkill}**. Now choose its value:`,
        components: [row]
    });
}
async function handleSkillValueInteraction(interaction, member) {
    const selectedValue = parseInt(interaction.values[0]);
    const userId = member.id;
    const guildId = interaction.guild.id;
    const creationState = character_creation_state_1.characterCreationState.getState(userId, guildId);
    if (!creationState || !creationState.tempData?.selectedSkill) {
        await interaction.reply({ content: '❌ No skill selection in progress.', flags: discord_js_1.MessageFlags.Ephemeral });
        return;
    }
    const selectedSkill = creationState.tempData.selectedSkill;
    if (!creationState.data.skills)
        creationState.data.skills = {};
    creationState.data.skills[selectedSkill] = selectedValue;
    if (creationState.tempData) {
        delete creationState.tempData.selectedSkill;
    }
    await character_creation_state_1.characterCreationState.updateState(userId, guildId, {
        data: { skills: creationState.data.skills }
    });
    const assignedSkills = Object.keys(creationState.data.skills || {});
    const remainingSkills = ['Battle', 'Communicate', 'Discipline', 'Move', 'Understand'].filter(skill => !assignedSkills.includes(skill));
    if (remainingSkills.length === 0) {
        const skillsList = Object.entries(creationState.data.skills || {})
            .map(([skill, value]) => `• **${skill}**: ${value}`)
            .join('\n');
        await interaction.update({
            content: `✅ **All Skills Assigned!**\n\n${skillsList}\n\n🎯 **Next Step:** Use \`/sheet focuses\` to add skill focuses.`,
            components: []
        });
    }
    else {
        const availableValues = [9, 7, 6, 5, 4].filter(value => !Object.values(creationState.data.skills || {}).includes(value));
        const skillOptions = remainingSkills.map(skill => ({
            label: skill,
            value: skill,
            description: `Assign a value to ${skill}`
        }));
        const skillSelectMenu = new discord_js_1.StringSelectMenuBuilder()
            .setCustomId(`skill_select_${userId}`)
            .setPlaceholder('Choose a skill to assign')
            .addOptions(skillOptions);
        const row = new discord_js_1.ActionRowBuilder()
            .addComponents(skillSelectMenu);
        const assignedList = Object.entries(creationState.data.skills || {})
            .map(([skill, value]) => `• **${skill}**: ${value}`)
            .join('\n');
        await interaction.update({
            content: `✅ Set **${selectedSkill}** to **${selectedValue}**\n\n**Assigned:**\n${assignedList}\n\n**Available Values:** ${availableValues.join(', ')}`,
            components: [row]
        });
    }
}
async function handleDriveSelectInteraction(interaction, member) {
    const selectedDrive = interaction.values[0];
    const userId = member.id;
    const guildId = interaction.guild.id;
    const creationState = character_creation_state_1.characterCreationState.getState(userId, guildId);
    if (!creationState) {
        await interaction.reply({ content: '❌ No character creation in progress. Use `/sheet create` to start!', flags: discord_js_1.MessageFlags.Ephemeral });
        return;
    }
    if (!creationState.tempData)
        creationState.tempData = {};
    creationState.tempData.selectedDrive = selectedDrive;
    const availableValues = [9, 7, 6, 5, 4].filter((value) => !Array.isArray(creationState.data.drives) || !creationState.data.drives.some((d) => d.startsWith(`${value}:`)));
    if (availableValues.length === 0) {
        await interaction.reply({ content: '❌ All values have been assigned!', flags: discord_js_1.MessageFlags.Ephemeral });
        return;
    }
    const valueOptions = availableValues.map(value => ({
        label: value.toString(),
        value: value.toString(),
        description: `Assign ${value} to ${selectedDrive}`
    }));
    const valueSelectMenu = new discord_js_1.StringSelectMenuBuilder()
        .setCustomId(`drive_value_${userId}`)
        .setPlaceholder(`Choose the value for ${selectedDrive}`)
        .addOptions(valueOptions);
    const row = new discord_js_1.ActionRowBuilder()
        .addComponents(valueSelectMenu);
    await interaction.update({
        content: `Selected **${selectedDrive}**. Now choose its value:`,
        components: [row]
    });
}
async function handleDriveValueInteraction(interaction, member) {
    const selectedValue = parseInt(interaction.values[0]);
    const userId = member.id;
    const guildId = interaction.guild.id;
    const creationState = character_creation_state_1.characterCreationState.getState(userId, guildId);
    if (!creationState || !creationState.tempData?.selectedDrive) {
        await interaction.reply({ content: '❌ No drive selection in progress.', flags: discord_js_1.MessageFlags.Ephemeral });
        return;
    }
    const selectedDrive = creationState.tempData.selectedDrive;
    if (!creationState.data.drives) {
        creationState.data.drives = {};
    }
    const [driveName, driveValue] = selectedDrive.split(':').map(s => s.trim());
    if (driveName && !isNaN(Number(driveValue))) {
        creationState.data.drives[driveName] = Number(driveValue);
    }
    if (creationState.tempData) {
        delete creationState.tempData.selectedDrive;
    }
    await character_creation_state_1.characterCreationState.updateState(userId, guildId, {
        data: { drives: creationState.data.drives }
    });
    const assignedDrives = Array.isArray(creationState.data.drives) ? creationState.data.drives : [];
    const allDrives = ['Duty', 'Faith', 'Justice', 'Power', 'Truth'];
    const remainingDrives = allDrives.filter((drive) => !assignedDrives.includes(drive));
    if (remainingDrives.length === 0) {
        const drivesList = Array.isArray(creationState.data.drives) ? creationState.data.drives : [];
        await interaction.update({
            content: `✅ **All Drives Assigned!**\n\n${Array.isArray(drivesList) ? drivesList.join(', ') : ''}\n\n📝 **Next Step:** Use \`/sheet statements\` to add drive statements.`,
            components: []
        });
    }
    else {
        const availableValues = [9, 7, 6, 5, 4].filter((value) => !Array.isArray(creationState.data.drives) || !creationState.data.drives.some((d) => d.startsWith(`${value}:`)));
        const driveOptions = remainingDrives.map((drive) => ({
            label: drive,
            value: drive,
            description: `Assign a value to ${drive}`
        }));
        const driveSelectMenu = new discord_js_1.StringSelectMenuBuilder()
            .setCustomId('drive_select')
            .setPlaceholder('Choose a drive to assign')
            .addOptions(driveOptions);
        const row = new discord_js_1.ActionRowBuilder()
            .addComponents(driveSelectMenu);
        const assignedList = Array.isArray(creationState.data.drives) ? creationState.data.drives : [];
        await interaction.update({
            content: `✅ Set **${selectedDrive}** to **${selectedValue}**\n\n**Assigned:**\n${Array.isArray(assignedList) ? assignedList.join(', ') : ''}\n\n**Available Values:** ${Array.isArray(availableValues) ? availableValues.join(', ') : ''}`,
            components: [row]
        });
    }
}
async function handleFocusSkillSelectInteraction(interaction, member) {
    const selectedSkill = interaction.values[0];
    const userId = member.id;
    const guildId = interaction.guild.id;
    const creationState = character_creation_state_1.characterCreationState.getState(userId, guildId);
    if (!creationState) {
        await interaction.reply({ content: '❌ No character creation in progress.', flags: discord_js_1.MessageFlags.Ephemeral });
        return;
    }
    const availableFocuses = focus_manager_1.FocusManager.getSkillFocuses(selectedSkill);
    const currentFocus = creationState.data.focuses?.[selectedSkill] || '';
    const currentFocuses = currentFocus ? [currentFocus] : [];
    if (availableFocuses.length === 0) {
        await interaction.reply({
            content: `❌ No focuses available for ${selectedSkill}.`,
            flags: discord_js_1.MessageFlags.Ephemeral
        });
        return;
    }
    const selectableFocuses = availableFocuses.filter(focus => !currentFocuses.includes(focus));
    if (selectableFocuses.length === 0) {
        await interaction.reply({
            content: `❌ No available focuses for ${selectedSkill}.`,
            flags: discord_js_1.MessageFlags.Ephemeral
        });
        return;
    }
    const focusOptions = selectableFocuses.map(focus => ({
        label: focus,
        value: focus,
        description: `Assign ${focus} to ${selectedSkill}`
    }));
    const focusSelectMenu = new discord_js_1.StringSelectMenuBuilder()
        .setCustomId(`focus_select_${selectedSkill}`)
        .setPlaceholder('Choose a focus')
        .addOptions(focusOptions);
    const row = new discord_js_1.ActionRowBuilder()
        .addComponents(focusSelectMenu);
    await interaction.reply({
        content: `Selected **${selectedSkill}**. Now choose its focus:`,
        components: [row],
        flags: discord_js_1.MessageFlags.Ephemeral
    });
}
async function handleFocusSelectInteraction(interaction, member) {
    const selectedFocus = interaction.values[0];
    const userId = member.id;
    const guildId = interaction.guild.id;
    const creationState = character_creation_state_1.characterCreationState.getState(userId, guildId);
    if (!creationState) {
        await interaction.reply({ content: '❌ No character creation in progress.', flags: discord_js_1.MessageFlags.Ephemeral });
        return;
    }
    if (!creationState.data.focuses) {
        creationState.data.focuses = {};
    }
    const selectedSkill = interaction.customId.replace('focus_select_', '');
    creationState.data.focuses[selectedSkill] = selectedFocus;
    await character_creation_state_1.characterCreationState.updateState(userId, guildId, {
        data: { focuses: creationState.data.focuses }
    });
    const focusDisplay = Object.keys(creationState.data.skills || {}).map(skill => {
        const focus = creationState.data.focuses?.[skill] || '';
        const focusText = focus ? focus : 'None selected';
        return `• **${skill}**: ${focusText}`;
    }).join('\n');
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('✅ Focus Added!')
        .setDescription(`**${selectedFocus}** added to **${selectedSkill}**`)
        .addFields([
        { name: '📊 Current Skills & Focuses', value: focusDisplay, inline: false },
        { name: '🎯 Next Step', value: 'Continue adding focuses or use the "Continue to Drives" button when ready.', inline: false }
    ])
        .setColor(0x00FF00);
    await interaction.update({
        embeds: [embed],
        components: []
    });
}
async function handleFocusRemoveInteraction(interaction, member) {
    const userId = member.id;
    const guildId = interaction.guild.id;
    const skillName = interaction.customId.replace('focus_remove_', '');
    const creationState = character_creation_state_1.characterCreationState.getState(userId, guildId);
    if (!creationState) {
        await interaction.reply({ content: '❌ No character creation in progress.', flags: discord_js_1.MessageFlags.Ephemeral });
        return;
    }
    if (creationState.data.focuses && creationState.data.focuses[skillName]) {
        creationState.data.focuses[skillName] = '';
        await character_creation_state_1.characterCreationState.updateState(userId, guildId, {
            data: { focuses: creationState.data.focuses }
        });
    }
    const message = creationState.data.focuses?.[skillName] ?
        `✅ Removed focus from ${skillName}. You can now select a new focus for this skill.` :
        `❌ No focus found to remove for ${skillName}.`;
    await interaction.reply({
        content: message,
        flags: discord_js_1.MessageFlags.Ephemeral
    });
}
async function handleFocusBackButton(interaction, member) {
    await handleAssignFocuses(interaction, member);
}
async function handleFocusContinueButton(interaction, member) {
    await handleAssignDrives(interaction, member);
}
async function handleTalentCategorySelectInteraction(interaction, member) {
    const selectedCategory = interaction.values[0];
    const userId = member.id;
    const guildId = interaction.guild.id;
    const creationState = character_creation_state_1.characterCreationState.getState(userId, guildId);
    if (!creationState) {
        await interaction.reply({ content: '❌ No character creation in progress.', flags: discord_js_1.MessageFlags.Ephemeral });
        return;
    }
    const talentsByCategory = {
        combat: [
            { label: 'Weapon Master', value: 'weapon_master', description: 'Expertise with specific weapon types' },
            { label: 'Combat Reflexes', value: 'combat_reflexes', description: 'Enhanced reaction time in battle' },
            { label: 'Tactical Awareness', value: 'tactical_awareness', description: 'Superior battlefield positioning' },
            { label: 'Berserker Rage', value: 'berserker_rage', description: 'Fierce combat fury' },
            { label: 'Shield Wall', value: 'shield_wall', description: 'Defensive combat mastery' }
        ],
        social: [
            { label: 'Silver Tongue', value: 'silver_tongue', description: 'Exceptional persuasion abilities' },
            { label: 'Court Intrigue', value: 'court_intrigue', description: 'Navigate political schemes' },
            { label: 'Inspiring Presence', value: 'inspiring_presence', description: 'Rally and motivate others' },
            { label: 'Merchant\'s Eye', value: 'merchants_eye', description: 'Keen sense for trade and value' },
            { label: 'Diplomatic Immunity', value: 'diplomatic_immunity', description: 'Protected status in negotiations' }
        ],
        mental: [
            { label: 'Eidetic Memory', value: 'eidetic_memory', description: 'Perfect recall of information' },
            { label: 'Strategic Mind', value: 'strategic_mind', description: 'Long-term planning expertise' },
            { label: 'Pattern Recognition', value: 'pattern_recognition', description: 'Spot hidden connections' },
            { label: 'Speed Reading', value: 'speed_reading', description: 'Rapid information processing' },
            { label: 'Mental Fortress', value: 'mental_fortress', description: 'Resistance to mental intrusion' }
        ],
        physical: [
            { label: 'Parkour', value: 'parkour', description: 'Exceptional mobility and climbing' },
            { label: 'Iron Constitution', value: 'iron_constitution', description: 'Resistance to toxins and disease' },
            { label: 'Cat\'s Grace', value: 'cats_grace', description: 'Enhanced balance and agility' },
            { label: 'Endurance Runner', value: 'endurance_runner', description: 'Exceptional stamina' },
            { label: 'Steady Hands', value: 'steady_hands', description: 'Precise manual dexterity' }
        ],
        mystical: [
            { label: 'Prescient Dreams', value: 'prescient_dreams', description: 'Glimpses of possible futures' },
            { label: 'Spice Tolerance', value: 'spice_tolerance', description: 'Resistance to melange effects' },
            { label: 'Voice Training', value: 'voice_training', description: 'Basic Bene Gesserit techniques' },
            { label: 'Desert Survival', value: 'desert_survival', description: 'Thrive in harsh environments' },
            { label: 'Water Discipline', value: 'water_discipline', description: 'Fremen-like water conservation' }
        ],
        general: [
            { label: 'Jack of All Trades', value: 'jack_of_trades', description: 'Competence in many areas' },
            { label: 'Lucky', value: 'lucky', description: 'Fortune favors you' },
            { label: 'Contacts', value: 'contacts', description: 'Network of useful allies' },
            { label: 'Wealthy', value: 'wealthy', description: 'Significant financial resources' },
            { label: 'Reputation', value: 'reputation', description: 'Well-known for specific deeds' }
        ]
    };
    const talents = talentsByCategory[selectedCategory] || [];
    if (talents.length === 0) {
        await interaction.reply({ content: '❌ No talents found for this category.', flags: discord_js_1.MessageFlags.Ephemeral });
        return;
    }
    const currentTalents = creationState.data.talents || [];
    const availableTalents = talents.filter(talent => !currentTalents.includes(talent.label));
    if (availableTalents.length === 0) {
        await interaction.reply({ content: '❌ All talents in this category are already selected.', flags: discord_js_1.MessageFlags.Ephemeral });
        return;
    }
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle(`🎆 ${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Talents`)
        .setDescription('Select a talent to add to your character.')
        .addFields({ name: '🎯 Current Talents', value: currentTalents.length > 0 ? currentTalents.map(t => `• ${t}`).join('\n') : 'None selected', inline: false }, { name: '📝 Remaining Slots', value: `${Math.max(0, 3 - currentTalents.length)} / 3`, inline: false })
        .setColor(0x9932CC);
    const talentSelect = new discord_js_1.StringSelectMenuBuilder()
        .setCustomId('talent_select')
        .setPlaceholder('Choose a talent')
        .addOptions(availableTalents.slice(0, 25));
    const row = new discord_js_1.ActionRowBuilder()
        .addComponents(talentSelect);
    await interaction.reply({
        embeds: [embed],
        components: [row],
        flags: discord_js_1.MessageFlags.Ephemeral
    });
}
async function handleTalentSelectInteraction(interaction, member) {
    const selectedTalent = interaction.values[0];
    const userId = member.id;
    const guildId = interaction.guild.id;
    const creationState = character_creation_state_1.characterCreationState.getState(userId, guildId);
    if (!creationState) {
        await interaction.reply({ content: '❌ No character creation in progress.', flags: discord_js_1.MessageFlags.Ephemeral });
        return;
    }
    if (!creationState.data.talents) {
        creationState.data.talents = [];
    }
    if (creationState.data.talents.length >= 3) {
        await interaction.reply({ content: '❌ You already have 3 talents selected.', flags: discord_js_1.MessageFlags.Ephemeral });
        return;
    }
    const allTalents = [
        { label: 'Weapon Master', value: 'weapon_master' },
        { label: 'Combat Reflexes', value: 'combat_reflexes' },
        { label: 'Tactical Awareness', value: 'tactical_awareness' },
        { label: 'Berserker Rage', value: 'berserker_rage' },
        { label: 'Shield Wall', value: 'shield_wall' },
        { label: 'Silver Tongue', value: 'silver_tongue' },
        { label: 'Court Intrigue', value: 'court_intrigue' },
        { label: 'Inspiring Presence', value: 'inspiring_presence' },
        { label: 'Merchant\'s Eye', value: 'merchants_eye' },
        { label: 'Diplomatic Immunity', value: 'diplomatic_immunity' },
        { label: 'Eidetic Memory', value: 'eidetic_memory' },
        { label: 'Strategic Mind', value: 'strategic_mind' },
        { label: 'Pattern Recognition', value: 'pattern_recognition' },
        { label: 'Speed Reading', value: 'speed_reading' },
        { label: 'Mental Fortress', value: 'mental_fortress' },
        { label: 'Parkour', value: 'parkour' },
        { label: 'Iron Constitution', value: 'iron_constitution' },
        { label: 'Cat\'s Grace', value: 'cats_grace' },
        { label: 'Endurance Runner', value: 'endurance_runner' },
        { label: 'Steady Hands', value: 'steady_hands' },
        { label: 'Prescient Dreams', value: 'prescient_dreams' },
        { label: 'Spice Tolerance', value: 'spice_tolerance' },
        { label: 'Voice Training', value: 'voice_training' },
        { label: 'Desert Survival', value: 'desert_survival' },
        { label: 'Water Discipline', value: 'water_discipline' },
        { label: 'Jack of All Trades', value: 'jack_of_trades' },
        { label: 'Lucky', value: 'lucky' },
        { label: 'Contacts', value: 'contacts' },
        { label: 'Wealthy', value: 'wealthy' },
        { label: 'Reputation', value: 'reputation' }
    ];
    const talent = allTalents.find(t => t.value === selectedTalent);
    if (!talent) {
        await interaction.reply({ content: '❌ Invalid talent selection.', flags: discord_js_1.MessageFlags.Ephemeral });
        return;
    }
    if (creationState.data.talents.includes(talent.label)) {
        await interaction.reply({ content: '❌ This talent is already selected.', flags: discord_js_1.MessageFlags.Ephemeral });
        return;
    }
    creationState.data.talents.push(talent.label);
    await character_creation_state_1.characterCreationState.updateState(userId, guildId, {
        data: { talents: creationState.data.talents }
    });
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('✅ Talent Added!')
        .setDescription(`**${talent.label}** has been added to your character.`)
        .addFields({ name: '🎯 Current Talents', value: creationState.data.talents.map(t => `• ${t}`).join('\n'), inline: false }, { name: '📝 Remaining Slots', value: `${Math.max(0, 3 - creationState.data.talents.length)} / 3`, inline: false }, { name: '🎯 Next Step', value: creationState.data.talents.length >= 3 ? 'Use `/sheet assets` to continue!' : 'Select another talent category to add more talents.', inline: false })
        .setColor(0x00FF00);
    let components = [];
    if (creationState.data.talents.length < 3) {
        const categorySelect = new discord_js_1.StringSelectMenuBuilder()
            .setCustomId('talent_category_select')
            .setPlaceholder('Choose another talent category')
            .addOptions([
            { label: 'Combat Talents', value: 'combat', description: 'Fighting and warfare abilities' },
            { label: 'Social Talents', value: 'social', description: 'Interaction and influence abilities' },
            { label: 'Mental Talents', value: 'mental', description: 'Knowledge and analysis abilities' },
            { label: 'Physical Talents', value: 'physical', description: 'Movement and athletics abilities' },
            { label: 'Mystical Talents', value: 'mystical', description: 'Supernatural and rare abilities' },
            { label: 'General Talents', value: 'general', description: 'Versatile and common abilities' }
        ]);
        const row = new discord_js_1.ActionRowBuilder()
            .addComponents(categorySelect);
        components = [row];
    }
    await interaction.update({
        embeds: [embed],
        components: components
    });
}
async function handleAssetCategorySelectInteraction(interaction, member) {
    const selectedCategory = interaction.values[0];
    const userId = member.id;
    const guildId = interaction.guild.id;
    const creationState = character_creation_state_1.characterCreationState.getState(userId, guildId);
    if (!creationState) {
        await interaction.reply({ content: '❌ No character creation in progress.', flags: discord_js_1.MessageFlags.Ephemeral });
        return;
    }
    const assetsByCategory = {
        equipment: [
            { label: 'Crysknife', value: 'crysknife', description: 'Sacred Fremen blade made from sandworm tooth' },
            { label: 'Lasgun', value: 'lasgun', description: 'Energy weapon with variable settings' },
            { label: 'Personal Shield', value: 'personal_shield', description: 'Holtzman energy barrier' },
            { label: 'Stillsuit', value: 'stillsuit', description: 'Water-recycling desert survival gear' },
            { label: 'Maula Pistol', value: 'maula_pistol', description: 'Spring-loaded dart weapon' },
            { label: 'Hunter-Seeker', value: 'hunter_seeker', description: 'Assassination device' },
            { label: 'Thumper', value: 'thumper', description: 'Device to attract sandworms' },
            { label: 'Paracompass', value: 'paracompass', description: 'Navigation device for desert travel' }
        ],
        vehicles: [
            { label: 'Ornithopter', value: 'ornithopter', description: 'Flapping-wing aircraft' },
            { label: 'Groundcar', value: 'groundcar', description: 'Surface transportation vehicle' },
            { label: 'Frigate', value: 'frigate', description: 'Interplanetary spacecraft' },
            { label: 'Carryall', value: 'carryall', description: 'Heavy-lift transport aircraft' },
            { label: 'Sandcrawler', value: 'sandcrawler', description: 'Desert exploration vehicle' },
            { label: 'Guild Heighliner', value: 'heighliner_passage', description: 'Passage aboard spacing guild ship' }
        ],
        property: [
            { label: 'Safe House', value: 'safe_house', description: 'Secure hideout or residence' },
            { label: 'Spice Cache', value: 'spice_cache', description: 'Hidden melange storage' },
            { label: 'Water Reserve', value: 'water_reserve', description: 'Precious water storage facility' },
            { label: 'Trading Post', value: 'trading_post', description: 'Commercial establishment' },
            { label: 'Sietch Access', value: 'sietch_access', description: 'Entry rights to Fremen community' },
            { label: 'Noble Estate', value: 'noble_estate', description: 'Hereditary land holdings' }
        ],
        connections: [
            { label: 'Smuggler Contact', value: 'smuggler_contact', description: 'Connection to black market operations' },
            { label: 'Guild Navigator', value: 'guild_navigator', description: 'Relationship with spacing guild' },
            { label: 'Bene Gesserit Sister', value: 'bene_gesserit_sister', description: 'Contact within the sisterhood' },
            { label: 'Mentat Advisor', value: 'mentat_advisor', description: 'Human computer consultant' },
            { label: 'Fremen Guide', value: 'fremen_guide', description: 'Desert survival expert' },
            { label: 'House Spy Network', value: 'house_spy_network', description: 'Intelligence gathering contacts' },
            { label: 'Suk Doctor', value: 'suk_doctor', description: 'Imperial conditioning physician' }
        ],
        information: [
            { label: 'Spice Route Maps', value: 'spice_route_maps', description: 'Secret harvesting locations' },
            { label: 'House Secrets', value: 'house_secrets', description: 'Compromising noble information' },
            { label: 'Fremen Prophecies', value: 'fremen_prophecies', description: 'Desert folk predictions' },
            { label: 'Guild Schedules', value: 'guild_schedules', description: 'Spacing guild travel times' },
            { label: 'Imperial Codes', value: 'imperial_codes', description: 'Government communication ciphers' },
            { label: 'Sandworm Patterns', value: 'sandworm_patterns', description: 'Creature behavior data' }
        ],
        wealth: [
            { label: 'Spice Hoard', value: 'spice_hoard', description: 'Valuable melange stockpile' },
            { label: 'Solari Reserve', value: 'solari_reserve', description: 'Imperial currency savings' },
            { label: 'Precious Artifacts', value: 'precious_artifacts', description: 'Valuable historical items' },
            { label: 'Trade Monopoly', value: 'trade_monopoly', description: 'Exclusive commercial rights' },
            { label: 'Water Debt Claims', value: 'water_debt_claims', description: 'Owed water from others' },
            { label: 'Noble Stipend', value: 'noble_stipend', description: 'Regular house allowance' }
        ]
    };
    const assets = assetsByCategory[selectedCategory] || [];
    if (assets.length === 0) {
        await interaction.reply({ content: '❌ No assets found for this category.', flags: discord_js_1.MessageFlags.Ephemeral });
        return;
    }
    const currentAssets = creationState.data.assets || [];
    const availableAssets = assets.filter(asset => !currentAssets.includes(asset.label));
    if (availableAssets.length === 0) {
        await interaction.reply({ content: '❌ All assets in this category are already selected.', flags: discord_js_1.MessageFlags.Ephemeral });
        return;
    }
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle(`🏠 ${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Assets`)
        .setDescription('Select an asset to add to your character.')
        .addFields({ name: '🎯 Current Assets', value: currentAssets.length > 0 ? currentAssets.map(a => `• ${a}`).join('\n') : 'None selected', inline: false }, { name: '📝 Remaining Slots', value: `${Math.max(0, 3 - currentAssets.length)} / 3`, inline: false })
        .setColor(0xFFD700);
    const assetSelect = new discord_js_1.StringSelectMenuBuilder()
        .setCustomId('asset_select')
        .setPlaceholder('Choose an asset')
        .addOptions(availableAssets.slice(0, 25));
    const row = new discord_js_1.ActionRowBuilder()
        .addComponents(assetSelect);
    await interaction.reply({
        embeds: [embed],
        components: [row],
        flags: discord_js_1.MessageFlags.Ephemeral
    });
}
async function handleAssetSelectInteraction(interaction, member) {
    const selectedAsset = interaction.values[0];
    const userId = member.id;
    const guildId = interaction.guild.id;
    const creationState = character_creation_state_1.characterCreationState.getState(userId, guildId);
    if (!creationState) {
        await interaction.reply({ content: '❌ No character creation in progress.', flags: discord_js_1.MessageFlags.Ephemeral });
        return;
    }
    if (!creationState.data.assets) {
        creationState.data.assets = [];
    }
    if (creationState.data.assets.length >= 3) {
        await interaction.reply({ content: '❌ You already have 3 assets selected.', flags: discord_js_1.MessageFlags.Ephemeral });
        return;
    }
    const allAssets = [
        { label: 'Crysknife', value: 'crysknife' },
        { label: 'Lasgun', value: 'lasgun' },
        { label: 'Personal Shield', value: 'personal_shield' },
        { label: 'Stillsuit', value: 'stillsuit' },
        { label: 'Maula Pistol', value: 'maula_pistol' },
        { label: 'Hunter-Seeker', value: 'hunter_seeker' },
        { label: 'Thumper', value: 'thumper' },
        { label: 'Paracompass', value: 'paracompass' },
        { label: 'Ornithopter', value: 'ornithopter' },
        { label: 'Groundcar', value: 'groundcar' },
        { label: 'Frigate', value: 'frigate' },
        { label: 'Carryall', value: 'carryall' },
        { label: 'Sandcrawler', value: 'sandcrawler' },
        { label: 'Guild Heighliner', value: 'heighliner_passage' },
        { label: 'Safe House', value: 'safe_house' },
        { label: 'Spice Cache', value: 'spice_cache' },
        { label: 'Water Reserve', value: 'water_reserve' },
        { label: 'Trading Post', value: 'trading_post' },
        { label: 'Sietch Access', value: 'sietch_access' },
        { label: 'Noble Estate', value: 'noble_estate' },
        { label: 'Smuggler Contact', value: 'smuggler_contact' },
        { label: 'Guild Navigator', value: 'guild_navigator' },
        { label: 'Bene Gesserit Sister', value: 'bene_gesserit_sister' },
        { label: 'Mentat Advisor', value: 'mentat_advisor' },
        { label: 'Fremen Guide', value: 'fremen_guide' },
        { label: 'House Spy Network', value: 'house_spy_network' },
        { label: 'Suk Doctor', value: 'suk_doctor' },
        { label: 'Spice Route Maps', value: 'spice_route_maps' },
        { label: 'House Secrets', value: 'house_secrets' },
        { label: 'Fremen Prophecies', value: 'fremen_prophecies' },
        { label: 'Guild Schedules', value: 'guild_schedules' },
        { label: 'Imperial Codes', value: 'imperial_codes' },
        { label: 'Sandworm Patterns', value: 'sandworm_patterns' },
        { label: 'Spice Hoard', value: 'spice_hoard' },
        { label: 'Solari Reserve', value: 'solari_reserve' },
        { label: 'Precious Artifacts', value: 'precious_artifacts' },
        { label: 'Trade Monopoly', value: 'trade_monopoly' },
        { label: 'Water Debt Claims', value: 'water_debt_claims' },
        { label: 'Noble Stipend', value: 'noble_stipend' }
    ];
    const asset = allAssets.find(a => a.value === selectedAsset);
    if (!asset) {
        await interaction.reply({ content: '❌ Invalid asset selection.', flags: discord_js_1.MessageFlags.Ephemeral });
        return;
    }
    if (creationState.data.assets.includes(asset.label)) {
        await interaction.reply({ content: '❌ This asset is already selected.', flags: discord_js_1.MessageFlags.Ephemeral });
        return;
    }
    creationState.data.assets.push(asset.label);
    await character_creation_state_1.characterCreationState.updateState(userId, guildId, {
        data: { assets: creationState.data.assets }
    });
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('✅ Asset Added!')
        .setDescription(`**${asset.label}** has been added to your character.`)
        .addFields({ name: '🎯 Current Assets', value: creationState.data.assets.map(a => `• ${a}`).join('\n'), inline: false }, { name: '📝 Remaining Slots', value: `${Math.max(0, 3 - creationState.data.assets.length)} / 3`, inline: false }, { name: '🎯 Next Step', value: creationState.data.assets.length >= 3 ? 'Use `/sheet details` to add final details!' : 'Select another asset category to add more assets.', inline: false })
        .setColor(0x00FF00);
    let components = [];
    if (creationState.data.assets.length < 3) {
        const categorySelect = new discord_js_1.StringSelectMenuBuilder()
            .setCustomId('asset_category_select')
            .setPlaceholder('Choose another asset category')
            .addOptions([
            { label: 'Equipment & Weapons', value: 'equipment', description: 'Tools, weapons, and gear' },
            { label: 'Vehicles & Transport', value: 'vehicles', description: 'Ships, ornithopters, and mounts' },
            { label: 'Property & Holdings', value: 'property', description: 'Land, buildings, and facilities' },
            { label: 'Connections & Allies', value: 'connections', description: 'Contacts and relationships' },
            { label: 'Information & Secrets', value: 'information', description: 'Knowledge and intelligence' },
            { label: 'Wealth & Resources', value: 'wealth', description: 'Money, spice, and valuables' }
        ]);
        const row = new discord_js_1.ActionRowBuilder()
            .addComponents(categorySelect);
        components = [row];
    }
    await interaction.update({
        embeds: [embed],
        components: components
    });
}
async function handleStatementDriveSelectInteraction(interaction, member) {
    const selectedDrive = interaction.values[0];
    const userId = member.id;
    const guildId = interaction.guild.id;
    const creationState = character_creation_state_1.characterCreationState.getState(userId, guildId);
    if (!creationState) {
        await interaction.reply({ content: '❌ No character creation in progress.', flags: discord_js_1.MessageFlags.Ephemeral });
        return;
    }
    const currentStatement = Array.isArray(creationState.data.statements)
        ? creationState.data.statements.find((stmt) => stmt.startsWith(`${selectedDrive}: `))?.split(': ')[1] || ''
        : '';
    const modal = new discord_js_1.ModalBuilder()
        .setCustomId(`statement_input_${userId}_${selectedDrive}`)
        .setTitle(`Statement for ${selectedDrive}`);
    const statementInput = new discord_js_1.TextInputBuilder()
        .setCustomId('statement_text')
        .setLabel(`Write a personal statement for ${selectedDrive}`)
        .setStyle(discord_js_1.TextInputStyle.Paragraph)
        .setPlaceholder('e.g., "I believe in absolute honesty, even when it hurts."')
        .setRequired(true)
        .setMaxLength(200);
    if (currentStatement) {
        statementInput.setValue(currentStatement);
    }
    const row = new discord_js_1.ActionRowBuilder()
        .addComponents(statementInput);
    modal.addComponents(row);
    await interaction.showModal(modal);
}
async function handleStatementModalSubmit(interaction, member) {
    const customId = interaction.customId;
    const userId = member.id;
    const guildId = interaction.guild.id;
    const parts = customId.split('_');
    if (parts.length < 4) {
        await interaction.reply({ content: '❌ Invalid statement submission.', flags: discord_js_1.MessageFlags.Ephemeral });
        return;
    }
    const selectedDrive = parts.slice(3).join('_');
    const statementText = interaction.fields.getTextInputValue('statement_text').trim();
    if (!statementText) {
        await interaction.reply({ content: '❌ Statement cannot be empty.', flags: discord_js_1.MessageFlags.Ephemeral });
        return;
    }
    const creationState = character_creation_state_1.characterCreationState.getState(userId, guildId);
    if (!creationState) {
        await interaction.reply({ content: '❌ No character creation in progress.', flags: discord_js_1.MessageFlags.Ephemeral });
        return;
    }
    if (!creationState.data.statements || Array.isArray(creationState.data.statements)) {
        if (Array.isArray(creationState.data.statements)) {
            const oldStatements = creationState.data.statements;
            const newStatements = {};
            oldStatements.forEach(statement => {
                const [drive, ...textParts] = statement.split(': ');
                if (drive && textParts.length > 0) {
                    newStatements[drive] = textParts.join(': ');
                }
            });
            creationState.data.statements = newStatements;
        }
        else {
            creationState.data.statements = {};
        }
    }
    creationState.data.statements[selectedDrive] = statementText;
    await character_creation_state_1.characterCreationState.updateState(userId, guildId, {
        data: { statements: creationState.data.statements }
    });
    const statementDisplay = (Array.isArray(creationState.data.statements) ? creationState.data.statements : []).map((stmt) => {
        const [drive, statement] = stmt.split(': ');
        return `• **${drive}**: ${statement || 'None'}`;
    }).join('\n');
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('✅ Statement Updated!')
        .setDescription(`**${selectedDrive}** statement set to: "${statementText}"`)
        .addFields({ name: '📝 Current Drive Statements', value: statementDisplay, inline: false }, { name: '🎯 Next Step', value: 'Use `/sheet talents` to continue, or select another drive to modify its statement.', inline: false })
        .setColor(0x00FF00);
    const driveOptions = (Array.isArray(creationState.data.drives) ? creationState.data.drives : []).map((drive) => ({
        label: drive,
        value: drive,
        description: `Current statement: ${Array.isArray(creationState.data.statements) && creationState.data.statements.some((s) => s.startsWith(`${drive}:`)) ? 'Set' : 'None'}`
    }));
    const driveSelect = new discord_js_1.StringSelectMenuBuilder()
        .setCustomId('statement_drive_select')
        .setPlaceholder('Select a drive to modify its statement')
        .addOptions(driveOptions);
    const row = new discord_js_1.ActionRowBuilder()
        .addComponents(driveSelect);
    await interaction.reply({
        embeds: [embed],
        components: [row],
        flags: discord_js_1.MessageFlags.Ephemeral
    });
}
