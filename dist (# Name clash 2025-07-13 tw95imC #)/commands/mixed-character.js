"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const mixed_character_manager_1 = require("../utils/mixed-character-manager");
const mixed_archetypes_1 = require("../data/mixed-archetypes");
const logger_1 = require("../utils/logger");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('mixedchar')
    .setDescription('Create a character with mixed archetypes')
    .addSubcommand(subcommand => subcommand
    .setName('start')
    .setDescription('Start creating a new mixed archetype character'))
    .addSubcommand(subcommand => subcommand
    .setName('continue')
    .setDescription('Continue your current character creation'))
    .addSubcommand(subcommand => subcommand
    .setName('status')
    .setDescription('Check your current character creation progress'))
    .addSubcommand(subcommand => subcommand
    .setName('cancel')
    .setDescription('Cancel your current character creation'))
    .addSubcommand(subcommand => subcommand
    .setName('name')
    .setDescription('Set character name and concept')
    .addStringOption(option => option
    .setName('name')
    .setDescription('Character name (must be unique)')
    .setRequired(true))
    .addStringOption(option => option
    .setName('concept')
    .setDescription('Character concept/background')
    .setRequired(true)))
    .addSubcommand(subcommand => subcommand
    .setName('archetypes')
    .setDescription('Select primary and secondary archetypes')
    .addStringOption(option => option
    .setName('primary')
    .setDescription('Primary archetype')
    .setRequired(true)
    .addChoices(...mixed_archetypes_1.ARCHETYPE_NAMES.map(name => ({ name, value: name }))))
    .addStringOption(option => option
    .setName('secondary')
    .setDescription('Secondary archetype')
    .setRequired(true)
    .addChoices(...mixed_archetypes_1.ARCHETYPE_NAMES.map(name => ({ name, value: name })))))
    .addSubcommand(subcommand => subcommand
    .setName('skills')
    .setDescription('Assign skill points (9,7,6,5,4 - each used once)')
    .addIntegerOption(option => option
    .setName('battle')
    .setDescription('Battle skill value')
    .setRequired(true)
    .addChoices(...mixed_archetypes_1.SKILL_POINT_VALUES.map(val => ({ name: val.toString(), value: val }))))
    .addIntegerOption(option => option
    .setName('communicate')
    .setDescription('Communicate skill value')
    .setRequired(true)
    .addChoices(...mixed_archetypes_1.SKILL_POINT_VALUES.map(val => ({ name: val.toString(), value: val }))))
    .addIntegerOption(option => option
    .setName('discipline')
    .setDescription('Discipline skill value')
    .setRequired(true)
    .addChoices(...mixed_archetypes_1.SKILL_POINT_VALUES.map(val => ({ name: val.toString(), value: val }))))
    .addIntegerOption(option => option
    .setName('move')
    .setDescription('Move skill value')
    .setRequired(true)
    .addChoices(...mixed_archetypes_1.SKILL_POINT_VALUES.map(val => ({ name: val.toString(), value: val }))))
    .addIntegerOption(option => option
    .setName('understand')
    .setDescription('Understand skill value')
    .setRequired(true)
    .addChoices(...mixed_archetypes_1.SKILL_POINT_VALUES.map(val => ({ name: val.toString(), value: val })))))
    .addSubcommand(subcommand => subcommand
    .setName('drives')
    .setDescription('Assign drive points (8,7,6,5,4 - each used once)')
    .addIntegerOption(option => option
    .setName('duty')
    .setDescription('Duty drive value')
    .setRequired(true)
    .addChoices(...mixed_archetypes_1.DRIVE_POINT_VALUES.map(val => ({ name: val.toString(), value: val }))))
    .addIntegerOption(option => option
    .setName('faith')
    .setDescription('Faith drive value')
    .setRequired(true)
    .addChoices(...mixed_archetypes_1.DRIVE_POINT_VALUES.map(val => ({ name: val.toString(), value: val }))))
    .addIntegerOption(option => option
    .setName('justice')
    .setDescription('Justice drive value')
    .setRequired(true)
    .addChoices(...mixed_archetypes_1.DRIVE_POINT_VALUES.map(val => ({ name: val.toString(), value: val }))))
    .addIntegerOption(option => option
    .setName('power')
    .setDescription('Power drive value')
    .setRequired(true)
    .addChoices(...mixed_archetypes_1.DRIVE_POINT_VALUES.map(val => ({ name: val.toString(), value: val }))))
    .addIntegerOption(option => option
    .setName('truth')
    .setDescription('Truth drive value')
    .setRequired(true)
    .addChoices(...mixed_archetypes_1.DRIVE_POINT_VALUES.map(val => ({ name: val.toString(), value: val })))));
async function execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    const guildId = interaction.guild?.id;
    if (!guildId) {
        await interaction.reply({
            content: '❌ This command can only be used in a server.',
            ephemeral: true
        });
        return;
    }
    try {
        switch (subcommand) {
            case 'start':
                await handleStart(interaction, userId, guildId);
                break;
            case 'continue':
                await handleContinue(interaction, userId, guildId);
                break;
            case 'status':
                await handleStatus(interaction, userId, guildId);
                break;
            case 'cancel':
                await handleCancel(interaction, userId, guildId);
                break;
            case 'name':
                await handleSetName(interaction, userId, guildId);
                break;
            case 'archetypes':
                await handleSetArchetypes(interaction, userId, guildId);
                break;
            case 'skills':
                await handleSetSkills(interaction, userId, guildId);
                break;
            case 'drives':
                await handleSetDrives(interaction, userId, guildId);
                break;
            default:
                await interaction.reply({
                    content: '❌ Unknown subcommand.',
                    ephemeral: true
                });
        }
    }
    catch (error) {
        logger_1.logger.error('Error in mixed character command:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: `❌ Error: ${errorMessage}`,
                ephemeral: true
            });
        }
        else {
            await interaction.reply({
                content: `❌ Error: ${errorMessage}`,
                ephemeral: true
            });
        }
    }
}
async function handleStart(interaction, userId, guildId) {
    const state = await mixed_character_manager_1.mixedCharacterManager.startCharacterCreation(userId, guildId);
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('🎭 Mixed Archetype Character Creation')
        .setDescription('Welcome to the mixed archetype character creation system!\n\nYou can combine two different archetypes to create a unique character.')
        .addFields({ name: '📋 Process Overview', value: '1️⃣ Set name and concept\n' +
            '2️⃣ Choose primary & secondary archetypes\n' +
            '3️⃣ Assign skill points (9,7,6,5,4)\n' +
            '4️⃣ Assign drive points (8,7,6,5,4)\n' +
            '5️⃣ Select skill focuses\n' +
            '6️⃣ Write drive statements\n' +
            '7️⃣ Pick talents (one from each archetype)\n' +
            '8️⃣ Pick assets (one from each archetype)\n' +
            '9️⃣ Add traits and finalize'
    }, { name: '🎯 Current Step', value: `Step ${state.step}: Set character name and concept` }, { name: '📝 Next Action', value: 'Use `/mixedchar name` to set your character\'s name and concept.' })
        .setColor(0x8B4513)
        .setTimestamp();
    await interaction.reply({ embeds: [embed], ephemeral: true });
}
async function handleContinue(interaction, userId, guildId) {
    const state = mixed_character_manager_1.mixedCharacterManager.getCharacterState(userId, guildId);
    if (!state) {
        await interaction.reply({
            content: '❌ No active character creation found. Use `/mixedchar start` to begin.',
            ephemeral: true
        });
        return;
    }
    if (state.completed) {
        await interaction.reply({
            content: '✅ Your character creation is complete! Use `/mixedchar start` to create a new character.',
            ephemeral: true
        });
        return;
    }
    await showCurrentStep(interaction, state);
}
async function handleStatus(interaction, userId, guildId) {
    const state = mixed_character_manager_1.mixedCharacterManager.getCharacterState(userId, guildId);
    if (!state) {
        await interaction.reply({
            content: '❌ No active character creation found.',
            ephemeral: true
        });
        return;
    }
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('📊 Character Creation Status')
        .setColor(0x8B4513)
        .setTimestamp();
    if (state.characterName) {
        embed.addFields({ name: '👤 Character Name', value: state.characterName, inline: true });
    }
    if (state.concept) {
        embed.addFields({ name: '💭 Concept', value: state.concept, inline: true });
    }
    if (state.primaryArchetype && state.secondaryArchetype) {
        embed.addFields({
            name: '🎭 Archetypes',
            value: `Primary: ${state.primaryArchetype}\nSecondary: ${state.secondaryArchetype}`,
            inline: true
        });
    }
    const stepNames = [
        '', 'Name & Concept', 'Archetypes', 'Skills', 'Drives',
        'Focuses', 'Drive Statements', 'Talents', 'Assets', 'Traits & Finalize'
    ];
    embed.addFields({
        name: '📈 Progress',
        value: `Step ${state.step}/9: ${stepNames[state.step] || 'Unknown'}`,
        inline: false
    });
    if (state.completed) {
        embed.addFields({ name: '✅ Status', value: 'Character creation completed!', inline: false });
    }
    else {
        embed.addFields({ name: '⏳ Status', value: 'Character creation in progress', inline: false });
    }
    await interaction.reply({ embeds: [embed], ephemeral: true });
}
async function handleCancel(interaction, userId, guildId) {
    const state = mixed_character_manager_1.mixedCharacterManager.getCharacterState(userId, guildId);
    if (!state) {
        await interaction.reply({
            content: '❌ No active character creation found.',
            ephemeral: true
        });
        return;
    }
    await mixed_character_manager_1.mixedCharacterManager.cancelCharacterCreation(userId, guildId);
    await interaction.reply({
        content: '🗑️ Character creation cancelled.',
        ephemeral: true
    });
}
async function handleSetName(interaction, userId, guildId) {
    const name = interaction.options.getString('name');
    const concept = interaction.options.getString('concept');
    const result = await mixed_character_manager_1.mixedCharacterManager.setNameAndConcept(userId, guildId, name, concept);
    if (!result.success) {
        await interaction.reply({
            content: `❌ ${result.error}`,
            ephemeral: true
        });
        return;
    }
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('✅ Name and Concept Set')
        .addFields({ name: '👤 Character Name', value: name, inline: true }, { name: '💭 Concept', value: concept, inline: true }, { name: '📝 Next Step', value: 'Use `/mixedchar archetypes` to select your primary and secondary archetypes.' })
        .setColor(0x00FF00)
        .setTimestamp();
    await interaction.reply({ embeds: [embed], ephemeral: true });
}
async function handleSetArchetypes(interaction, userId, guildId) {
    const primary = interaction.options.getString('primary');
    const secondary = interaction.options.getString('secondary');
    const result = await mixed_character_manager_1.mixedCharacterManager.setArchetypes(userId, guildId, primary, secondary);
    if (!result.success) {
        await interaction.reply({
            content: `❌ ${result.error}`,
            ephemeral: true
        });
        return;
    }
    const primaryData = mixed_archetypes_1.ARCHETYPES[primary];
    const secondaryData = mixed_archetypes_1.ARCHETYPES[secondary];
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('✅ Archetypes Selected')
        .addFields({ name: '🎭 Primary Archetype', value: `**${primary}**\n${primaryData.description}`, inline: false }, { name: '🎭 Secondary Archetype', value: `**${secondary}**\n${secondaryData.description}`, inline: false }, { name: '🎯 Available Talents', value: `**${primary}:** ${primaryData.talents.join(', ')}\n` +
            `**${secondary}:** ${secondaryData.talents.join(', ')}`,
        inline: false
    }, { name: '📦 Available Assets', value: `**${primary}:** ${primaryData.assets.join(', ')}\n` +
            `**${secondary}:** ${secondaryData.assets.join(', ')}`,
        inline: false
    }, { name: '📝 Next Step', value: 'Use `/mixedchar skills` to assign your skill points (9,7,6,5,4).' })
        .setColor(0x00FF00)
        .setTimestamp();
    await interaction.reply({ embeds: [embed], ephemeral: true });
}
async function handleSetSkills(interaction, userId, guildId) {
    const skills = {
        'Battle': interaction.options.getInteger('battle'),
        'Communicate': interaction.options.getInteger('communicate'),
        'Discipline': interaction.options.getInteger('discipline'),
        'Move': interaction.options.getInteger('move'),
        'Understand': interaction.options.getInteger('understand')
    };
    const result = await mixed_character_manager_1.mixedCharacterManager.assignSkills(userId, guildId, skills);
    if (!result.success) {
        await interaction.reply({
            content: `❌ ${result.error}`,
            ephemeral: true
        });
        return;
    }
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('✅ Skills Assigned')
        .addFields({ name: '⚔️ Battle', value: skills.Battle.toString(), inline: true }, { name: '💬 Communicate', value: skills.Communicate.toString(), inline: true }, { name: '🧘 Discipline', value: skills.Discipline.toString(), inline: true }, { name: '🏃 Move', value: skills.Move.toString(), inline: true }, { name: '🧠 Understand', value: skills.Understand.toString(), inline: true }, { name: '📝 Next Step', value: 'Use `/mixedchar drives` to assign your drive points (8,7,6,5,4).' })
        .setColor(0x00FF00)
        .setTimestamp();
    await interaction.reply({ embeds: [embed], ephemeral: true });
}
async function handleSetDrives(interaction, userId, guildId) {
    const drives = {
        'Duty': interaction.options.getInteger('duty'),
        'Faith': interaction.options.getInteger('faith'),
        'Justice': interaction.options.getInteger('justice'),
        'Power': interaction.options.getInteger('power'),
        'Truth': interaction.options.getInteger('truth')
    };
    const result = await mixed_character_manager_1.mixedCharacterManager.assignDrives(userId, guildId, drives);
    if (!result.success) {
        await interaction.reply({
            content: `❌ ${result.error}`,
            ephemeral: true
        });
        return;
    }
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('✅ Drives Assigned')
        .addFields({ name: '⚖️ Duty', value: drives.Duty.toString(), inline: true }, { name: '🙏 Faith', value: drives.Faith.toString(), inline: true }, { name: '⚖️ Justice', value: drives.Justice.toString(), inline: true }, { name: '👑 Power', value: drives.Power.toString(), inline: true }, { name: '🔍 Truth', value: drives.Truth.toString(), inline: true }, { name: '📝 Next Step', value: 'Next, you\'ll need to select focuses, write drive statements, choose talents and assets. Use `/mixedchar continue` to proceed with interactive selection.' })
        .setColor(0x00FF00)
        .setTimestamp();
    await interaction.reply({ embeds: [embed], ephemeral: true });
}
async function showCurrentStep(interaction, state) {
    const options = mixed_character_manager_1.mixedCharacterManager.getStepOptions(state);
    const stepNames = [
        '', 'Name & Concept', 'Archetypes', 'Skills', 'Drives',
        'Focuses', 'Drive Statements', 'Talents', 'Assets', 'Traits & Finalize'
    ];
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle(`📋 Step ${state.step}: ${stepNames[state.step]}`)
        .setColor(0x8B4513)
        .setTimestamp();
    switch (state.step) {
        case 1:
            embed.setDescription('Set your character\'s name and concept using `/mixedchar name`.');
            break;
        case 2:
            embed.setDescription('Choose your primary and secondary archetypes using `/mixedchar archetypes`.');
            embed.addFields({ name: '🎭 Available Archetypes', value: mixed_archetypes_1.ARCHETYPE_NAMES.join(', ') });
            break;
        case 3:
            embed.setDescription('Assign skill points using `/mixedchar skills`. Each value (9,7,6,5,4) must be used exactly once.');
            break;
        case 4:
            embed.setDescription('Assign drive points using `/mixedchar drives`. Each value (8,7,6,5,4) must be used exactly once.');
            break;
        case 5:
        case 6:
        case 7:
        case 8:
        case 9:
            embed.setDescription('Use the interactive buttons below to continue with the remaining steps.');
            await showInteractiveStep(interaction, state, embed);
            return;
    }
    await interaction.reply({ embeds: [embed], ephemeral: true });
}
async function showInteractiveStep(interaction, state, embed) {
    switch (state.step) {
        case 5:
            embed.addFields({
                name: '🎯 Focus Selection',
                value: 'You need to select skill focuses from your chosen archetypes. This requires interactive selection - coming soon!'
            });
            break;
        case 6:
            embed.addFields({
                name: '📝 Drive Statements',
                value: 'You need to write statements for each of your drives. This requires text input - coming soon!'
            });
            break;
        case 7:
            if (state.primaryArchetype && state.secondaryArchetype) {
                const primaryTalents = mixed_archetypes_1.ARCHETYPES[state.primaryArchetype].talents;
                const secondaryTalents = mixed_archetypes_1.ARCHETYPES[state.secondaryArchetype].talents;
                embed.addFields({ name: `🎭 ${state.primaryArchetype} Talents`, value: primaryTalents.join('\n'), inline: true }, { name: `🎭 ${state.secondaryArchetype} Talents`, value: secondaryTalents.join('\n'), inline: true }, { name: '📋 Instructions', value: 'Select one talent from each archetype - interactive selection coming soon!' });
            }
            break;
        case 8:
            if (state.primaryArchetype && state.secondaryArchetype) {
                const primaryAssets = mixed_archetypes_1.ARCHETYPES[state.primaryArchetype].assets;
                const secondaryAssets = mixed_archetypes_1.ARCHETYPES[state.secondaryArchetype].assets;
                embed.addFields({ name: `📦 ${state.primaryArchetype} Assets`, value: primaryAssets.join('\n'), inline: true }, { name: `📦 ${state.secondaryArchetype} Assets`, value: secondaryAssets.join('\n'), inline: true }, { name: '📋 Instructions', value: 'Select one asset from each archetype - interactive selection coming soon!' });
            }
            break;
        case 9:
            embed.addFields({
                name: '🏷️ Traits',
                value: 'Add 1-2 character traits and finalize your character - interactive completion coming soon!'
            });
            break;
    }
    await interaction.reply({ embeds: [embed], ephemeral: true });
}
