"use strict";
/**
 * Configuration management for the Dune Discord Bot
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const discord_js_1 = require("discord.js");
// Load environment variables
dotenv_1.default.config();
class ConfigManager {
    constructor() {
        this.config = this.loadConfig();
        this.validateConfig();
    }
    static getInstance() {
        if (!ConfigManager.instance) {
            ConfigManager.instance = new ConfigManager();
        }
        return ConfigManager.instance;
    }
    loadConfig() {
        return {
            // Discord Settings
            discordToken: process.env.DISCORD_TOKEN || '',
            guildId: process.env.GUILD_ID,
            clientId: process.env.CLIENT_ID || '',
            // Extra-Life Settings
            extraLifeTeamId: process.env.EXTRALIFE_TEAM_ID,
            extraLifeParticipantId: process.env.EXTRALIFE_PARTICIPANT_ID,
            extraLifeApiBase: process.env.EXTRALIFE_API_BASE || 'https://www.extra-life.org/api',
            // Bot Settings
            debugMode: process.env.DEBUG_MODE?.toLowerCase() === 'true',
            logLevel: process.env.LOG_LEVEL || 'info',
            dataDir: process.env.DATA_DIR || 'data',
            // Discord.js Configuration
            intents: [
                discord_js_1.GatewayIntentBits.Guilds,
                discord_js_1.GatewayIntentBits.GuildMessages,
                discord_js_1.GatewayIntentBits.MessageContent,
            ],
        };
    }
    validateConfig() {
        if (!this.config.discordToken) {
            throw new Error('DISCORD_TOKEN is required in environment variables');
        }
        if (!this.config.clientId) {
            throw new Error('CLIENT_ID is required in environment variables');
        }
    }
    getConfig() {
        return { ...this.config };
    }
    get discordToken() {
        return this.config.discordToken;
    }
    get guildId() {
        return this.config.guildId;
    }
    get clientId() {
        return this.config.clientId;
    }
    get extraLifeTeamUrl() {
        return this.config.extraLifeTeamId
            ? `${this.config.extraLifeApiBase}/teams/${this.config.extraLifeTeamId}`
            : undefined;
    }
    get extraLifeParticipantUrl() {
        return this.config.extraLifeParticipantId
            ? `${this.config.extraLifeApiBase}/participants/${this.config.extraLifeParticipantId}`
            : undefined;
    }
    get hasExtraLifeConfig() {
        return !!(this.config.extraLifeTeamId || this.config.extraLifeParticipantId);
    }
}
exports.config = ConfigManager.getInstance();
