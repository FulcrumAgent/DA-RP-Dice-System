"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataManager = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("./logger");
const config_1 = require("../config");
class DataManager {
    constructor() {
        this.dataDir = config_1.config.getConfig().dataDir;
        this.ensureDataDir();
    }
    async ensureDataDir() {
        try {
            await promises_1.default.access(this.dataDir);
        }
        catch {
            await promises_1.default.mkdir(this.dataDir, { recursive: true });
            logger_1.logger.info(`Created data directory: ${this.dataDir}`);
        }
    }
    async loadJson(filename) {
        const filepath = path_1.default.join(this.dataDir, filename);
        try {
            const data = await promises_1.default.readFile(filepath, 'utf-8');
            return JSON.parse(data);
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                logger_1.logger.error(`Error loading ${filename}:`, error);
            }
            return null;
        }
    }
    async saveJson(filename, data) {
        const filepath = path_1.default.join(this.dataDir, filename);
        try {
            await this.ensureDataDir();
            await promises_1.default.writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8');
        }
        catch (error) {
            logger_1.logger.error(`Error saving ${filename}:`, error);
            throw error;
        }
    }
    async loadData(filename) {
        return await this.loadJson(filename);
    }
    async saveData(filename, data) {
        await this.saveJson(filename, data);
    }
    async getMomentumPool(guildId, channelId) {
        const pools = await this.loadJson('momentum_pools.json') || {};
        const key = `${guildId}_${channelId}`;
        if (pools[key]) {
            return pools[key];
        }
        return {
            guildId,
            channelId,
            momentum: 0,
            threat: 0,
            lastUpdated: new Date().toISOString()
        };
    }
    async saveMomentumPool(pool) {
        const pools = await this.loadJson('momentum_pools.json') || {};
        const key = `${pool.guildId}_${pool.channelId}`;
        pool.lastUpdated = new Date().toISOString();
        pools[key] = pool;
        await this.saveJson('momentum_pools.json', pools);
    }
    async updateMomentum(guildId, channelId, momentumChange = 0, threatChange = 0) {
        const pool = await this.getMomentumPool(guildId, channelId);
        pool.momentum = Math.max(0, pool.momentum + momentumChange);
        pool.threat = Math.max(0, pool.threat + threatChange);
        await this.saveMomentumPool(pool);
        return pool;
    }
    async resetMomentumPool(guildId, channelId) {
        const pool = {
            guildId,
            channelId,
            momentum: 0,
            threat: 0,
            lastUpdated: new Date().toISOString()
        };
        await this.saveMomentumPool(pool);
        return pool;
    }
    async getAllMomentumPools(guildId) {
        const pools = await this.loadJson('momentum_pools.json') || {};
        const guildPools = {};
        for (const [, pool] of Object.entries(pools)) {
            if (pool.guildId === guildId) {
                guildPools[pool.channelId] = pool;
            }
        }
        return guildPools;
    }
    async saveBotSettings(guildId, settings) {
        const allSettings = await this.loadJson('bot_settings.json') || {};
        allSettings[guildId] = settings;
        await this.saveJson('bot_settings.json', allSettings);
    }
    async loadBotSettings(guildId) {
        const allSettings = await this.loadJson('bot_settings.json') || {};
        return allSettings[guildId] || {};
    }
}
exports.DataManager = DataManager;
