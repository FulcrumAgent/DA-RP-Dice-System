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
exports.bot = void 0;
const discord_js_1 = require("discord.js");
const dotenv_1 = require("dotenv");
const logger_1 = require("./utils/logger");
const dice_roller_1 = require("./commands/dice-roller");
const dune_system_1 = require("./commands/dune-system");
const sceneHostCommand = __importStar(require("./commands/scene-host"));
const characterSheetCommand = __importStar(require("./commands/character-sheet"));
const character_sheet_handlers_1 = require("./commands/character-sheet-handlers");
const character_sheet_buttons_1 = require("./commands/character-sheet-buttons");
const duneTestCommand = __importStar(require("./commands/dune-test"));
const referenceCommand = __importStar(require("./commands/reference"));
const npcManagerCommand = __importStar(require("./commands/npc-manager"));
const npc_manager_1 = require("./commands/npc-manager");
class DuneBot {
    constructor() {
        this.client = new discord_js_1.Client({
            intents: [
                discord_js_1.GatewayIntentBits.Guilds,
                discord_js_1.GatewayIntentBits.GuildMessages,
                discord_js_1.GatewayIntentBits.MessageContent,
                discord_js_1.GatewayIntentBits.GuildMessageReactions
            ]
        });
        this.commands = new discord_js_1.Collection();
        this.setupEventHandlers();
        this.registerCommands();
    }
    setupEventHandlers() {
        this.client.once('ready', () => {
            logger_1.logger.info(`Bot logged in as ${this.client.user?.tag}`);
            this.client.user?.setPresence({
                activities: [{
                        name: 'Dune: Adventures in the Imperium',
                        type: discord_js_1.ActivityType.Playing
                    }],
                status: 'online'
            });
        });
        this.client.on('interactionCreate', async (interaction) => {
            await this.handleInteraction(interaction);
        });
        this.client.on('error', (error) => {
            logger_1.logger.error('Discord client error:', error);
        });
        this.client.on('warn', (warning) => {
            logger_1.logger.warn('Discord client warning:', warning);
        });
        process.on('SIGINT', () => {
            logger_1.logger.info('Received SIGINT, shutting down gracefully...');
            this.client.destroy();
            process.exit(0);
        });
        process.on('SIGTERM', () => {
            logger_1.logger.info('Received SIGTERM, shutting down gracefully...');
            this.client.destroy();
            process.exit(0);
        });
    }
    registerCommands() {
        const allCommands = [
            ...dice_roller_1.diceRollerCommands,
            ...dune_system_1.duneSystemCommands,
            sceneHostCommand.data,
            characterSheetCommand.data,
            duneTestCommand.data,
            referenceCommand.data,
            npcManagerCommand.data
        ];
        allCommands.forEach((command) => {
            this.commands.set(command.name, command);
        });
        logger_1.logger.info(`Registered ${this.commands.size} slash commands`);
    }
    async handleCommand(interaction) {
        if (!interaction.isCommand()) {
            return;
        }
        const { commandName } = interaction;
        try {
            switch (commandName) {
                case 'roll':
                    await (0, dice_roller_1.handleRollCommand)(interaction);
                    break;
                case 'roll-help':
                    await (0, dice_roller_1.handleRollHelpCommand)(interaction);
                    break;
                case 'dune-roll':
                    await (0, dune_system_1.handleDuneRollCommand)(interaction);
                    break;
                case 'momentum':
                    await (0, dune_system_1.handleMomentumCommand)(interaction);
                    break;
                case 'dune-help':
                    await (0, dune_system_1.handleDuneHelpCommand)(interaction);
                    break;
                case 'scene':
                    await sceneHostCommand.execute(interaction);
                    break;
                case 'sheet':
                    await characterSheetCommand.execute(interaction);
                    break;
                case 'test':
                case 'damage':
                    await duneTestCommand.execute(interaction);
                    break;
                case 'lookup':
                    await referenceCommand.execute(interaction);
                    break;
                case 'npc':
                    await npcManagerCommand.execute(interaction);
                    break;
                default:
                    logger_1.logger.warn(`Unknown command: ${commandName}`);
                    await interaction.reply({
                        content: '❌ Unknown command.',
                        ephemeral: true
                    });
            }
        }
        catch (error) {
            logger_1.logger.error(`Error handling command ${commandName}:`, error);
            if (interaction.isRepliable()) {
                try {
                    const interactionAny = interaction;
                    if (interactionAny.replied || interactionAny.deferred) {
                        await interaction.followUp({
                            content: '❌ An error occurred while processing your command.',
                            ephemeral: true
                        });
                    }
                    else {
                        await interaction.reply({
                            content: '❌ An error occurred while processing your command.',
                            ephemeral: true
                        });
                    }
                }
                catch (e) {
                    logger_1.logger.error('Failed to send error response:', e);
                }
            }
        }
    }
    async handleAutocomplete(interaction) {
        if (!interaction.isAutocomplete()) {
            return;
        }
        const { commandName } = interaction;
        try {
            switch (commandName) {
                case 'npc':
                    if ('autocomplete' in npcManagerCommand) {
                        await npcManagerCommand.autocomplete(interaction);
                    }
                    else {
                        await interaction.respond([]);
                    }
                    break;
                default:
                    await interaction.respond([]);
            }
        }
        catch (error) {
            logger_1.logger.error(`Error handling autocomplete for ${commandName}:`, error);
            try {
                await interaction.respond([]);
            }
            catch (e) {
                logger_1.logger.error('Failed to send error response:', e);
            }
        }
    }
    async handleInteraction(interaction) {
        try {
            if (interaction.isCommand()) {
                await this.handleCommand(interaction);
            }
            else if (interaction.isAutocomplete()) {
                await this.handleAutocomplete(interaction);
            }
            else if (interaction.isButton()) {
                await this.handleButton(interaction);
            }
            else if (interaction.isStringSelectMenu()) {
                await this.handleSelectMenu(interaction);
            }
            else if (interaction.isModalSubmit()) {
                await this.handleModalSubmit(interaction);
            }
            else {
                logger_1.logger.warn(`Unknown interaction type: ${interaction.type}`);
            }
        }
        catch (error) {
            logger_1.logger.error('Error in handleInteraction:', error);
            if (interaction.isRepliable()) {
                try {
                    const interactionAny = interaction;
                    if (interactionAny.replied || interactionAny.deferred) {
                        await interaction.followUp({
                            content: '❌ An error occurred while processing your request.',
                            ephemeral: true
                        });
                    }
                    else {
                        await interaction.reply({
                            content: '❌ An error occurred while processing your request.',
                            ephemeral: true
                        });
                    }
                }
                catch (e) {
                    logger_1.logger.error('Failed to send error response:', e);
                }
            }
        }
    }
    async handleSelectMenu(interaction) {
        if (!interaction.isStringSelectMenu()) {
            return;
        }
        try {
            const member = interaction.member;
            if (interaction.customId.startsWith('character_creation_')) {
                const { CharacterCreator } = await Promise.resolve().then(() => __importStar(require('./commands/character-creator.js')));
                await CharacterCreator.handleSelectMenu(interaction);
                return;
            }
            if (interaction.customId === 'select_drive') {
                const { handleDriveSelect } = await Promise.resolve().then(() => __importStar(require('./commands/character-sheet-drives')));
                await handleDriveSelect(interaction, member);
            }
            else if (interaction.customId.startsWith('select_drive_value:')) {
                const { handleDriveValueSelect } = await Promise.resolve().then(() => __importStar(require('./commands/character-sheet-drives')));
                await handleDriveValueSelect(interaction, member);
            }
            else if (interaction.customId === 'select_talent') {
                const { handleTalentSelect } = await Promise.resolve().then(() => __importStar(require('./commands/character-sheet-talents')));
                await handleTalentSelect(interaction, member);
            }
            else if (interaction.customId === 'select_skill_value') {
                const { handleSkillValueSelect } = await Promise.resolve().then(() => __importStar(require('./commands/character-sheet-skills')));
                await handleSkillValueSelect(interaction, member);
            }
            else if (interaction.customId === 'focus_skill_select') {
                try {
                    const { handleFocusSelect } = await Promise.resolve().then(() => __importStar(require('./commands/character-sheet-focuses')));
                    await handleFocusSelect(interaction, member);
                }
                catch (error) {
                    logger_1.logger.error('Failed to load focus handler:', error);
                    await interaction.reply({
                        content: '❌ Focus selection is not available.',
                        ephemeral: true
                    });
                }
            }
            else if (interaction.customId === 'archetype_select') {
                try {
                    const { handleArchetypeChoice } = await Promise.resolve().then(() => __importStar(require('./commands/character-sheet-archetypes')));
                    await handleArchetypeChoice(interaction, member);
                }
                catch (error) {
                    logger_1.logger.error('Failed to load archetype handler:', error);
                    await interaction.reply({
                        content: '❌ Archetype selection is not available.',
                        ephemeral: true
                    });
                }
            }
            else {
                logger_1.logger.warn(`Unhandled select menu interaction: ${interaction.customId}`);
                await interaction.reply({
                    content: '❌ This select menu is not currently handled.',
                    ephemeral: true
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Error handling interaction:', error);
            if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ An error occurred while processing your request.',
                    ephemeral: true
                }).catch(e => logger_1.logger.error('Failed to send error response:', e));
            }
        }
    }
    async handleButton(interaction) {
        if (!interaction.isButton()) {
            return;
        }
        try {
            if (interaction.customId.startsWith('nav_')) {
                if (interaction.customId.startsWith('nav_prev_') || interaction.customId.startsWith('nav_next_')) {
                    const direction = interaction.customId.startsWith('nav_prev_') ? 'prev' : 'next';
                    const { characterCreationSessions, handleNavigationButton } = await Promise.resolve().then(() => __importStar(require('./commands/character-creation-flow.js')));
                    const session = characterCreationSessions.get(interaction.user.id);
                    if (!session) {
                        await interaction.reply({
                            content: '❌ No character creation in progress.',
                            ephemeral: true
                        });
                        return;
                    }
                    await handleNavigationButton(interaction, direction, session);
                    return;
                }
            }
            if (interaction.customId.startsWith('roll_')) {
                const rollType = interaction.customId.replace('roll_', '');
                await this.handleDiceRollButton(interaction, rollType);
                return;
            }
            const characterSheet = await Promise.resolve().then(() => __importStar(require('./commands/character-sheet.js')));
            switch (interaction.customId) {
                case 'concept_set':
                    const member = interaction.member;
                    if (member) {
                        await this.handleConceptSetButton(interaction, member);
                    }
                    break;
                case 'concept_clear':
                    const memberClear = interaction.member;
                    if (memberClear) {
                        await this.handleConceptClearButton(interaction, memberClear);
                    }
                    break;
                case 'concept_continue':
                    const memberContinue = interaction.member;
                    if (memberContinue) {
                        await this.handleConceptContinueButton(interaction, memberContinue);
                    }
                    break;
                case 'name_edit':
                    const memberNameEdit = interaction.member;
                    if (memberNameEdit) {
                        await this.handleNameEditButton(interaction, memberNameEdit);
                    }
                    break;
                case 'archetype_select':
                    const memberArchetype = interaction.member;
                    if (memberArchetype) {
                        await this.handleArchetypeSelectButton(interaction, memberArchetype);
                    }
                    break;
                case 'skills_assign':
                    const memberSkills = interaction.member;
                    if (memberSkills) {
                        await this.handleSkillsAssignButton(interaction, memberSkills);
                    }
                    break;
                case 'focuses_select':
                    const memberFocuses = interaction.member;
                    if (memberFocuses) {
                        await this.handleFocusesSelectButton(interaction, memberFocuses);
                    }
                    break;
                case 'drives_assign':
                    const memberDrives = interaction.member;
                    if (memberDrives) {
                        await this.handleDrivesAssignButton(interaction, memberDrives);
                    }
                    break;
                case 'talents_select':
                    const memberTalents = interaction.member;
                    if (memberTalents) {
                        await this.handleTalentsSelectButton(interaction, memberTalents);
                    }
                    break;
                case 'character_creation_set_name':
                case 'character_creation_set_concept':
                case 'character_creation_select_archetypes':
                case 'character_creation_assign_drives':
                case 'character_creation_assign_skills':
                case 'character_creation_select_focuses':
                case 'character_creation_select_talents':
                case 'character_creation_select_assets':
                case 'character_creation_prev':
                case 'character_creation_next':
                case 'character_creation_finalize':
                    const { CharacterCreator } = await Promise.resolve().then(() => __importStar(require('./commands/character-creator.js')));
                    await CharacterCreator.handleButton(interaction);
                    break;
                case 'focus_back':
                case 'focus_continue':
                    const memberFocus = interaction.member;
                    if (memberFocus) {
                        await (0, character_sheet_handlers_1.handleButtonInteraction)(interaction);
                    }
                    break;
                case 'finalize_character':
                    const memberFinalize = interaction.member;
                    if (memberFinalize) {
                        await (0, character_sheet_buttons_1.handleFinalizeButton)(interaction);
                    }
                    break;
                case 'cancel_character':
                    const memberCancel = interaction.member;
                    if (memberCancel) {
                        await (0, character_sheet_buttons_1.handleCancelButton)(interaction);
                    }
                    break;
                default:
                    if (interaction.customId.startsWith('focus_remove_')) {
                        const memberFocusRemove = interaction.member;
                        if (memberFocusRemove) {
                            await (0, character_sheet_handlers_1.handleButtonInteraction)(interaction);
                        }
                        break;
                    }
                    if (interaction.customId.startsWith('save_generated_npc_')) {
                        const memberSaveNPC = interaction.member;
                        if (memberSaveNPC) {
                            await (0, npc_manager_1.handleSaveGeneratedNPC)(interaction, memberSaveNPC);
                        }
                        break;
                    }
                    logger_1.logger.warn(`Unhandled button interaction: ${interaction.customId}`);
                    await interaction.reply({
                        content: '❌ This button is not currently handled.',
                        ephemeral: true
                    });
            }
        }
        catch (error) {
            logger_1.logger.error('Error handling button interaction:', error);
            if (interaction.isRepliable()) {
                try {
                    const interactionAny = interaction;
                    if (interactionAny.replied || interactionAny.deferred) {
                        await interaction.followUp({
                            content: '❌ An error occurred while processing your button click.',
                            ephemeral: true
                        });
                    }
                    else {
                        await interaction.reply({
                            content: '❌ An error occurred while processing your button click.',
                            ephemeral: true
                        });
                    }
                }
                catch (e) {
                    logger_1.logger.error('Failed to send error response:', e);
                }
            }
        }
    }
    async handleModalSubmit(interaction) {
        if (!interaction.isModalSubmit()) {
            return;
        }
        try {
            const member = interaction.member;
            if (interaction.customId === 'character_creation_name_modal' ||
                interaction.customId === 'character_creation_concept_modal' ||
                interaction.customId === 'character_creation_drives_modal' ||
                interaction.customId === 'character_creation_skills_modal') {
                const { CharacterCreator } = await Promise.resolve().then(() => __importStar(require('./commands/character-creator.js')));
                await CharacterCreator.handleModal(interaction);
            }
            else if (interaction.customId === 'concept_set_modal') {
                await this.handleConceptSetModal(interaction, member);
            }
            else if (interaction.customId.startsWith('save_npc_name_')) {
                await (0, npc_manager_1.handleSaveNPCNameModal)(interaction, member);
            }
            else if (interaction.customId === 'name_edit_modal') {
                await this.handleNameEditModal(interaction, member);
            }
            else if (interaction.customId.startsWith('focus_input_') || interaction.customId.startsWith('statement_input_')) {
                await characterSheetCommand.handleInteraction(interaction);
            }
            else {
                logger_1.logger.warn(`Unknown modal submit interaction: ${interaction.customId}`);
                await interaction.reply({
                    content: '❌ Unknown modal submit interaction.',
                    ephemeral: true
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Error handling modal submit:', error);
            if (interaction.isRepliable()) {
                try {
                    await interaction.reply({
                        content: '❌ An error occurred while processing the form.',
                        ephemeral: true
                    });
                }
                catch (e) {
                    logger_1.logger.error('Failed to send error response:', e);
                }
            }
        }
    }
    async handleDiceRollButton(interaction, rollType) {
        if (!interaction.isButton()) {
            return;
        }
        try {
            await interaction.reply({
                content: `Rolling ${rollType}...`,
                ephemeral: true
            });
        }
        catch (error) {
            logger_1.logger.error('Error handling dice roll button:', error);
            if (interaction.isRepliable()) {
                try {
                    await interaction.reply({
                        content: '❌ Failed to process dice roll.',
                        ephemeral: true
                    });
                }
                catch (e) {
                    logger_1.logger.error('Failed to send error response:', e);
                }
            }
        }
    }
    async handleSkillSelection(interaction) {
        if (!interaction.isStringSelectMenu()) {
            return;
        }
        try {
            await characterSheetCommand.handleInteraction(interaction);
        }
        catch (error) {
            logger_1.logger.error('Error handling skill selection:', error);
            if (interaction.isRepliable()) {
                await interaction.reply({
                    content: '❌ An error occurred while processing your selection.',
                    ephemeral: true
                }).catch(e => logger_1.logger.error('Failed to send error response:', e));
            }
        }
    }
    async handleNameEditButton(interaction, member) {
        try {
            const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = await Promise.resolve().then(() => __importStar(require('discord.js')));
            const modal = new ModalBuilder()
                .setCustomId('name_edit_modal')
                .setTitle('Set Character Name');
            const nameInput = new TextInputBuilder()
                .setCustomId('character_name')
                .setLabel('Character Name')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Enter your character name...')
                .setRequired(true)
                .setMaxLength(50);
            const firstActionRow = new ActionRowBuilder().addComponents(nameInput);
            modal.addComponents(firstActionRow);
            await interaction.showModal(modal);
        }
        catch (error) {
            logger_1.logger.error('Error showing name edit modal:', error);
            await interaction.reply({
                content: '❌ Failed to open name editor.',
                ephemeral: true
            });
        }
    }
    async handleNameEditModal(interaction, member) {
        try {
            const characterName = interaction.fields.getTextInputValue('character_name');
            const { characterCreationSessions, showCreationPanel } = await Promise.resolve().then(() => __importStar(require('./commands/character-creation-flow.js')));
            const session = characterCreationSessions.get(interaction.user.id);
            if (!session) {
                await interaction.reply({
                    content: '❌ No character creation session found.',
                    ephemeral: true
                });
                return;
            }
            session.characterData.name = characterName;
            await showCreationPanel(interaction, member, session.currentStep, `✅ Character name set to "${characterName}". Click **Next** to continue to the Concept step.`);
        }
        catch (error) {
            logger_1.logger.error('Error handling name edit modal:', error);
            await interaction.reply({
                content: '❌ Failed to update character name.',
                ephemeral: true
            });
        }
    }
    async handleArchetypeSelectButton(interaction, member) {
        try {
            const { characterCreationSessions } = await Promise.resolve().then(() => __importStar(require('./commands/character-creation-flow.js')));
            const session = characterCreationSessions.get(interaction.user.id);
            if (!session) {
                await interaction.reply({
                    content: '❌ No character creation session found. Please start a new one with `/sheet create`',
                    ephemeral: true
                });
                return;
            }
            await interaction.reply({
                content: '⚙️ Archetype selection is being integrated with the new character creation system. This feature will be available soon!',
                ephemeral: true
            });
        }
        catch (error) {
            logger_1.logger.error('Error handling archetype select:', error);
            await interaction.reply({
                content: '❌ Archetype selection is not available yet.',
                ephemeral: true
            });
        }
    }
    async handleSkillsAssignButton(interaction, member) {
        try {
            const characterSheet = await Promise.resolve().then(() => __importStar(require('./commands/character-sheet.js')));
            await characterSheet.handleInteraction(interaction);
        }
        catch (error) {
            logger_1.logger.error('Error handling skills assign:', error);
            await interaction.reply({
                content: '❌ Skills assignment is not available yet.',
                ephemeral: true
            });
        }
    }
    async handleFocusesSelectButton(interaction, member) {
        try {
            const characterSheet = await Promise.resolve().then(() => __importStar(require('./commands/character-sheet.js')));
            await characterSheet.handleInteraction(interaction);
        }
        catch (error) {
            logger_1.logger.error('Error handling focuses select:', error);
            await interaction.reply({
                content: '❌ Focus selection is not available yet.',
                ephemeral: true
            });
        }
    }
    async handleDrivesAssignButton(interaction, member) {
        try {
            const characterSheet = await Promise.resolve().then(() => __importStar(require('./commands/character-sheet.js')));
            await characterSheet.handleInteraction(interaction);
        }
        catch (error) {
            logger_1.logger.error('Error handling drives assign:', error);
            await interaction.reply({
                content: '❌ Drives assignment is not available yet.',
                ephemeral: true
            });
        }
    }
    async handleTalentsSelectButton(interaction, member) {
        try {
            const characterSheet = await Promise.resolve().then(() => __importStar(require('./commands/character-sheet.js')));
            await characterSheet.handleInteraction(interaction);
        }
        catch (error) {
            logger_1.logger.error('Error handling talents select:', error);
            await interaction.reply({
                content: '❌ Talents selection is not available yet.',
                ephemeral: true
            });
        }
    }
    async handleConceptSetButton(interaction, member) {
        try {
            const { characterCreationSessions } = await Promise.resolve().then(() => __importStar(require('./commands/character-creation-flow.js')));
            const session = characterCreationSessions.get(interaction.user.id);
            if (!session) {
                await interaction.reply({
                    content: '❌ No character creation session found. Please start a new one with `/sheet create`',
                    ephemeral: true
                });
                return;
            }
            const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = await Promise.resolve().then(() => __importStar(require('discord.js')));
            const currentConcept = session.characterData.concepts?.[0] || '';
            const modal = new ModalBuilder()
                .setCustomId('concept_set_modal')
                .setTitle(currentConcept ? 'Edit Character Concept' : 'Set Character Concept');
            const conceptInput = new TextInputBuilder()
                .setCustomId('concept_text')
                .setLabel('Character Concept')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('e.g., "Fremen desert warrior", "Noble house spy seeking revenge"')
                .setRequired(true)
                .setMaxLength(200);
            if (currentConcept) {
                conceptInput.setValue(currentConcept);
            }
            const actionRow = new ActionRowBuilder().addComponents(conceptInput);
            modal.addComponents(actionRow);
            await interaction.showModal(modal);
        }
        catch (error) {
            logger_1.logger.error('Error handling concept set:', error);
            await interaction.reply({
                content: '❌ Concept setting is not available yet.',
                ephemeral: true
            });
        }
    }
    async handleConceptSetModal(interaction, member) {
        try {
            const { characterCreationSessions } = await Promise.resolve().then(() => __importStar(require('./commands/character-creation-flow.js')));
            const session = characterCreationSessions.get(interaction.user.id);
            if (!session) {
                await interaction.reply({
                    content: '❌ No character creation session found.',
                    ephemeral: true
                });
                return;
            }
            const concept = interaction.fields.getTextInputValue('concept_text');
            if (!session.characterData.concepts) {
                session.characterData.concepts = [];
            }
            session.characterData.concepts = [concept];
            const channel = interaction.channel;
            if (channel && 'messages' in channel) {
                const messages = await channel.messages.fetch({ limit: 10 });
                const botMessage = messages.find(msg => msg.author.id === interaction.client.user?.id &&
                    msg.embeds.length > 0 &&
                    msg.embeds[0].title?.includes('Character Creation'));
                if (botMessage && botMessage.embeds[0]) {
                    const currentEmbed = botMessage.embeds[0];
                    const { EmbedBuilder } = await Promise.resolve().then(() => __importStar(require('discord.js')));
                    const updatedEmbed = new EmbedBuilder()
                        .setColor(currentEmbed.color)
                        .setTitle(currentEmbed.title)
                        .setDescription(`✅ **Character concept set to "${concept}".**\n\nClick **Next** to continue to the Archetype step.`)
                        .setFooter(currentEmbed.footer);
                    if (currentEmbed.fields) {
                        updatedEmbed.addFields(currentEmbed.fields);
                    }
                    await botMessage.edit({
                        embeds: [updatedEmbed],
                        components: botMessage.components
                    });
                    await interaction.deferReply({ ephemeral: true });
                    await interaction.deleteReply();
                    return;
                }
            }
            await interaction.reply({
                content: `✅ Character concept set to "${concept}".`,
                ephemeral: true
            });
        }
        catch (error) {
            logger_1.logger.error('Error handling concept set modal:', error);
            await interaction.reply({
                content: '❌ Failed to update character concept.',
                ephemeral: true
            });
        }
    }
    async handleConceptClearButton(interaction, member) {
        try {
            const { characterCreationSessions, showCreationPanel } = await Promise.resolve().then(() => __importStar(require('./commands/character-creation-flow.js')));
            const session = characterCreationSessions.get(interaction.user.id);
            if (!session) {
                await interaction.reply({
                    content: '❌ No character creation session found.',
                    ephemeral: true
                });
                return;
            }
            session.characterData.concepts = [];
            await showCreationPanel(interaction, member, session.currentStep, `✅ Character concept cleared.`);
        }
        catch (error) {
            logger_1.logger.error('Error handling concept clear:', error);
            await interaction.reply({
                content: '❌ Failed to clear character concept.',
                ephemeral: true
            });
        }
    }
    async handleConceptContinueButton(interaction, member) {
        try {
            const { characterCreationSessions, handleNavigationButton } = await Promise.resolve().then(() => __importStar(require('./commands/character-creation-flow.js')));
            const session = characterCreationSessions.get(interaction.user.id);
            if (!session) {
                await interaction.reply({
                    content: '❌ No character creation session found.',
                    ephemeral: true
                });
                return;
            }
            await handleNavigationButton(interaction, 'next', session);
        }
        catch (error) {
            logger_1.logger.error('Error handling concept continue:', error);
            await interaction.reply({
                content: '❌ Failed to continue from concept step.',
                ephemeral: true
            });
        }
    }
    async deployCommands() {
        (0, dotenv_1.config)();
        const botConfig = {
            discordToken: process.env.DISCORD_TOKEN,
            clientId: process.env.CLIENT_ID,
            guildId: process.env.GUILD_ID
        };
        if (!botConfig.discordToken) {
            throw new Error('Discord token not found in configuration');
        }
        const rest = new discord_js_1.REST({ version: '10' }).setToken(botConfig.discordToken);
        const commands = Array.from(this.commands.values()).map(command => command.toJSON());
        try {
            logger_1.logger.info('Started refreshing application (/) commands...');
            if (botConfig.guildId) {
                await rest.put(discord_js_1.Routes.applicationGuildCommands(botConfig.clientId, botConfig.guildId), { body: commands });
                logger_1.logger.info(`Successfully reloaded ${commands.length} guild commands`);
            }
            else {
                await rest.put(discord_js_1.Routes.applicationCommands(botConfig.clientId), { body: commands });
                logger_1.logger.info(`Successfully reloaded ${commands.length} global commands`);
            }
        }
        catch (error) {
            logger_1.logger.error('Error deploying commands:', error);
            throw error;
        }
    }
    async start() {
        (0, dotenv_1.config)();
        const botConfig = {
            discordToken: process.env.DISCORD_TOKEN,
            clientId: process.env.CLIENT_ID,
            guildId: process.env.GUILD_ID
        };
        if (!botConfig.discordToken) {
            throw new Error('Discord token not found in configuration');
        }
        try {
            await this.deployCommands();
            await this.client.login(botConfig.discordToken);
        }
        catch (error) {
            logger_1.logger.error('Failed to start bot:', error);
            throw error;
        }
    }
    getClient() {
        return this.client;
    }
}
exports.bot = new DuneBot();
if (require.main === module) {
    exports.bot.start().catch(error => {
        logger_1.logger.error('Failed to start bot:', error);
        process.exit(1);
    });
}
