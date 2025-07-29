"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CharacterCreator = void 0;
const discord_js_1 = require("discord.js");
const logger_1 = require("../utils/logger");
const canonical_dune_data_js_1 = require("../data/canonical-dune-data.js");
const character_manager_1 = require("../utils/character-manager");
const creationSessions = new Map();
const CREATION_STEPS = [
    { id: 0, name: 'name', title: '📝 Character Name', description: 'Choose a name for your character', instructions: 'Click "Set Name" to enter your character\'s name.' },
    { id: 1, name: 'concept', title: '💭 Character Concept', description: 'Define your character\'s background and role', instructions: 'Click "Set Concept" to describe your character\'s background.' },
    { id: 2, name: 'archetypes', title: '🎭 Archetypes', description: 'Select 1-3 archetypes that define your character', instructions: 'Click "Select Archetypes" to choose from the available options.' },
    { id: 3, name: 'drives', title: '🎯 Drives', description: 'Assign points to your character\'s drives (30 points total)', instructions: 'Click "Assign Drives" to distribute points among your drives.' },
    { id: 4, name: 'skills', title: '⚔️ Skills', description: 'Assign points to your character\'s skills (20 points total)', instructions: 'Click "Assign Skills" to distribute points among your skills.' },
    { id: 5, name: 'focuses', title: '🎯 Focuses', description: 'Select one focus for each skill', instructions: 'Click "Select Focuses" to choose specializations for your skills.' },
    { id: 6, name: 'talents', title: '🎪 Talents', description: 'Select up to 3 talents', instructions: 'Click "Select Talents" to choose your character\'s special abilities.' },
    { id: 7, name: 'assets', title: '💎 Assets', description: 'Select up to 3 assets', instructions: 'Click "Select Assets" to choose your character\'s equipment and resources.' }
];
class CharacterCreator {
    static async startCreation(interaction, member) {
        try {
            const userId = member.id;
            const guildId = interaction.guild.id;
            if (creationSessions.has(userId)) {
                await interaction.reply({
                    content: '⚠️ You already have a character creation in progress. Please complete or cancel it first.',
                    flags: discord_js_1.MessageFlags.Ephemeral
                });
                return;
            }
            const session = {
                userId,
                guildId,
                currentStep: 0,
                character: {
                    userId,
                    guildId,
                    archetypes: [],
                    drives: { duty: 6, faith: 6, justice: 6, power: 6, truth: 6 },
                    skills: { battle: 4, communicate: 4, discipline: 4, move: 4, understand: 4 },
                    focuses: {},
                    talents: [],
                    assets: [],
                    isComplete: false
                },
                createdAt: new Date(),
                updatedAt: new Date()
            };
            creationSessions.set(userId, session);
            await this.showStep(interaction, session);
        }
        catch (error) {
            logger_1.logger.error('Error starting character creation:', error);
            await interaction.reply({
                content: '❌ An error occurred while starting character creation.',
                flags: discord_js_1.MessageFlags.Ephemeral
            });
        }
    }
    static buildStepEmbed(session) {
        const step = CREATION_STEPS[session.currentStep];
        if (!step)
            return new discord_js_1.EmbedBuilder();
        const embed = new discord_js_1.EmbedBuilder()
            .setColor('#4A90E2')
            .setTitle('🏜️ Dune Character Creation')
            .setDescription(step.description)
            .addFields({
            name: step.title,
            value: step.instructions,
            inline: false
        })
            .setFooter({ text: `Step ${session.currentStep + 1} of ${CREATION_STEPS.length}` });
        const char = session.character;
        if (char.name) {
            embed.addFields({ name: '📝 Name', value: char.name, inline: true });
        }
        if (char.concept) {
            embed.addFields({ name: '💭 Concept', value: char.concept, inline: true });
        }
        if (char.archetypes && char.archetypes.length > 0) {
            embed.addFields({ name: '🎭 Archetypes', value: char.archetypes.join(', '), inline: true });
        }
        return embed;
    }
    static async showStep(interaction, session) {
        const embed = this.buildStepEmbed(session);
        const buttons = this.buildButtons(session.currentStep, session);
        const response = {
            embeds: [embed],
            components: buttons,
            ephemeral: true
        };
        if (interaction.isCommand()) {
            await interaction.reply(response);
        }
        else if (interaction.isButton()) {
            await interaction.update(response);
        }
        else if (interaction.isModalSubmit()) {
            await interaction.deferUpdate();
            await interaction.editReply(response);
        }
    }
    static buildButtons(stepIndex, session) {
        const rows = [];
        const mainRow = new discord_js_1.ActionRowBuilder();
        switch (stepIndex) {
            case 0:
                mainRow.addComponents(new discord_js_1.ButtonBuilder()
                    .setCustomId('character_creation_set_name')
                    .setLabel('Set Name')
                    .setStyle(discord_js_1.ButtonStyle.Primary)
                    .setEmoji('📝'));
                if (session.character.name) {
                    mainRow.addComponents(new discord_js_1.ButtonBuilder()
                        .setCustomId('character_creation_next')
                        .setLabel('Next: Concept')
                        .setStyle(discord_js_1.ButtonStyle.Success)
                        .setEmoji('▶️'));
                }
                break;
            case 1:
                mainRow.addComponents(new discord_js_1.ButtonBuilder()
                    .setCustomId('character_creation_prev')
                    .setLabel('Previous')
                    .setStyle(discord_js_1.ButtonStyle.Secondary)
                    .setEmoji('◀️'), new discord_js_1.ButtonBuilder()
                    .setCustomId('character_creation_set_concept')
                    .setLabel('Set Concept')
                    .setStyle(discord_js_1.ButtonStyle.Primary)
                    .setEmoji('💭'));
                if (session.character.concept) {
                    mainRow.addComponents(new discord_js_1.ButtonBuilder()
                        .setCustomId('character_creation_next')
                        .setLabel('Next: Archetypes')
                        .setStyle(discord_js_1.ButtonStyle.Success)
                        .setEmoji('▶️'));
                }
                break;
            case 2:
                mainRow.addComponents(new discord_js_1.ButtonBuilder()
                    .setCustomId('character_creation_prev')
                    .setLabel('Previous')
                    .setStyle(discord_js_1.ButtonStyle.Secondary)
                    .setEmoji('◀️'), new discord_js_1.ButtonBuilder()
                    .setCustomId('character_creation_select_archetypes')
                    .setLabel('Select Archetypes')
                    .setStyle(discord_js_1.ButtonStyle.Primary)
                    .setEmoji('🎭'));
                if (session.character.archetypes && session.character.archetypes.length > 0) {
                    mainRow.addComponents(new discord_js_1.ButtonBuilder()
                        .setCustomId('character_creation_next')
                        .setLabel('Next: Drives')
                        .setStyle(discord_js_1.ButtonStyle.Success)
                        .setEmoji('▶️'));
                }
                break;
            case 3:
                mainRow.addComponents(new discord_js_1.ButtonBuilder()
                    .setCustomId('character_creation_prev')
                    .setLabel('Previous')
                    .setStyle(discord_js_1.ButtonStyle.Secondary)
                    .setEmoji('◀️'), new discord_js_1.ButtonBuilder()
                    .setCustomId('character_creation_assign_drives')
                    .setLabel('Assign Drives')
                    .setStyle(discord_js_1.ButtonStyle.Primary)
                    .setEmoji('🎯'));
                if (session.character.drives && this.validateDrives(session.character.drives).isValid) {
                    mainRow.addComponents(new discord_js_1.ButtonBuilder()
                        .setCustomId('character_creation_next')
                        .setLabel('Next: Skills')
                        .setStyle(discord_js_1.ButtonStyle.Success)
                        .setEmoji('▶️'));
                }
                break;
            case 4:
                mainRow.addComponents(new discord_js_1.ButtonBuilder()
                    .setCustomId('character_creation_prev')
                    .setLabel('Previous')
                    .setStyle(discord_js_1.ButtonStyle.Secondary)
                    .setEmoji('◀️'), new discord_js_1.ButtonBuilder()
                    .setCustomId('character_creation_assign_skills')
                    .setLabel('Assign Skills')
                    .setStyle(discord_js_1.ButtonStyle.Primary)
                    .setEmoji('⚔️'));
                if (session.character.skills && this.validateSkills(session.character.skills).isValid) {
                    mainRow.addComponents(new discord_js_1.ButtonBuilder()
                        .setCustomId('canon_next')
                        .setLabel('Next: Focuses')
                        .setStyle(discord_js_1.ButtonStyle.Success)
                        .setEmoji('▶️'));
                }
                break;
            case 5:
                mainRow.addComponents(new discord_js_1.ButtonBuilder()
                    .setCustomId('canon_prev')
                    .setLabel('Previous')
                    .setStyle(discord_js_1.ButtonStyle.Secondary)
                    .setEmoji('◀️'), new discord_js_1.ButtonBuilder()
                    .setCustomId('canon_select_focuses')
                    .setLabel('Select Focuses')
                    .setStyle(discord_js_1.ButtonStyle.Primary)
                    .setEmoji('🎯'));
                if (session.character.focuses && this.validateFocuses(session.character.focuses).isValid) {
                    mainRow.addComponents(new discord_js_1.ButtonBuilder()
                        .setCustomId('canon_next')
                        .setLabel('Next: Talents')
                        .setStyle(discord_js_1.ButtonStyle.Success)
                        .setEmoji('▶️'));
                }
                break;
            case 6:
                mainRow.addComponents(new discord_js_1.ButtonBuilder()
                    .setCustomId('canon_prev')
                    .setLabel('Previous')
                    .setStyle(discord_js_1.ButtonStyle.Secondary)
                    .setEmoji('◀️'), new discord_js_1.ButtonBuilder()
                    .setCustomId('canon_select_talents')
                    .setLabel('Select Talents')
                    .setStyle(discord_js_1.ButtonStyle.Primary)
                    .setEmoji('⭐'));
                if (session.character.talents && session.character.talents.length === 3) {
                    mainRow.addComponents(new discord_js_1.ButtonBuilder()
                        .setCustomId('canon_next')
                        .setLabel('Next: Assets')
                        .setStyle(discord_js_1.ButtonStyle.Success)
                        .setEmoji('▶️'));
                }
                break;
            case 7:
                mainRow.addComponents(new discord_js_1.ButtonBuilder()
                    .setCustomId('canon_prev')
                    .setLabel('Previous')
                    .setStyle(discord_js_1.ButtonStyle.Secondary)
                    .setEmoji('◀️'), new discord_js_1.ButtonBuilder()
                    .setCustomId('canon_select_assets')
                    .setLabel('Select Assets')
                    .setStyle(discord_js_1.ButtonStyle.Primary)
                    .setEmoji('💎'));
                if (session.character.assets && session.character.assets.length === 3) {
                    mainRow.addComponents(new discord_js_1.ButtonBuilder()
                        .setCustomId('canon_next')
                        .setLabel('Next: Finalize')
                        .setStyle(discord_js_1.ButtonStyle.Success)
                        .setEmoji('▶️'));
                }
                break;
            case 8:
                mainRow.addComponents(new discord_js_1.ButtonBuilder()
                    .setCustomId('canon_prev')
                    .setLabel('Previous')
                    .setStyle(discord_js_1.ButtonStyle.Secondary)
                    .setEmoji('◀️'), new discord_js_1.ButtonBuilder()
                    .setCustomId('canon_finalize')
                    .setLabel('Create Character')
                    .setStyle(discord_js_1.ButtonStyle.Success)
                    .setEmoji('✅'));
                break;
        }
        if (mainRow.components.length > 0) {
            rows.push(mainRow);
        }
        return rows;
    }
    static validateDrives(drives) {
        const totalPoints = Object.values(drives).reduce((sum, val) => sum + val, 0);
        const maxTotal = canonical_dune_data_js_1.POINT_BUY_RULES.DRIVES.TOTAL_POINTS;
        const minValue = canonical_dune_data_js_1.POINT_BUY_RULES.DRIVES.MIN_PER_DRIVE;
        const maxValue = canonical_dune_data_js_1.POINT_BUY_RULES.DRIVES.MAX_PER_DRIVE;
        const errors = [];
        if (totalPoints !== maxTotal) {
            errors.push(`Total points must equal ${maxTotal} (currently ${totalPoints})`);
        }
        for (const [drive, value] of Object.entries(drives)) {
            if (value < minValue || value > maxValue) {
                errors.push(`${drive} must be between ${minValue} and ${maxValue}`);
            }
        }
        return {
            usedPoints: totalPoints,
            remainingPoints: maxTotal - totalPoints,
            isValid: errors.length === 0,
            errors,
            totalPoints: maxTotal
        };
    }
    static validateSkills(skills) {
        const totalPoints = Object.values(skills).reduce((sum, val) => sum + val, 0);
        const maxTotal = canonical_dune_data_js_1.POINT_BUY_RULES.SKILLS.TOTAL_POINTS;
        const minValue = canonical_dune_data_js_1.POINT_BUY_RULES.SKILLS.MIN_PER_SKILL;
        const maxValue = canonical_dune_data_js_1.POINT_BUY_RULES.SKILLS.MAX_PER_SKILL;
        const errors = [];
        if (totalPoints !== maxTotal) {
            errors.push(`Total points must equal ${maxTotal} (currently ${totalPoints})`);
        }
        for (const [skill, value] of Object.entries(skills)) {
            if (value < minValue || value > maxValue) {
                errors.push(`${skill} must be between ${minValue} and ${maxValue}`);
            }
        }
        return {
            usedPoints: totalPoints,
            remainingPoints: maxTotal - totalPoints,
            isValid: errors.length === 0,
            errors,
            totalPoints: maxTotal
        };
    }
    static validateFocuses(focuses) {
        const errors = [];
        const requiredSkills = Object.keys(canonical_dune_data_js_1.SKILLS);
        for (const skill of requiredSkills) {
            if (!focuses[skill]) {
                errors.push(`${skill} requires a focus selection`);
            }
            else {
                const validFocuses = canonical_dune_data_js_1.SKILL_FOCUSES[skill] || [];
                if (!validFocuses.includes(focuses[skill])) {
                    errors.push(`Invalid focus '${focuses[skill]}' for ${skill}`);
                }
            }
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    static async showNameModal(interaction) {
        const modal = new discord_js_1.ModalBuilder()
            .setCustomId('character_creation_name_modal')
            .setTitle('Set Character Name');
        const nameInput = new discord_js_1.TextInputBuilder()
            .setCustomId('name')
            .setLabel('Character Name')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setPlaceholder('e.g., Duncan Idaho, Chani, Gurney Halleck')
            .setRequired(true)
            .setMaxLength(50);
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(nameInput));
        await interaction.showModal(modal);
    }
    static async showArchetypeSelect(interaction) {
        const options = canonical_dune_data_js_1.ARCHETYPES.map(archetype => ({
            label: archetype.name,
            value: archetype.name,
            description: archetype.description.substring(0, 100)
        }));
        const selectMenu = new discord_js_1.StringSelectMenuBuilder()
            .setCustomId('canon_archetype_select')
            .setPlaceholder('Select 1-3 archetypes')
            .setMinValues(1)
            .setMaxValues(3)
            .addOptions(options);
        const row = new discord_js_1.ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({
            content: 'Select your character archetypes (1-3):',
            components: [row]
        });
    }
    static async showDrivesModal(interaction) {
        const session = creationSessions.get(interaction.user.id);
        if (!session)
            return;
        const modal = new discord_js_1.ModalBuilder()
            .setCustomId('character_creation_drives_modal')
            .setTitle('Assign Drive Points (30 total)');
        const drives = Object.keys(canonical_dune_data_js_1.DRIVES);
        const inputs = drives.map(drive => {
            const currentValue = session.character.drives ? session.character.drives[drive] || 6 : 6;
            return new discord_js_1.TextInputBuilder()
                .setCustomId(drive)
                .setLabel(`${drive.charAt(0).toUpperCase() + drive.slice(1)} (4-12)`)
                .setStyle(discord_js_1.TextInputStyle.Short)
                .setValue(currentValue.toString())
                .setRequired(true)
                .setMaxLength(2);
        });
        inputs.slice(0, 5).forEach(input => {
            modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(input));
        });
        await interaction.showModal(modal);
    }
    static async showSkillsModal(interaction) {
        const session = creationSessions.get(interaction.user.id);
        if (!session)
            return;
        const modal = new discord_js_1.ModalBuilder()
            .setCustomId('character_creation_skills_modal')
            .setTitle('Assign Skill Points (20 total)');
        const skills = Object.keys(canonical_dune_data_js_1.SKILLS);
        const inputs = skills.map(skill => {
            const currentValue = session.character.skills ? session.character.skills[skill] || 4 : 4;
            return new discord_js_1.TextInputBuilder()
                .setCustomId(skill)
                .setLabel(`${skill.charAt(0).toUpperCase() + skill.slice(1)} (4-8)`)
                .setStyle(discord_js_1.TextInputStyle.Short)
                .setValue(currentValue.toString())
                .setRequired(true)
                .setMaxLength(1);
        });
        inputs.forEach(input => {
            modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(input));
        });
        await interaction.showModal(modal);
    }
    static async showFocusesSelect(interaction) {
        const session = creationSessions.get(interaction.user.id);
        if (!session)
            return;
        const skills = Object.keys(canonical_dune_data_js_1.SKILLS);
        const skillWithoutFocus = skills.find(skill => !session.character.focuses || !session.character.focuses[skill]);
        if (!skillWithoutFocus) {
            await interaction.update({
                content: 'All skills already have focuses assigned!',
                components: []
            });
            return;
        }
        const focusOptions = canonical_dune_data_js_1.SKILL_FOCUSES[skillWithoutFocus]?.map(focus => ({
            label: focus,
            value: focus,
            description: `Focus for ${skillWithoutFocus}`
        })) || [];
        if (focusOptions.length === 0) {
            await interaction.update({
                content: `No focuses available for ${skillWithoutFocus}`,
                components: []
            });
            return;
        }
        const selectMenu = new discord_js_1.StringSelectMenuBuilder()
            .setCustomId(`canon_focus_select_${skillWithoutFocus}`)
            .setPlaceholder(`Select focus for ${skillWithoutFocus}`)
            .addOptions(focusOptions.slice(0, 25));
        const row = new discord_js_1.ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({
            content: `Select a focus for **${skillWithoutFocus}**:`,
            components: [row]
        });
    }
    static async showTalentsSelect(interaction) {
        const session = creationSessions.get(interaction.user.id);
        if (!session)
            return;
        const availableTalents = [...canonical_dune_data_js_1.GENERAL_TALENTS];
        session.character.archetypes?.forEach(archetype => {
            const archetypeTalents = canonical_dune_data_js_1.ARCHETYPE_TALENTS[archetype] || [];
            availableTalents.push(...archetypeTalents);
        });
        const unselectedTalents = availableTalents.filter(talent => !session.character.talents?.includes(talent.name));
        if (unselectedTalents.length === 0) {
            await interaction.update({
                content: 'No more talents available to select!',
                components: []
            });
            return;
        }
        const options = unselectedTalents.slice(0, 25).map(talent => ({
            label: talent.name,
            value: talent.name,
            description: talent.description.substring(0, 100)
        }));
        const selectMenu = new discord_js_1.StringSelectMenuBuilder()
            .setCustomId('canon_talent_select')
            .setPlaceholder('Select talents')
            .setMinValues(1)
            .setMaxValues(Math.min(3 - (session.character.talents?.length || 0), options.length))
            .addOptions(options);
        const row = new discord_js_1.ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({
            content: `Select talents (${session.character.talents?.length || 0}/3 selected):`,
            components: [row]
        });
    }
    static async showAssetsSelect(interaction) {
        const session = creationSessions.get(interaction.user.id);
        if (!session)
            return;
        const availableAssets = [...canonical_dune_data_js_1.GENERAL_ASSETS];
        session.character.archetypes?.forEach(archetype => {
            const archetypeAssets = canonical_dune_data_js_1.ARCHETYPE_ASSETS[archetype] || [];
            availableAssets.push(...archetypeAssets);
        });
        const unselectedAssets = availableAssets.filter(asset => !session.character.assets?.includes(asset.name));
        if (unselectedAssets.length === 0) {
            await interaction.update({
                content: 'No more assets available to select!',
                components: []
            });
            return;
        }
        const options = unselectedAssets.slice(0, 25).map(asset => ({
            label: asset.name,
            value: asset.name,
            description: asset.description.substring(0, 100)
        }));
        const selectMenu = new discord_js_1.StringSelectMenuBuilder()
            .setCustomId('canon_asset_select')
            .setPlaceholder('Select assets')
            .setMinValues(1)
            .setMaxValues(Math.min(3 - (session.character.assets?.length || 0), options.length))
            .addOptions(options);
        const row = new discord_js_1.ActionRowBuilder().addComponents(selectMenu);
        await interaction.update({
            content: `Select assets (${session.character.assets?.length || 0}/3 selected):`,
            components: [row]
        });
    }
    static async showConceptModal(interaction) {
        const modal = new discord_js_1.ModalBuilder()
            .setCustomId('character_creation_concept_modal')
            .setTitle('Set Character Concept');
        const conceptInput = new discord_js_1.TextInputBuilder()
            .setCustomId('concept')
            .setLabel('Character Concept')
            .setStyle(discord_js_1.TextInputStyle.Paragraph)
            .setPlaceholder('e.g., "Fremen desert warrior", "Noble house spy seeking revenge"')
            .setRequired(true)
            .setMaxLength(200);
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(conceptInput));
        await interaction.showModal(modal);
    }
    static async showArchetypeModal(interaction) {
        const modal = new discord_js_1.ModalBuilder()
            .setCustomId('char_archetype_modal')
            .setTitle('Select Character Archetype');
        const archetypeInput = new discord_js_1.TextInputBuilder()
            .setCustomId('archetype')
            .setLabel('Archetype')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setPlaceholder('e.g., Noble, Fremen, Mentat, Bene Gesserit')
            .setRequired(true)
            .setMaxLength(50);
        modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(archetypeInput));
        await interaction.showModal(modal);
    }
    static async finalizeCharacter(interaction, session) {
        try {
            const character = session.character;
            if (!character?.name || !character?.concept || !character?.archetypes?.length) {
                await interaction.reply({
                    content: '❌ Character is incomplete. Please fill in all required fields.',
                    flags: discord_js_1.MessageFlags.Ephemeral
                });
                return;
            }
            character.isComplete = true;
            const savedCharacter = await character_manager_1.characterManager.createCharacter(interaction.user.id, interaction.guildId, character.name, [character.concept || ''], {
                talents: character.talents || [],
                assets: character.assets?.map(assetName => ({ name: assetName, description: '', type: 'equipment' })) || []
            });
            logger_1.logger.info(`Canonical character created: ${character.name} (${character.concept})`);
            const embed = new discord_js_1.EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('✅ Character Created Successfully!')
                .setDescription('Your Dune character has been created and saved!')
                .addFields({ name: '📝 Name', value: character.name, inline: true }, { name: '💭 Concept', value: character.concept || 'None', inline: true }, { name: '🎭 Archetypes', value: character.archetypes?.join(', ') || 'None', inline: true }, { name: '🎯 Drives', value: character.drives ? Object.entries(character.drives).map(([k, v]) => `${k}: ${v}`).join(', ') : 'None', inline: false }, { name: '⚔️ Skills', value: character.skills ? Object.entries(character.skills).map(([k, v]) => `${k}: ${v}`).join(', ') : 'None', inline: false }, { name: '🎪 Talents', value: character.talents?.join(', ') || 'None', inline: false }, { name: '💎 Assets', value: character.assets?.join(', ') || 'None', inline: false })
                .setFooter({ text: 'Your character is ready for adventure in the Imperium!' });
            await interaction.update({
                embeds: [embed],
                components: []
            });
            creationSessions.delete(session.userId);
        }
        catch (error) {
            logger_1.logger.error('Error finalizing character:', error);
            await interaction.reply({
                content: '❌ An error occurred while finalizing your character.',
                flags: discord_js_1.MessageFlags.Ephemeral
            });
        }
    }
    static async handleModal(interaction) {
        const session = creationSessions.get(interaction.user.id);
        if (!session) {
            await interaction.reply({
                content: '❌ No character creation session found.',
                flags: discord_js_1.MessageFlags.Ephemeral
            });
            return;
        }
        try {
            switch (interaction.customId) {
                case 'character_creation_name_modal':
                    await this.handleNameModal(interaction, session);
                    break;
                case 'character_creation_concept_modal':
                    await this.handleConceptModal(interaction, session);
                    break;
                case 'character_creation_drives_modal':
                    await this.handleDrivesModal(interaction, session);
                    break;
                case 'character_creation_skills_modal':
                    await this.handleSkillsModal(interaction, session);
                    break;
                default:
                    await interaction.reply({
                        content: '❌ Unknown modal interaction.',
                        flags: discord_js_1.MessageFlags.Ephemeral
                    });
            }
        }
        catch (error) {
            logger_1.logger.error('Error handling modal:', error);
            await interaction.reply({
                content: '❌ An error occurred processing your input.',
                flags: discord_js_1.MessageFlags.Ephemeral
            });
        }
    }
    static async handleSelectMenu(interaction) {
        const session = creationSessions.get(interaction.user.id);
        if (!session) {
            await interaction.reply({
                content: '❌ No character creation session found.',
                flags: discord_js_1.MessageFlags.Ephemeral
            });
            return;
        }
        try {
            if (interaction.customId === 'character_creation_archetype_select' || interaction.customId === 'canon_archetype_select') {
                await this.handleArchetypeSelect(interaction, session);
            }
            else if (interaction.customId.startsWith('character_creation_focus_select') || interaction.customId.startsWith('canon_focus_select_')) {
                await this.handleFocusSelect(interaction, session);
            }
            else if (interaction.customId === 'character_creation_talent_select' || interaction.customId === 'canon_talent_select') {
                await this.handleTalentSelect(interaction, session);
            }
            else if (interaction.customId === 'character_creation_asset_select' || interaction.customId === 'canon_asset_select') {
                await this.handleAssetSelect(interaction, session);
            }
            else {
                await interaction.reply({
                    content: '❌ Unknown select menu interaction.',
                    flags: discord_js_1.MessageFlags.Ephemeral
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Error handling select menu:', error);
            await interaction.reply({
                content: '❌ An error occurred processing your selection.',
                flags: discord_js_1.MessageFlags.Ephemeral
            });
        }
    }
    static async handleNameModal(interaction, session) {
        const name = interaction.fields.getTextInputValue('name').trim();
        if (!name || name.length < 2) {
            await interaction.reply({
                content: '❌ Name must be at least 2 characters long.',
                flags: discord_js_1.MessageFlags.Ephemeral
            });
            return;
        }
        session.character.name = name;
        session.updatedAt = new Date();
        await this.showStep(interaction, session);
    }
    static async handleConceptModal(interaction, session) {
        const concept = interaction.fields.getTextInputValue('concept').trim();
        if (!concept || concept.length < 5) {
            await interaction.reply({
                content: '❌ Concept must be at least 5 characters long.',
                flags: discord_js_1.MessageFlags.Ephemeral
            });
            return;
        }
        session.character.concept = concept;
        session.updatedAt = new Date();
        await this.showStep(interaction, session);
    }
    static async handleDrivesModal(interaction, session) {
        const drives = {};
        const driveNames = Object.keys(canonical_dune_data_js_1.DRIVES);
        for (const drive of driveNames) {
            const value = parseInt(interaction.fields.getTextInputValue(drive));
            if (isNaN(value)) {
                await interaction.reply({
                    content: `❌ Invalid value for ${drive}. Please enter a number.`,
                    flags: discord_js_1.MessageFlags.Ephemeral
                });
                return;
            }
            drives[drive] = value;
        }
        const validation = this.validateDrives(drives);
        if (!validation.isValid) {
            await interaction.reply({
                content: `❌ Validation errors:\n${validation.errors.join('\n')}`,
                flags: discord_js_1.MessageFlags.Ephemeral
            });
            return;
        }
        session.character.drives = drives;
        session.updatedAt = new Date();
        await this.showStep(interaction, session);
    }
    static async handleSkillsModal(interaction, session) {
        const skills = {};
        const skillNames = Object.keys(canonical_dune_data_js_1.SKILLS);
        for (const skill of skillNames) {
            const value = parseInt(interaction.fields.getTextInputValue(skill));
            if (isNaN(value)) {
                await interaction.reply({
                    content: `❌ Invalid value for ${skill}. Please enter a number.`,
                    flags: discord_js_1.MessageFlags.Ephemeral
                });
                return;
            }
            skills[skill] = value;
        }
        const validation = this.validateSkills(skills);
        if (!validation.isValid) {
            await interaction.reply({
                content: `❌ Validation errors:\n${validation.errors.join('\n')}`,
                flags: discord_js_1.MessageFlags.Ephemeral
            });
            return;
        }
        session.character.skills = skills;
        session.updatedAt = new Date();
        await this.showStep(interaction, session);
    }
    static async handleArchetypeSelect(interaction, session) {
        const selectedArchetypes = interaction.values;
        if (selectedArchetypes.length < 1 || selectedArchetypes.length > 3) {
            await interaction.update({
                content: '❌ You must select 1-3 archetypes.',
                components: []
            });
            return;
        }
        session.character.archetypes = selectedArchetypes;
        session.updatedAt = new Date();
        await interaction.update({
            embeds: [this.buildStepEmbed(session)],
            components: this.buildButtons(session.currentStep, session)
        });
    }
    static async handleFocusSelect(interaction, session) {
        const selectedFocus = interaction.values[0];
        const [skillName, focusValue] = selectedFocus.split(':');
        if (!session.character.focuses) {
            session.character.focuses = {};
        }
        session.character.focuses[skillName] = focusValue;
        session.updatedAt = new Date();
        await interaction.update({
            embeds: [this.buildStepEmbed(session)],
            components: this.buildButtons(session.currentStep, session)
        });
    }
    static async handleTalentSelect(interaction, session) {
        const selectedTalents = interaction.values;
        const currentTalents = session.character.talents || [];
        if (currentTalents.length + selectedTalents.length > 3) {
            await interaction.update({
                content: '❌ You can only have 3 talents total.',
                components: []
            });
            return;
        }
        for (const talent of selectedTalents) {
            if (!currentTalents.includes(talent)) {
                currentTalents.push(talent);
            }
        }
        session.character.talents = currentTalents;
        session.updatedAt = new Date();
        await interaction.update({
            embeds: [this.buildStepEmbed(session)],
            components: this.buildButtons(session.currentStep, session)
        });
    }
    static async handleAssetSelect(interaction, session) {
        const selectedAssets = interaction.values;
        const currentAssets = session.character.assets || [];
        if (currentAssets.length + selectedAssets.length > 3) {
            await interaction.update({
                content: '❌ You can only have 3 assets total.',
                components: []
            });
            return;
        }
        for (const asset of selectedAssets) {
            if (!currentAssets.includes(asset)) {
                currentAssets.push(asset);
            }
        }
        session.character.assets = currentAssets;
        session.updatedAt = new Date();
        await interaction.update({
            embeds: [this.buildStepEmbed(session)],
            components: this.buildButtons(session.currentStep, session)
        });
    }
    static async handleButton(interaction) {
        const session = creationSessions.get(interaction.user.id);
        if (!session) {
            await interaction.reply({
                content: '❌ No character creation in progress. Use `/sheet create` to start.',
                flags: discord_js_1.MessageFlags.Ephemeral
            });
            return;
        }
        try {
            switch (interaction.customId) {
                case 'character_creation_set_name':
                    await this.showNameModal(interaction);
                    break;
                case 'character_creation_set_concept':
                    await this.showConceptModal(interaction);
                    break;
                case 'character_creation_select_archetypes':
                    await this.showArchetypeSelect(interaction);
                    break;
                case 'character_creation_assign_drives':
                    await this.showDrivesModal(interaction);
                    break;
                case 'character_creation_assign_skills':
                    await this.showSkillsModal(interaction);
                    break;
                case 'character_creation_prev':
                    session.currentStep = Math.max(0, session.currentStep - 1);
                    await this.showStep(interaction, session);
                    break;
                case 'character_creation_next':
                    session.currentStep = Math.min(CREATION_STEPS.length - 1, session.currentStep + 1);
                    await this.showStep(interaction, session);
                    break;
                case 'character_creation_finalize':
                    await this.finalizeCharacter(interaction, session);
                    break;
                case 'canon_prev':
                    session.currentStep = Math.max(0, session.currentStep - 1);
                    await this.showStep(interaction, session);
                    break;
                case 'canon_next':
                    session.currentStep = Math.min(CREATION_STEPS.length - 1, session.currentStep + 1);
                    await this.showStep(interaction, session);
                    break;
                case 'canon_select_focuses':
                    await this.showFocusesSelect(interaction);
                    break;
                case 'canon_select_talents':
                    await this.showTalentsSelect(interaction);
                    break;
                case 'canon_select_assets':
                    await this.showAssetsSelect(interaction);
                    break;
                case 'canon_finalize':
                    await this.finalizeCharacter(interaction, session);
                    break;
                default:
                    await interaction.reply({
                        content: '❌ Unknown button interaction.',
                        flags: discord_js_1.MessageFlags.Ephemeral
                    });
            }
        }
        catch (error) {
            logger_1.logger.error('Error handling button interaction:', error);
            await interaction.reply({
                content: '❌ An error occurred processing your button click.',
                flags: discord_js_1.MessageFlags.Ephemeral
            });
        }
    }
    static getSession(userId) {
        return creationSessions.get(userId);
    }
}
exports.CharacterCreator = CharacterCreator;
