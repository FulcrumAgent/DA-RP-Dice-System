/**
 * Character Creation State Manager
 * Handles step-by-step character creation for both /sheet and /mixedchar
 */

import { DataManager } from './database';
import { logger } from './logger';

// Archetype descriptions for the character creation flow
export const ARCHETYPE_DESCRIPTIONS: Record<string, string> = {
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

import { CharacterData } from '../types/character-types';

export interface CharacterCreationState {
  userId: string;
  guildId: string;
  type: 'sheet' | 'mixedchar';
  step: number;
  currentStep: string; // Current step in the creation flow
  data: CharacterData;
  
  // Temporary data for multi-step processes
  tempData?: {
    selectedSkill?: string;
    selectedDrive?: string;
    skillsState?: {
      remainingSkills: string[];
      remainingValues: number[];
      assignedSkills: { [key: string]: number };
      currentFocus?: string;
    };
    [key: string]: unknown;
  };
  
  // Timestamps
  createdAt: number;
  lastUpdated: number;
}

// Default TTL for character creation state (24 hours)
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

export class CharacterCreationStateManager {
  private dataManager: DataManager;
  private states: Map<string, CharacterCreationState> = new Map();
  private TTL_MS: number = DEFAULT_TTL_MS;
  
  /**
   * Check if a state has expired
   * @param state The state to check
   * @returns True if expired, false otherwise
   */
  private isExpired(state: CharacterCreationState): boolean {
    return Date.now() - state.lastUpdated > this.TTL_MS;
  }
  
  /**
   * Get state key for user in guild
   */
  private getStateKey(userId: string, guildId: string): string {
    return `${guildId}_${userId}`;
  }

  constructor() {
    this.dataManager = new DataManager();
    this.loadStates();
  }

  /**
   * Start new character creation
   */
  async startCreation(
    userId: string, 
    guildId: string, 
    type: 'sheet' | 'mixedchar'
  ): Promise<CharacterCreationState> {
    const key = this.getStateKey(userId, guildId);
    
    const state: CharacterCreationState = {
      userId,
      guildId,
      type,
      step: 1,
      currentStep: 'name', // Initialize with the first step
      data: {},
      createdAt: Date.now(),
      lastUpdated: Date.now()
    };

    this.states.set(key, state);
    await this.saveStates();
    
    logger.info(`Started ${type} character creation for user ${userId} in guild ${guildId}`);
    return state;
  }

  /**
   * Get current creation state
   */
  getState(userId: string, guildId: string): CharacterCreationState | undefined {
    const key = this.getStateKey(userId, guildId);
    const state = this.states.get(key);
    
    // Clean up expired states
    if (state && this.isExpired(state)) {
      this.states.delete(key);
      return undefined;
    }
    
    return state;
  }

  /**
   * Update the state for a user/guild
   * @param userId The user's ID
   * @param guildId The guild ID
   * @param updates Partial state with updates to apply
   * @returns The updated state
   */
  setState(
    userId: string, 
    guildId: string, 
    updates: Partial<CharacterCreationState>
  ): CharacterCreationState | undefined {
    const key = this.getStateKey(userId, guildId);
    const currentState = this.getState(userId, guildId);
    
    if (!currentState) {
      return undefined;
    }
    
    // Merge updates with current state
    const updatedState: CharacterCreationState = {
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
    
    // Save the updated state
    this.states.set(key, updatedState);
    
    // Persist to database if needed
    if (this.dataManager && typeof this.dataManager.saveData === 'function') {
      this.dataManager.saveData(`char_creation_${key}.json`, updatedState)
        .catch((err: Error) => {
          logger.error('Failed to persist character creation state:', err);
        });
    }
    
    return updatedState;
  }

  /**
   * Update creation state
   */
  async updateState(
    userId: string, 
    guildId: string, 
    updates: Partial<CharacterCreationState> & { 
      data?: Partial<CharacterCreationState['data']>;
      tempData?: Record<string, unknown>;
    }
  ): Promise<CharacterCreationState> {
    const key = this.getStateKey(userId, guildId);
    const state = this.states.get(key);
    
    if (!state) {
      throw new Error('No character creation in progress');
    }

    // Update data if provided
    if (updates.data) {
      state.data = { ...state.data, ...updates.data };
    }
    
    // Update tempData if provided
    if (updates.tempData !== undefined) {
      state.tempData = { ...state.tempData, ...updates.tempData };
    }
    
    // Update other properties
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { data, tempData, ...otherUpdates } = updates;
    Object.assign(state, otherUpdates);
    
    state.lastUpdated = Date.now();
    
    this.states.set(key, state);
    await this.saveStates();
    
    return state;
  }

  /**
   * Advance to next step
   */
  async nextStep(userId: string, guildId: string): Promise<CharacterCreationState> {
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

  /**
   * Cancel character creation
   */
  async cancelCreation(userId: string, guildId: string): Promise<void> {
    const key = this.getStateKey(userId, guildId);
    this.states.delete(key);
    await this.saveStates();
    
    logger.info(`Cancelled character creation for user ${userId} in guild ${guildId}`);
  }

  /**
   * Complete character creation and clean up state
   */
  async completeCreation(userId: string, guildId: string): Promise<CharacterCreationState> {
    const key = this.getStateKey(userId, guildId);
    const state = this.states.get(key);
    
    if (!state) {
      throw new Error('No character creation in progress');
    }

    // Remove from active states
    this.states.delete(key);
    await this.saveStates();
    
    logger.info(`Completed character creation for user ${userId} in guild ${guildId}`);
    return state;
  }

  /**
   * Get creation progress summary
   */
  getProgress(state: CharacterCreationState): {
    completed: string[];
    remaining: string[];
    nextStep: string;
  } {
    const steps = state.type === 'sheet' ? SHEET_STEPS : MIXEDCHAR_STEPS;
    const completed: string[] = [];
    const remaining: string[] = [];

    for (const [stepNum, stepName] of steps.entries()) {
      if (this.isStepComplete(state, stepNum + 1)) {
        completed.push(stepName);
      } else {
        remaining.push(stepName);
      }
    }

    const nextStep = remaining[0] || 'Ready to finalize';
    
    return { completed, remaining, nextStep };
  }

  /**
   * Check if a step is complete
   */
  private isStepComplete(state: CharacterCreationState, step: number): boolean {
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

  /**
   * Load states from storage
   */
  private async loadStates(): Promise<void> {
    try {
      const data = await this.dataManager.loadData<{states: CharacterCreationState[]}>('character_creation_states.json');
      if (data?.states) {
        for (const state of data.states) {
          const key = this.getStateKey(state.userId, state.guildId);
          this.states.set(key, state);
        }
        logger.info(`Loaded ${data.states.length} character creation states`);
      }
    } catch (error) {
      logger.warn('Failed to load character creation states:', error);
    }
  }

  /**
   * Save states to storage
   */
  private async saveStates(): Promise<void> {
    try {
      const states = Array.from(this.states.values());
      await this.dataManager.saveData('character_creation_states.json', { states });
    } catch (error) {
      logger.error('Failed to save character creation states:', error);
    }
  }

  /**
   * Clean up old states (older than 24 hours)
   */
  async cleanupOldStates(): Promise<void> {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    let cleaned = 0;

    for (const [key, state] of this.states.entries()) {
      if (state.lastUpdated < cutoff) {
        this.states.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      await this.saveStates();
      logger.info(`Cleaned up ${cleaned} old character creation states`);
    }
  }
}

// Step definitions
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

// Export singleton
export const characterCreationState = new CharacterCreationStateManager();
