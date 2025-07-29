export interface ResourcePools {
  momentum: number;
  threat: number;
  determination: number;
}

export interface CharacterData {
  // Basic Info
  name?: string;
  concepts?: string[];
  
  // Archetype & Background
  archetype?: string; // Legacy field for backward compatibility
  archetypes?: string[]; // Array of 1-3 archetypes
  primaryArchetype?: string; // First selected archetype
  secondaryArchetype?: string; // Second selected archetype (if any)
  tertiaryArchetype?: string; // Third selected archetype (if any)
  house?: string;
  homeworld?: string;
  
  // Skills & Abilities
  skills?: Record<string, number>;
  focuses?: Record<string, string>;
  drives?: Record<string, number>;
  statements?: Record<string, string>;
  talents?: string[];
  
  // New Fields
  assets?: string[];
  traits?: string[];
  pools?: ResourcePools;
  
  // Metadata
  resourcePools?: ResourcePools;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CharacterCreationState {
  data: CharacterData;
  tempData?: Record<string, unknown>;
  currentStep: string;
  messageId?: string;
  channelId?: string;
}
