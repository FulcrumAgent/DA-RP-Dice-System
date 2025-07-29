"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mixedCharacterManager = exports.MixedCharacterManager = void 0;
const database_1 = require("./database");
const logger_1 = require("./logger");
const mixed_archetypes_1 = require("../data/mixed-archetypes");
class MixedCharacterManager {
    constructor() {
        this.activeStates = new Map();
        this.dataManager = new database_1.DataManager();
    }
    async startCharacterCreation(userId, guildId) {
        const stateKey = `${userId}-${guildId}`;
        if (this.activeStates.has(stateKey)) {
            const existingState = this.activeStates.get(stateKey);
            if (!existingState.completed) {
                return existingState;
            }
        }
        const newState = {
            userId,
            guildId,
            step: 1,
            completed: false,
            lastUpdated: Date.now()
        };
        this.activeStates.set(stateKey, newState);
        await this.saveState(newState);
        logger_1.logger.info(`Started mixed character creation for user ${userId} in guild ${guildId}`);
        return newState;
    }
    getCharacterState(userId, guildId) {
        const stateKey = `${userId}-${guildId}`;
        return this.activeStates.get(stateKey) || null;
    }
    async setNameAndConcept(userId, guildId, name, concept) {
        const state = this.getCharacterState(userId, guildId);
        if (!state) {
            return { success: false, error: 'No active character creation session found' };
        }
        const existingCharacters = await this.dataManager.loadData(`characters_${guildId}.json`) || {};
        if (existingCharacters[name.toLowerCase()]) {
            return { success: false, error: 'Character name already exists in this guild' };
        }
        state.characterName = name.trim();
        state.concept = concept.trim();
        state.step = 2;
        state.lastUpdated = Date.now();
        await this.saveState(state);
        return { success: true };
    }
    async setArchetypes(userId, guildId, primary, secondary) {
        const state = this.getCharacterState(userId, guildId);
        if (!state || state.step < 2) {
            return { success: false, error: 'Invalid character creation state' };
        }
        if (!mixed_archetypes_1.ARCHETYPE_NAMES.includes(primary) || !mixed_archetypes_1.ARCHETYPE_NAMES.includes(secondary)) {
            return { success: false, error: 'Invalid archetype selection' };
        }
        if (primary === secondary) {
            return { success: false, error: 'Primary and secondary archetypes cannot be the same' };
        }
        state.primaryArchetype = primary;
        state.secondaryArchetype = secondary;
        state.step = 3;
        state.lastUpdated = Date.now();
        await this.saveState(state);
        return { success: true };
    }
    async assignSkills(userId, guildId, skillAssignments) {
        const state = this.getCharacterState(userId, guildId);
        if (!state || state.step < 3 || !state.primaryArchetype || !state.secondaryArchetype) {
            return { success: false, error: 'Invalid character creation state' };
        }
        const validation = this.validateSkillAssignments(skillAssignments, state.primaryArchetype, state.secondaryArchetype);
        if (!validation.valid) {
            return { success: false, error: validation.error };
        }
        state.skills = skillAssignments;
        state.step = 4;
        state.lastUpdated = Date.now();
        await this.saveState(state);
        return { success: true };
    }
    async assignDrives(userId, guildId, driveAssignments) {
        const state = this.getCharacterState(userId, guildId);
        if (!state || state.step < 4) {
            return { success: false, error: 'Invalid character creation state' };
        }
        const validation = this.validateDriveAssignments(driveAssignments);
        if (!validation.valid) {
            return { success: false, error: validation.error };
        }
        state.drives = driveAssignments;
        state.step = 5;
        state.lastUpdated = Date.now();
        await this.saveState(state);
        return { success: true };
    }
    async setFocuses(userId, guildId, focuses) {
        const state = this.getCharacterState(userId, guildId);
        if (!state || state.step < 5 || !state.primaryArchetype || !state.secondaryArchetype) {
            return { success: false, error: 'Invalid character creation state' };
        }
        const validation = this.validateFocuses(focuses, state.primaryArchetype, state.secondaryArchetype);
        if (!validation.valid) {
            return { success: false, error: validation.error };
        }
        state.focuses = focuses;
        state.step = 6;
        state.lastUpdated = Date.now();
        await this.saveState(state);
        return { success: true };
    }
    async setDriveStatements(userId, guildId, statements) {
        const state = this.getCharacterState(userId, guildId);
        if (!state || state.step < 6) {
            return { success: false, error: 'Invalid character creation state' };
        }
        for (const drive of mixed_archetypes_1.DUNE_DRIVES) {
            if (!statements[drive] || statements[drive].trim().length === 0) {
                return { success: false, error: `Drive statement required for ${drive}` };
            }
        }
        state.driveStatements = statements;
        state.step = 7;
        state.lastUpdated = Date.now();
        await this.saveState(state);
        return { success: true };
    }
    async selectTalents(userId, guildId, talents) {
        const state = this.getCharacterState(userId, guildId);
        if (!state || state.step < 7 || !state.primaryArchetype || !state.secondaryArchetype) {
            return { success: false, error: 'Invalid character creation state' };
        }
        const validation = this.validateTalentSelection(talents, state.primaryArchetype, state.secondaryArchetype);
        if (!validation.valid) {
            return { success: false, error: validation.error };
        }
        state.selectedTalents = talents;
        state.step = 8;
        state.lastUpdated = Date.now();
        await this.saveState(state);
        return { success: true };
    }
    async selectAssets(userId, guildId, assets) {
        const state = this.getCharacterState(userId, guildId);
        if (!state || state.step < 8 || !state.primaryArchetype || !state.secondaryArchetype) {
            return { success: false, error: 'Invalid character creation state' };
        }
        const validation = this.validateAssetSelection(assets, state.primaryArchetype, state.secondaryArchetype);
        if (!validation.valid) {
            return { success: false, error: validation.error };
        }
        state.selectedAssets = assets;
        state.step = 9;
        state.lastUpdated = Date.now();
        await this.saveState(state);
        return { success: true };
    }
    async setTraitsAndFinalize(userId, guildId, traits) {
        const state = this.getCharacterState(userId, guildId);
        if (!state || state.step < 9) {
            return { success: false, error: 'Invalid character creation state' };
        }
        if (traits.length < 1 || traits.length > 2) {
            return { success: false, error: 'Must select 1-2 traits' };
        }
        state.traits = traits;
        state.completed = true;
        state.lastUpdated = Date.now();
        await this.saveState(state);
        return { success: true };
    }
    async completeCharacterCreation(userId, guildId) {
        const state = this.getCharacterState(userId, guildId);
        if (!state || !state.completed) {
            return { success: false, error: 'Character creation not completed' };
        }
        try {
            const character = this.convertToMainCharacter(state);
            const characters = await this.dataManager.loadData(`characters_${guildId}.json`) || {};
            characters[state.characterName.toLowerCase()] = character;
            await this.dataManager.saveData(`characters_${guildId}.json`, characters);
            const stateKey = `${userId}-${guildId}`;
            this.activeStates.delete(stateKey);
            logger_1.logger.info(`Completed mixed character creation: ${state.characterName} for user ${userId}`);
            return { success: true, character };
        }
        catch (error) {
            logger_1.logger.error('Error completing character creation:', error);
            return { success: false, error: 'Failed to save character' };
        }
    }
    async cancelCharacterCreation(userId, guildId) {
        const stateKey = `${userId}-${guildId}`;
        this.activeStates.delete(stateKey);
        logger_1.logger.info(`Cancelled character creation for user ${userId} in guild ${guildId}`);
    }
    getStepOptions(state) {
        switch (state.step) {
            case 1:
                return { message: 'Please provide character name and concept' };
            case 2:
                return { archetypes: mixed_archetypes_1.ARCHETYPE_NAMES };
            case 3:
                return { skills: mixed_archetypes_1.DUNE_SKILLS, values: mixed_archetypes_1.SKILL_POINT_VALUES };
            case 4:
                return { drives: mixed_archetypes_1.DUNE_DRIVES, values: mixed_archetypes_1.DRIVE_POINT_VALUES };
            case 5:
                if (state.primaryArchetype && state.secondaryArchetype) {
                    const primaryFocuses = mixed_archetypes_1.ARCHETYPES[state.primaryArchetype].suggestedFocuses;
                    const secondaryFocuses = mixed_archetypes_1.ARCHETYPES[state.secondaryArchetype].suggestedFocuses;
                    return { primaryFocuses, secondaryFocuses };
                }
                return {};
            case 6:
                return { drives: mixed_archetypes_1.DUNE_DRIVES, message: 'Write drive statements' };
            case 7:
                if (state.primaryArchetype && state.secondaryArchetype) {
                    return {
                        primaryTalents: mixed_archetypes_1.ARCHETYPES[state.primaryArchetype].talents,
                        secondaryTalents: mixed_archetypes_1.ARCHETYPES[state.secondaryArchetype].talents
                    };
                }
                return {};
            case 8:
                if (state.primaryArchetype && state.secondaryArchetype) {
                    return {
                        primaryAssets: mixed_archetypes_1.ARCHETYPES[state.primaryArchetype].assets,
                        secondaryAssets: mixed_archetypes_1.ARCHETYPES[state.secondaryArchetype].assets
                    };
                }
                return {};
            case 9:
                return { message: 'Select 1-2 traits and finalize character' };
            default:
                return {};
        }
    }
    validateSkillAssignments(skills, primaryArchetype, secondaryArchetype) {
        const assignedValues = Object.values(skills).sort((a, b) => b - a);
        const expectedValues = [...mixed_archetypes_1.SKILL_POINT_VALUES].sort((a, b) => b - a);
        if (assignedValues.length !== mixed_archetypes_1.DUNE_SKILLS.length) {
            return { valid: false, error: 'Must assign values to all skills' };
        }
        if (JSON.stringify(assignedValues) !== JSON.stringify(expectedValues)) {
            return { valid: false, error: `Must use each value exactly once: ${mixed_archetypes_1.SKILL_POINT_VALUES.join(', ')}` };
        }
        if (primaryArchetype && secondaryArchetype) {
            const primaryAdjustments = mixed_archetypes_1.ARCHETYPES[primaryArchetype].skillAdjustments;
            const secondaryAdjustments = mixed_archetypes_1.ARCHETYPES[secondaryArchetype].skillAdjustments;
            for (const [skill, baseValue] of Object.entries(skills)) {
                if (!mixed_archetypes_1.DUNE_SKILLS.includes(skill)) {
                    return { valid: false, error: `Invalid skill: ${skill}` };
                }
                const primaryAdj = primaryAdjustments[skill] || 0;
                const secondaryAdj = secondaryAdjustments[skill] || 0;
                const finalValue = baseValue + primaryAdj + secondaryAdj;
                if (finalValue < 4 || finalValue > 8) {
                    return { valid: false, error: `Final ${skill} rating (${finalValue}) must be between 4-8 after archetype adjustments` };
                }
            }
        }
        else {
            for (const [skill, value] of Object.entries(skills)) {
                if (!mixed_archetypes_1.DUNE_SKILLS.includes(skill)) {
                    return { valid: false, error: `Invalid skill: ${skill}` };
                }
                if (value < 4 || value > 9) {
                    return { valid: false, error: `Base skill values must be between 4-9` };
                }
            }
        }
        return { valid: true };
    }
    validateDriveAssignments(drives) {
        const assignedValues = Object.values(drives).sort((a, b) => b - a);
        const expectedValues = [...mixed_archetypes_1.DRIVE_POINT_VALUES].sort((a, b) => b - a);
        if (assignedValues.length !== mixed_archetypes_1.DUNE_DRIVES.length) {
            return { valid: false, error: 'Must assign values to all drives' };
        }
        if (JSON.stringify(assignedValues) !== JSON.stringify(expectedValues)) {
            return { valid: false, error: `Must use each value exactly once: ${mixed_archetypes_1.DRIVE_POINT_VALUES.join(', ')}` };
        }
        for (const [drive, value] of Object.entries(drives)) {
            if (!mixed_archetypes_1.DUNE_DRIVES.includes(drive)) {
                return { valid: false, error: `Invalid drive: ${drive}` };
            }
            if (value < 4 || value > 8) {
                return { valid: false, error: `Drive values must be between 4-8 after adjustments` };
            }
        }
        return { valid: true };
    }
    validateFocuses(focuses, primaryArchetype, secondaryArchetype) {
        const primaryFocuses = mixed_archetypes_1.ARCHETYPES[primaryArchetype].suggestedFocuses;
        const secondaryFocuses = mixed_archetypes_1.ARCHETYPES[secondaryArchetype].suggestedFocuses;
        for (const [skill, focusList] of Object.entries(focuses)) {
            if (!mixed_archetypes_1.DUNE_SKILLS.includes(skill)) {
                return { valid: false, error: `Invalid skill: ${skill}` };
            }
            const availableFocuses = [
                ...(primaryFocuses[skill] || []),
                ...(secondaryFocuses[skill] || [])
            ];
            for (const focus of focusList) {
                if (!availableFocuses.includes(focus)) {
                    return { valid: false, error: `Focus "${focus}" not available for skill ${skill} from selected archetypes` };
                }
            }
        }
        return { valid: true };
    }
    validateTalentSelection(talents, primaryArchetype, secondaryArchetype) {
        if (talents.length !== 2) {
            return { valid: false, error: 'Must select exactly 2 talents' };
        }
        const primaryTalents = mixed_archetypes_1.ARCHETYPES[primaryArchetype].talents;
        const secondaryTalents = mixed_archetypes_1.ARCHETYPES[secondaryArchetype].talents;
        let primaryCount = 0;
        let secondaryCount = 0;
        for (const talent of talents) {
            if (primaryTalents.includes(talent)) {
                primaryCount++;
            }
            else if (secondaryTalents.includes(talent)) {
                secondaryCount++;
            }
            else {
                return { valid: false, error: `Talent "${talent}" not available from selected archetypes` };
            }
        }
        if (primaryCount !== 1 || secondaryCount !== 1) {
            return { valid: false, error: 'Must select one talent from each archetype' };
        }
        return { valid: true };
    }
    validateAssetSelection(assets, primaryArchetype, secondaryArchetype) {
        if (assets.length !== 2) {
            return { valid: false, error: 'Must select exactly 2 assets' };
        }
        const primaryAssets = mixed_archetypes_1.ARCHETYPES[primaryArchetype].assets;
        const secondaryAssets = mixed_archetypes_1.ARCHETYPES[secondaryArchetype].assets;
        let primaryCount = 0;
        let secondaryCount = 0;
        for (const asset of assets) {
            if (primaryAssets.includes(asset)) {
                primaryCount++;
            }
            else if (secondaryAssets.includes(asset)) {
                secondaryCount++;
            }
            else {
                return { valid: false, error: `Asset "${asset}" not available from selected archetypes` };
            }
        }
        if (primaryCount !== 1 || secondaryCount !== 1) {
            return { valid: false, error: 'Must select one asset from each archetype' };
        }
        return { valid: true };
    }
    convertToMainCharacter(state) {
        return {
            id: `mixed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: state.characterName,
            concept: state.concept,
            primaryArchetype: state.primaryArchetype,
            secondaryArchetype: state.secondaryArchetype,
            skills: state.skills,
            drives: state.drives,
            focuses: state.focuses,
            driveStatements: state.driveStatements,
            talents: state.selectedTalents,
            assets: state.selectedAssets,
            traits: state.traits,
            createdBy: state.userId,
            createdAt: Date.now(),
            type: 'mixed_archetype'
        };
    }
    async saveState(state) {
        const stateKey = `${state.userId}-${state.guildId}`;
        this.activeStates.set(stateKey, state);
        try {
            const stateData = await this.dataManager.loadData(`character_creation_states_${state.guildId}.json`) || {};
            stateData[stateKey] = state;
            await this.dataManager.saveData(`character_creation_states_${state.guildId}.json`, stateData);
        }
        catch (error) {
            logger_1.logger.error('Error saving character creation state:', error);
        }
    }
}
exports.MixedCharacterManager = MixedCharacterManager;
exports.mixedCharacterManager = new MixedCharacterManager();
