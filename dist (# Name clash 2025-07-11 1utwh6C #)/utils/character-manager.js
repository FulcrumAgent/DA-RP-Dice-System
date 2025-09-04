"use strict";
/**
 * Character Sheet Management System for Dune 2d20
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.characterManager = exports.CharacterManager = void 0;
const database_1 = require("./database");
const logger_1 = require("./logger");
class CharacterManager {
    constructor() {
        this.characters = new Map();
        this.npcs = new Map();
        this.dataManager = new database_1.DataManager();
        this.loadData();
    }
    /**
     * Load characters and NPCs from storage
     */
    async loadData() {
        try {
            const charactersData = await this.dataManager.loadData('characters.json');
            const npcsData = await this.dataManager.loadData('npcs.json');
            if (charactersData) {
                charactersData.forEach(char => {
                    this.characters.set(char.id, char);
                });
                logger_1.logger.info(`Loaded ${this.characters.size} characters`);
            }
            if (npcsData) {
                npcsData.forEach(npc => {
                    this.npcs.set(npc.id, npc);
                });
                logger_1.logger.info(`Loaded ${this.npcs.size} NPCs`);
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to load character data:', error);
        }
    }
    /**
     * Save characters to storage
     */
    async saveCharacters() {
        try {
            const charactersArray = Array.from(this.characters.values());
            await this.dataManager.saveData('characters.json', charactersArray);
        }
        catch (error) {
            logger_1.logger.error('Failed to save characters:', error);
        }
    }
    /**
     * Save NPCs to storage
     */
    async saveNPCs() {
        try {
            const npcsArray = Array.from(this.npcs.values());
            await this.dataManager.saveData('npcs.json', npcsArray);
        }
        catch (error) {
            logger_1.logger.error('Failed to save NPCs:', error);
        }
    }
    /**
     * Create a new character
     */
    async createCharacter(userId, guildId, name, concept, options = {}) {
        // Check if user already has an active character
        const existingChar = this.getUserActiveCharacter(userId, guildId);
        if (existingChar) {
            throw new Error('You already have an active character. Use `/sheet delete` first if you want to create a new one.');
        }
        const character = {
            id: `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId,
            guildId,
            name,
            concept,
            house: options.house,
            homeworld: options.homeworld,
            attributes: {
                muscle: options.attributes?.muscle || 8,
                move: options.attributes?.move || 8,
                intellect: options.attributes?.intellect || 8,
                awareness: options.attributes?.awareness || 8,
                communication: options.attributes?.communication || 8,
                discipline: options.attributes?.discipline || 8,
                ...options.attributes
            },
            skills: this.getDefaultSkills(),
            drives: [],
            assets: [],
            traits: [],
            determination: 3,
            maxDetermination: 3,
            experience: {
                total: 0,
                spent: 0,
                available: 0
            },
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            isActive: true
        };
        this.characters.set(character.id, character);
        await this.saveCharacters();
        logger_1.logger.info(`Created character "${name}" for user ${userId}`);
        return character;
    }
    /**
     * Get default skills for new characters
     */
    getDefaultSkills() {
        return [
            { name: 'Battle', value: 0 },
            { name: 'Command', value: 0 },
            { name: 'Discipline', value: 0 },
            { name: 'Drive', value: 0 },
            { name: 'Infiltrate', value: 0 },
            { name: 'Investigate', value: 0 },
            { name: 'Lore', value: 0 },
            { name: 'Medicine', value: 0 },
            { name: 'Mentat', value: 0 },
            { name: 'Persuade', value: 0 },
            { name: 'Pilot', value: 0 },
            { name: 'Spice', value: 0 },
            { name: 'Stealth', value: 0 },
            { name: 'Survival', value: 0 },
            { name: 'Tech', value: 0 },
            { name: 'Understand', value: 0 }
        ];
    }
    /**
     * Update character
     */
    async updateCharacter(characterId, updates) {
        const character = this.characters.get(characterId);
        if (!character) {
            throw new Error('Character not found');
        }
        // Merge updates
        Object.assign(character, updates, {
            lastUpdated: new Date().toISOString()
        });
        await this.saveCharacters();
        return character;
    }
    /**
     * Add skill to character
     */
    async addSkill(characterId, skillName, value, focus) {
        const character = this.characters.get(characterId);
        if (!character) {
            throw new Error('Character not found');
        }
        const existingSkillIndex = character.skills.findIndex(s => s.name === skillName);
        if (existingSkillIndex >= 0) {
            character.skills[existingSkillIndex] = { name: skillName, value, focus };
        }
        else {
            character.skills.push({ name: skillName, value, focus });
        }
        character.lastUpdated = new Date().toISOString();
        await this.saveCharacters();
        return character;
    }
    /**
     * Add drive to character
     */
    async addDrive(characterId, name, statement, value) {
        const character = this.characters.get(characterId);
        if (!character) {
            throw new Error('Character not found');
        }
        character.drives.push({ name, statement, value });
        character.lastUpdated = new Date().toISOString();
        await this.saveCharacters();
        return character;
    }
    /**
     * Add asset to character
     */
    async addAsset(characterId, asset) {
        const character = this.characters.get(characterId);
        if (!character) {
            throw new Error('Character not found');
        }
        character.assets.push(asset);
        character.lastUpdated = new Date().toISOString();
        await this.saveCharacters();
        return character;
    }
    /**
     * Get user's active character
     */
    getUserActiveCharacter(userId, guildId) {
        return Array.from(this.characters.values()).find(char => char.userId === userId && char.guildId === guildId && char.isActive);
    }
    /**
     * Get character by ID
     */
    getCharacter(characterId) {
        return this.characters.get(characterId);
    }
    /**
     * Delete character
     */
    async deleteCharacter(characterId, userId) {
        const character = this.characters.get(characterId);
        if (!character) {
            return false;
        }
        if (character.userId !== userId) {
            throw new Error('You can only delete your own characters');
        }
        this.characters.delete(characterId);
        await this.saveCharacters();
        logger_1.logger.info(`Deleted character "${character.name}" for user ${userId}`);
        return true;
    }
    /**
     * Create NPC
     */
    async createNPC(name, guildId, concept, description, createdBy, options = {}) {
        const npc = {
            id: `npc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name,
            guildId,
            concept,
            description,
            attributes: options.attributes,
            skills: options.skills,
            assets: options.assets,
            traits: options.traits,
            createdBy,
            createdAt: new Date().toISOString()
        };
        this.npcs.set(npc.id, npc);
        await this.saveNPCs();
        logger_1.logger.info(`Created NPC "${name}" by user ${createdBy}`);
        return npc;
    }
    /**
     * Update determination for character
     */
    async updateDetermination(characterId, change) {
        const character = this.characters.get(characterId);
        if (!character) {
            throw new Error('Character not found');
        }
        character.determination = Math.max(0, Math.min(character.maxDetermination, character.determination + change));
        character.lastUpdated = new Date().toISOString();
        await this.saveCharacters();
        return character;
    }
    /**
     * Get NPC by name within a guild
     */
    async getNPCByName(name, guildId) {
        // First check in-memory cache
        const memoryNpc = Array.from(this.npcs.values()).find(npc => npc.name.toLowerCase() === name.toLowerCase() && npc.guildId === guildId);
        if (memoryNpc)
            return memoryNpc;
        // Fallback to file-based lookup
        const npcs = await this.getGuildNPCs(guildId);
        return npcs.find(npc => npc.name.toLowerCase() === name.toLowerCase()) || null;
    }
    /**
     * Get all NPCs for a guild
     */
    async getGuildNPCs(guildId) {
        // First return from in-memory cache
        const memoryNpcs = Array.from(this.npcs.values()).filter(npc => npc.guildId === guildId);
        if (memoryNpcs.length > 0)
            return memoryNpcs;
        // Fallback to file-based lookup
        const data = await this.dataManager.loadData(`npcs_${guildId}.json`);
        return data?.npcs || [];
    }
    /**
     * Search for assets across all characters and NPCs in a guild
     */
    async searchAssets(query, guildId) {
        const results = [];
        const queryLower = query.toLowerCase();
        // Search character assets from in-memory cache
        for (const character of this.characters.values()) {
            if (character.guildId === guildId) {
                character.assets.forEach(asset => {
                    if (asset.name.toLowerCase().includes(queryLower) ||
                        asset.description.toLowerCase().includes(queryLower)) {
                        results.push({
                            ...asset,
                            source: `Character: ${character.name}`
                        });
                    }
                });
            }
        }
        // Search NPC assets from in-memory cache
        for (const npc of this.npcs.values()) {
            if (npc.guildId === guildId && npc.assets) {
                npc.assets.forEach(asset => {
                    if (asset.name.toLowerCase().includes(queryLower) ||
                        asset.description.toLowerCase().includes(queryLower)) {
                        results.push({
                            ...asset,
                            source: `NPC: ${npc.name}`
                        });
                    }
                });
            }
        }
        return results;
    }
    /**
     * Get all characters for a guild
     */
    async getGuildCharacters(guildId) {
        // First return from in-memory cache
        const memoryCharacters = Array.from(this.characters.values()).filter(char => char.guildId === guildId);
        if (memoryCharacters.length > 0)
            return memoryCharacters;
        // Fallback to file-based lookup
        const data = await this.dataManager.loadData(`characters_${guildId}.json`);
        return data?.characters || [];
    }
}
exports.CharacterManager = CharacterManager;
// Export singleton instance
exports.characterManager = new CharacterManager();
