"use strict";
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
    async loadData() {
        try {
            const charactersData = await this.dataManager.loadData('characters.json');
            const npcsData = await this.dataManager.loadData('npcs.json');
            if (charactersData) {
                charactersData.forEach(char => {
                    if (typeof char.concepts === 'string') {
                        char.concepts = [char.concepts];
                        logger_1.logger.info(`Migrated character ${char.name} from old concept format`);
                    }
                    if (!Array.isArray(char.concepts)) {
                        char.concepts = [];
                    }
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
    async saveCharacters() {
        try {
            const charactersArray = Array.from(this.characters.values());
            await this.dataManager.saveData('characters.json', charactersArray);
        }
        catch (error) {
            logger_1.logger.error('Failed to save characters:', error);
        }
    }
    async saveNPCs() {
        try {
            const npcsArray = Array.from(this.npcs.values());
            await this.dataManager.saveData('npcs.json', npcsArray);
        }
        catch (error) {
            logger_1.logger.error('Failed to save NPCs:', error);
        }
    }
    async createCharacter(userId, guildId, name, concepts, options = {}) {
        const existingChar = this.getUserActiveCharacter(userId, guildId);
        if (existingChar) {
            throw new Error('You already have an active character. Use `/sheet delete` first if you want to create a new one.');
        }
        const character = {
            id: `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId,
            guildId,
            name,
            concepts,
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
            skills: options.skills || this.getDefaultSkills(),
            drives: options.drives || [],
            assets: options.assets || [],
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
    getDefaultSkills() {
        return [
            { name: 'Battle', value: 0 },
            { name: 'Communicate', value: 0 },
            { name: 'Discipline', value: 0 },
            { name: 'Move', value: 0 },
            { name: 'Understand', value: 0 }
        ];
    }
    async updateCharacter(characterId, updates) {
        const character = this.characters.get(characterId);
        if (!character) {
            throw new Error('Character not found');
        }
        Object.assign(character, updates, {
            lastUpdated: new Date().toISOString()
        });
        await this.saveCharacters();
        return character;
    }
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
    getUserActiveCharacter(userId, guildId) {
        for (const character of this.characters.values()) {
            if (character.userId === userId && character.guildId === guildId && character.isActive) {
                return character;
            }
        }
        return undefined;
    }
    getUserCharacters(userId, guildId) {
        const userCharacters = [];
        for (const character of this.characters.values()) {
            if (character.userId === userId && character.guildId === guildId) {
                userCharacters.push(character);
            }
        }
        return userCharacters;
    }
    getCharacter(characterId) {
        return this.characters.get(characterId);
    }
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
    async createNPC(name, guildId, concepts, description, createdBy, options = {}) {
        const npc = {
            id: `npc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name,
            guildId,
            concepts,
            description,
            tier: options.tier,
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
    async updateNPC(npcId, field, value, updatedBy) {
        const npc = this.npcs.get(npcId);
        if (!npc) {
            throw new Error('NPC not found');
        }
        const updatedNPC = { ...npc };
        switch (field) {
            case 'name':
                updatedNPC.name = value;
                break;
            case 'concept':
                updatedNPC.concepts = [value];
                break;
            case 'description':
                updatedNPC.description = value;
                break;
            case 'tier':
                updatedNPC.tier = value.toLowerCase();
                break;
            default:
                throw new Error(`Unknown field: ${field}`);
        }
        this.npcs.set(npcId, updatedNPC);
        await this.saveNPCs();
        logger_1.logger.info(`Updated NPC "${npc.name}" field "${field}" by user ${updatedBy}`);
        return updatedNPC;
    }
    async deleteNPC(npcId, deletedBy) {
        const npc = this.npcs.get(npcId);
        if (!npc) {
            throw new Error('NPC not found');
        }
        this.npcs.delete(npcId);
        await this.saveNPCs();
        logger_1.logger.info(`Deleted NPC "${npc.name}" by user ${deletedBy}`);
        return true;
    }
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
    async getNPCByName(name, guildId) {
        const memoryNpc = Array.from(this.npcs.values()).find(npc => npc.name.toLowerCase() === name.toLowerCase() && npc.guildId === guildId);
        if (memoryNpc)
            return memoryNpc;
        const npcs = await this.getGuildNPCs(guildId);
        return npcs.find(npc => npc.name.toLowerCase() === name.toLowerCase()) || null;
    }
    async getGuildNPCs(guildId) {
        const memoryNpcs = Array.from(this.npcs.values()).filter(npc => npc.guildId === guildId);
        if (memoryNpcs.length > 0)
            return memoryNpcs;
        const data = await this.dataManager.loadData(`npcs_${guildId}.json`);
        return data?.npcs || [];
    }
    async searchAssets(query, guildId) {
        const results = [];
        const lowerQuery = query.toLowerCase();
        const assetCategories = {
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
        for (const [categoryName, assets] of Object.entries(assetCategories)) {
            for (const asset of assets) {
                if (asset.label.toLowerCase().includes(lowerQuery) ||
                    asset.description.toLowerCase().includes(lowerQuery)) {
                    results.push({
                        name: asset.label,
                        type: categoryName,
                        description: asset.description,
                        source: 'Core Rules'
                    });
                }
            }
        }
        for (const character of this.characters.values()) {
            if (character.guildId === guildId) {
                character.assets?.forEach(asset => {
                    if (asset.name.toLowerCase().includes(lowerQuery) ||
                        asset.description.toLowerCase().includes(lowerQuery)) {
                        results.push({
                            name: asset.name,
                            type: asset.type,
                            description: asset.description,
                            source: `Character: ${character.name}`
                        });
                    }
                });
            }
        }
        for (const npc of this.npcs.values()) {
            if (npc.guildId === guildId && npc.assets) {
                npc.assets.forEach(asset => {
                    if (asset.name.toLowerCase().includes(lowerQuery) ||
                        asset.description.toLowerCase().includes(lowerQuery)) {
                        results.push({
                            name: asset.name,
                            type: asset.type,
                            description: asset.description,
                            source: `NPC: ${npc.name}`
                        });
                    }
                });
            }
        }
        return results.slice(0, 10);
    }
    async getGuildCharacters(guildId) {
        const memoryCharacters = Array.from(this.characters.values()).filter(char => char.guildId === guildId);
        if (memoryCharacters.length > 0)
            return memoryCharacters;
        const data = await this.dataManager.loadData(`characters_${guildId}.json`);
        return data?.characters || [];
    }
    validateSkillAssignments(skills) {
        const assignedValues = Object.values(skills).sort((a, b) => b - a);
        const expectedValues = [...CharacterManager.SKILL_POINT_VALUES].sort((a, b) => b - a);
        if (assignedValues.length !== CharacterManager.DUNE_SKILLS.length) {
            return { valid: false, error: `❌ **Missing Skills** - You must assign values to all 5 skills: ${CharacterManager.DUNE_SKILLS.join(', ')}` };
        }
        if (JSON.stringify(assignedValues) !== JSON.stringify(expectedValues)) {
            return { valid: false, error: `❌ **Invalid Point Values** - You must use each value exactly once: ${CharacterManager.SKILL_POINT_VALUES.join(', ')}\n\n**You used:** ${assignedValues.join(', ')}\n**Required:** ${expectedValues.join(', ')}` };
        }
        for (const [skill] of Object.entries(skills)) {
            if (!CharacterManager.DUNE_SKILLS.includes(skill)) {
                return { valid: false, error: `❌ **Invalid Skill Name: "${skill}"**\n\n**Valid skills:** ${CharacterManager.DUNE_SKILLS.join(', ')}` };
            }
        }
        return { valid: true };
    }
    validateDriveAssignments(drives) {
        const assignedValues = Object.values(drives).sort((a, b) => b - a);
        const expectedValues = [...CharacterManager.DRIVE_POINT_VALUES].sort((a, b) => b - a);
        if (assignedValues.length !== CharacterManager.DUNE_DRIVES.length) {
            return { valid: false, error: `❌ **Missing Drives** - You must assign values to all 5 drives: ${CharacterManager.DUNE_DRIVES.join(', ')}` };
        }
        if (JSON.stringify(assignedValues) !== JSON.stringify(expectedValues)) {
            return { valid: false, error: `❌ **Invalid Point Values** - You must use each value exactly once: ${CharacterManager.DRIVE_POINT_VALUES.join(', ')}\n\n**You used:** ${assignedValues.join(', ')}\n**Required:** ${expectedValues.join(', ')}` };
        }
        for (const [drive] of Object.entries(drives)) {
            if (!CharacterManager.DUNE_DRIVES.includes(drive)) {
                return { valid: false, error: `❌ **Invalid Drive Name: "${drive}"**\n\n**Valid drives:** ${CharacterManager.DUNE_DRIVES.join(', ')}` };
            }
        }
        return { valid: true };
    }
    async setSkillsPointBuy(characterId, skillAssignments) {
        const character = this.getCharacter(characterId);
        if (!character) {
            throw new Error('Character not found');
        }
        const validation = this.validateSkillAssignments(skillAssignments);
        if (!validation.valid) {
            throw new Error(validation.error);
        }
        character.skills = CharacterManager.DUNE_SKILLS.map(skillName => ({
            name: skillName,
            value: skillAssignments[skillName],
            focus: character.skills.find(s => s.name === skillName)?.focus || []
        }));
        character.lastUpdated = new Date().toISOString();
        await this.saveCharacters();
        return character;
    }
    async setDrivesPointBuy(characterId, driveAssignments, driveStatements) {
        const character = this.getCharacter(characterId);
        if (!character) {
            throw new Error('Character not found');
        }
        const validation = this.validateDriveAssignments(driveAssignments);
        if (!validation.valid) {
            throw new Error(validation.error);
        }
        character.drives = CharacterManager.DUNE_DRIVES.map(driveName => ({
            name: driveName,
            value: driveAssignments[driveName],
            statement: driveStatements[driveName] || `${driveName} drives me`
        }));
        character.lastUpdated = new Date().toISOString();
        await this.saveCharacters();
        return character;
    }
}
exports.CharacterManager = CharacterManager;
CharacterManager.SKILL_POINT_VALUES = [9, 7, 6, 5, 4];
CharacterManager.DRIVE_POINT_VALUES = [8, 7, 6, 5, 4];
CharacterManager.DUNE_SKILLS = ['Battle', 'Communicate', 'Discipline', 'Move', 'Understand'];
CharacterManager.DUNE_DRIVES = ['Duty', 'Faith', 'Justice', 'Power', 'Truth'];
exports.characterManager = new CharacterManager();
