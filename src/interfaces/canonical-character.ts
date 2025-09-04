/**
 * Canonical Dune Character Interface
 * Based on official Dune: Adventures in the Imperium rules
 */

export interface CanonicalCharacter {
  // Basic Information
  id: string;
  userId: string;
  guildId: string;
  name: string;
  concept: string;
  
  // Archetypes (1-3 allowed)
  archetypes: string[];
  
  // Drives (Point-buy system with statements)
  drives: {
    duty: { value: number; statement: string };
    faith: { value: number; statement: string };
    justice: { value: number; statement: string };
    power: { value: number; statement: string };
    truth: { value: number; statement: string };
  };
  
  // Skills (Point-buy system)
  skills: {
    battle: number;
    communicate: number;
    discipline: number;
    move: number;
    understand: number;
  };
  
  // Focuses (1 per skill at creation)
  focuses: {
    battle?: string;
    communicate?: string;
    discipline?: string;
    move?: string;
    understand?: string;
  };
  
  // Talents (3 total, from general or archetype-specific)
  talents: string[];
  
  // Assets (3 total, from general or archetype-specific)
  assets: string[];
  
  // Creation metadata
  createdAt: Date;
  updatedAt: Date;
  isComplete: boolean;
}

export interface CharacterCreationSession {
  userId: string;
  messageId?: string;
  currentStep: number;
  character: Partial<CanonicalCharacter>;
  createdAt: Date;
  updatedAt: Date;
}

// Validation helpers
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface PointBuyValidation {
  totalPoints: number;
  usedPoints: number;
  remainingPoints: number;
  isValid: boolean;
  errors: string[];
}

// Display helpers for privacy
export interface PublicCharacterView {
  name: string;
  concept: string;
  drives: {
    duty: { value: number; statement: string };
    faith: { value: number; statement: string };
    justice: { value: number; statement: string };
    power: { value: number; statement: string };
    truth: { value: number; statement: string };
  };
  skills: {
    battle: number;
    communicate: number;
    discipline: number;
    move: number;
    understand: number;
  };
}

export interface PrivateCharacterView extends PublicCharacterView {
  archetypes: string[];
  focuses: {
    battle?: string;
    communicate?: string;
    discipline?: string;
    move?: string;
    understand?: string;
  };
  talents: string[];
  assets: string[];
}
