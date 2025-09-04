"use strict";
/**
 * Main Discord bot entry point
 */
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
const config_1 = require("./config");
const logger_1 = require("./utils/logger");
// Command imports
const dice_roller_1 = require("./commands/dice-roller");
const dune_system_1 = require("./commands/dune-system");
const extralife_1 = require("./commands/extralife");
const sceneHostCommand = __importStar(require("./commands/scene-host"));
const characterSheetCommand = __importStar(require("./commands/character-sheet"));
const duneTestCommand = __importStar(require("./commands/dune-test"));
const referenceCommand = __importStar(require("./commands/reference"));
const npcManagerCommand = __importStar(require("./commands/npc-manager"));
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
            // Set bot presence
            this.client.user?.setPresence({
                activities: [{
                        name: 'Dune: Adventures in the Imperium',
                        type: discord_js_1.ActivityType.Playing
                    }],
                status: 'online'
            });
            // Start Extra-Life background updates
            (0, extralife_1.startExtraLifeUpdates)();
        });
        this.client.on('interactionCreate', async (interaction) => {
            if (interaction.isCommand()) {
                await this.handleCommand(interaction);
            }
            else if (interaction.isButton()) {
                await this.handleButton(interaction);
            }
        });
        this.client.on('error', (error) => {
            logger_1.logger.error('Discord client error:', error);
        });
        this.client.on('warn', (warning) => {
            logger_1.logger.warn('Discord client warning:', warning);
        });
        // Graceful shutdown
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
        // Register all commands
        const allCommands = [
            ...dice_roller_1.diceRollerCommands,
            ...dune_system_1.duneSystemCommands,
            ...extralife_1.extraLifeCommands,
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
        const { commandName } = interaction;
        try {
            switch (commandName) {
                // Dice roller commands
                case 'roll':
                    await (0, dice_roller_1.handleRollCommand)(interaction);
                    break;
                case 'roll-help':
                    await (0, dice_roller_1.handleRollHelpCommand)(interaction);
                    break;
                // Dune system commands
                case 'dune-roll':
                    await (0, dune_system_1.handleDuneRollCommand)(interaction);
                    break;
                case 'momentum':
                    await (0, dune_system_1.handleMomentumCommand)(interaction);
                    break;
                case 'dune-help':
                    await (0, dune_system_1.handleDuneHelpCommand)(interaction);
                    break;
                // Extra-Life commands
                case 'extralife':
                    await (0, extralife_1.handleExtraLifeCommand)(interaction);
                    break;
                case 'extralife-help':
                    await (0, extralife_1.handleExtraLifeHelpCommand)(interaction);
                    break;
                // New modular commands
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
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            const response = {
                content: `❌ Error: ${errorMessage}`,
                ephemeral: true
            };
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(response);
            }
            else {
                await interaction.reply(response);
            }
        }
    }
    async handleButton(interaction) {
        try {
            // Handle momentum/threat buttons
            if (interaction.customId.includes('momentum') || interaction.customId.includes('threat')) {
                await (0, dune_system_1.handleDuneMomentumButton)(interaction);
            }
            else {
                logger_1.logger.warn(`Unknown button interaction: ${interaction.customId}`);
                await interaction.reply({
                    content: '❌ Unknown button interaction.',
                    ephemeral: true
                });
            }
        }
        catch (error) {
            logger_1.logger.error(`Error handling button ${interaction.customId}:`, error);
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
    async deployCommands() {
        const botConfig = config_1.config.getConfig();
        if (!botConfig.discordToken) {
            throw new Error('Discord token not found in configuration');
        }
        const rest = new discord_js_1.REST({ version: '10' }).setToken(botConfig.discordToken);
        const commands = Array.from(this.commands.values()).map(command => command.toJSON());
        try {
            logger_1.logger.info('Started refreshing application (/) commands...');
            if (botConfig.guildId) {
                // Deploy to specific guild (faster for development)
                await rest.put(discord_js_1.Routes.applicationGuildCommands(botConfig.clientId, botConfig.guildId), { body: commands });
                logger_1.logger.info(`Successfully reloaded ${commands.length} guild commands`);
            }
            else {
                // Deploy globally (takes up to 1 hour to propagate)
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
        const botConfig = config_1.config.getConfig();
        if (!botConfig.discordToken) {
            throw new Error('Discord token not found in configuration');
        }
        try {
            // Deploy commands first
            await this.deployCommands();
            // Login to Discord
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
// Create and export bot instance
exports.bot = new DuneBot();
// Start the bot if this file is run directly
if (require.main === module) {
    exports.bot.start().catch(error => {
        logger_1.logger.error('Failed to start bot:', error);
        process.exit(1);
    });
}
