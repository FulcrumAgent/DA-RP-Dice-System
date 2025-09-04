"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.characterCreationState = exports.CharacterCreationStateManager = exports.ARCHETYPE_DESCRIPTIONS = void 0;
const database_1 = require("./database");
const logger_1 = require("./logger");
exports.ARCHETYPE_DESCRIPTIONS = {
    'Warrior': 'Skilled in combat, tactics, and physical prowess. Warriors excel in battle and physical challenges.',
    'Diplomat': 'Master negotiators and leaders. Diplomats excel in social situations and resolving conflicts.',
    'Spy': 'Experts in deception, infiltration, and gathering information. Spies excel in covert operations.',
    'Mentat': 'Human computers with exceptional mental abilities. Mentats excel in calculation, analysis, and strategy.',
    'Scientist': 'Experts in technology, medicine, and research. Scientists excel in problem-solving and innovation.',
    'Merchant': 'Skilled in trade, negotiation, and resource management. Merchants excel in economic matters.',
    'Noble': 'Born to lead and command. Nobles excel in leadership and social influence.',
    'Mystic': 'Connected to spiritual and esoteric knowledge. Mystics excel in understanding deeper truths.',
    'Outsider': 'From outside the Imperium with unique perspectives. Outsiders excel in adaptability and survival.'
};
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;
class CharacterCreationStateManager {
    isExpired(state) {
        return Date.now() - state.lastUpdated > this.TTL_MS;
    }
    getStateKey(userId, guildId) {
        return `${guildId}_${userId}`;
    }
    constructor() {
        this.states = new Map();
        this.TTL_MS = DEFAULT_TTL_MS;
        this.dataManager = new database_1.DataManager();
        this.loadStates();
    }
    async startCreation(userId, guildId, type) {
        const key = this.getStateKey(userId, guildId);
        const state = {
            userId,
            guildId,
            type,
            step: 1,
            currentStep: 'name',
            data: {},
            createdAt: Date.now(),
            lastUpdated: Date.now()
        };
        this.states.set(key, state);
        await this.saveStates();
        logger_1.logger.info(`Started ${type} character creation for user ${userId} in guild ${guildId}`);
        return state;
    }
    getState(userId, guildId) {
        const key = this.getStateKey(userId, guildId);
        const state = this.states.get(key);
        if (state && this.isExpired(state)) {
            this.states.delete(key);
            return undefined;
        }
        return state;
    }
    setState(userId, guildId, updates) {
        const key = this.getStateKey(userId, guildId);
        const currentState = this.getState(userId, guildId);
        if (!currentState) {
            return undefined;
        }
        const updatedState = {
            ...currentState,
            ...updates,
            data: {
                ...currentState.data,
                ...(updates.data || {})
            },
            tempData: {
                ...currentState.tempData,
                ...(updates.tempData || {})
            },
            lastUpdated: Date.now()
        };
        this.states.set(key, updatedState);
        if (this.dataManager && typeof this.dataManager.saveData === 'function') {
            this.dataManager.saveData(`char_creation_${key}.json`, updatedState)
                .catch((err) => {
                logger_1.logger.error('Failed to persist character creation state:', err);
            });
        }
        return updatedState;
    }
    async updateState(userId, guildId, updates) {
        const key = this.getStateKey(userId, guildId);
        const state = this.states.get(key);
        if (!state) {
            throw new Error('No character creation in progress');
        }
        if (updates.data) {
            state.data = { ...state.data, ...updates.data };
        }
        if (updates.tempData !== undefined) {
            state.tempData = { ...state.tempData, ...updates.tempData };
        }
        const { data, tempData, ...otherUpdates } = updates;
        Object.assign(state, otherUpdates);
        state.lastUpdated = Date.now();
        this.states.set(key, state);
        await this.saveStates();
        return state;
    }
    async nextStep(userId, guildId) {
        const key = this.getStateKey(userId, guildId);
        const state = this.states.get(key);
        if (!state) {
            throw new Error('No character creation in progress');
        }
        state.step += 1;
        state.lastUpdated = Date.now();
        this.states.set(key, state);
        await this.saveStates();
        return state;
    }
    async cancelCreation(userId, guildId) {
        const key = this.getStateKey(userId, guildId);
        this.states.delete(key);
        await this.saveStates();
        logger_1.logger.info(`Cancelled character creation for user ${userId} in guild ${guildId}`);
    }
    async completeCreation(userId, guildId) {
        const key = this.getStateKey(userId, guildId);
        const state = this.states.get(key);
        if (!state) {
            throw new Error('No character creation in progress');
        }
        this.states.delete(key);
        await this.saveStates();
        logger_1.logger.info(`Completed character creation for user ${userId} in guild ${guildId}`);
        return state;
    }
    getProgress(state) {
        const steps = state.type === 'sheet' ? SHEET_STEPS : MIXEDCHAR_STEPS;
        const completed = [];
        const remaining = [];
        for (const [stepNum, stepName] of steps.entries()) {
            if (this.isStepComplete(state, stepNum + 1)) {
                completed.push(stepName);
            }
            else {
                remaining.push(stepName);
            }
        }
        const nextStep = remaining[0] || 'Ready to finalize';
        return { completed, remaining, nextStep };
    }
    isStepComplete(state, step) {
        const { data } = state;
        switch (step) {
            case 1: return !!(data.name && data.concepts && data.concepts.length > 0);
            case 2: return state.type === 'sheet' || !!(data.archetype || (data.archetypes && data.archetypes.length > 0));
            case 3: return !!data.skills && Object.keys(data.skills).length > 0;
            case 4: return !!data.focuses && Object.keys(data.focuses).length > 0;
            case 5: return !!data.drives && Object.keys(data.drives).length > 0;
            case 6: return !!data.statements && Object.keys(data.statements).length > 0;
            case 7: return !!data.talents && data.talents.length > 0;
            case 8: return !!data.assets && data.assets.length > 0;
            default: return false;
        }
    }
    async loadStates() {
        try {
            const data = await this.dataManager.loadData('character_creation_states.json');
            if (data?.states) {
                for (const state of data.states) {
                    const key = this.getStateKey(state.userId, state.guildId);
                    this.states.set(key, state);
                }
                logger_1.logger.info(`Loaded ${data.states.length} character creation states`);
            }
        }
        catch (error) {
            logger_1.logger.warn('Failed to load character creation states:', error);
        }
    }
    async saveStates() {
        try {
            const states = Array.from(this.states.values());
            await this.dataManager.saveData('character_creation_states.json', { states });
        }
        catch (error) {
            logger_1.logger.error('Failed to save character creation states:', error);
        }
    }
    async cleanupOldStates() {
        const cutoff = Date.now() - (24 * 60 * 60 * 1000);
        let cleaned = 0;
        for (const [key, state] of this.states.entries()) {
            if (state.lastUpdated < cutoff) {
                this.states.delete(key);
                cleaned++;
            }
        }
        if (cleaned > 0) {
            await this.saveStates();
            logger_1.logger.info(`Cleaned up ${cleaned} old character creation states`);
        }
    }
}
exports.CharacterCreationStateManager = CharacterCreationStateManager;
const SHEET_STEPS = [
    'Name & Concept',
    'Archetype Selection',
    'Skills Assignment',
    'Skill Focus',
    'Drives',
    'Drive Statements',
    'Talents',
    'Assets',
    'Traits',
    'Starting Pools',
    'Review & Finalize'
];
const MIXEDCHAR_STEPS = [
    'Name & Concept',
    'Archetype Selection',
    'Skills Assignment',
    'Skill Focus',
    'Drives',
    'Drive Statements',
    'Talents',
    'Assets',
    'Traits',
    'Starting Pools',
    'Review & Finalize'
];
exports.characterCreationState = new CharacterCreationStateManager();
