export interface CharacterData {
  id: string;
  name: string;
  concepts: string[];
  archetypes: string[];
  skills: Record<string, number>;
  focuses: Record<string, string[]>;
  drives: string[];
  talents: string[];
  assets: string[];
  traits: string[];
  resourcePools: ResourcePools;
  statements?: string[];
}

export interface ResourcePools {
  health: number;
  resolve: number;
  momentum: number;
}

export interface CharacterCreationState {
  userId: string;
  currentStep: string;
  characterData: Partial<CharacterData>;
  tempData?: Record<string, unknown>;
}

// Define the character creation steps
export const CREATION_STEPS = {
  NAME: 'NAME',
  CONCEPT: 'CONCEPT',
  ARCHETYPE: 'ARCHETYPE',
  SKILLS: 'SKILLS',
  FOCUSES: 'FOCUSES',
  DRIVES: 'DRIVES',
  DRIVE_STATEMENTS: 'DRIVE_STATEMENTS',
  TALENTS: 'TALENTS',
  ASSETS: 'ASSETS',
  TRAITS: 'TRAITS',
  STARTING_POOLS: 'STARTING_POOLS',
  SUMMARY: 'SUMMARY',
  FINALIZE: 'FINALIZE'
} as const;

export type CreationStep = keyof typeof CREATION_STEPS;

// Type guard to check if a string is a valid CreationStep
export function isCreationStep(step: string): step is CreationStep {
  return step in CREATION_STEPS;
}

export interface CharacterCreationSession {
  userId: string;
  currentStep: CreationStep;
  characterData: Partial<CharacterData>;
  tempData?: Record<string, unknown>;
  messageId?: string;
  channelId?: string;
  lastUpdated: number;
}
