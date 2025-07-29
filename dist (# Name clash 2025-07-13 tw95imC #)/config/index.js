"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const discord_js_1 = require("discord.js");
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
            discordToken: process.env.DISCORD_TOKEN || '',
            guildId: process.env.GUILD_ID,
            clientId: process.env.CLIENT_ID || '',
            debugMode: process.env.DEBUG_MODE?.toLowerCase() === 'true',
            logLevel: process.env.LOG_LEVEL || 'info',
            dataDir: process.env.DATA_DIR || 'data',
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
}
exports.config = ConfigManager.getInstance();
