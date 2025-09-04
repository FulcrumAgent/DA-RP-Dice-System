/**
 * Core types for the TTRPG Module System
 * 
 * This module defines the domain types for ingesting and managing
 * adventure modules within the Discord bot.
 */

export interface ModuleManifest {
  id: string;
  slug: string;
  title: string;
  authors: string[];
  version: string;
  license?: string;
  sourceUrl: string;
  contentWarnings?: string[];
  tags?: string[];
  recommendedLevel?: string | number;
  estimatedSessions?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Scene {
  id: string;
  moduleId: string;
  act: string;
  order: number;
  title: string;
  gmNotes?: string;
  readAloud?: string;
  checks?: Array<{
    skill: string;
    dc?: number;
    consequenceOnFail?: string;
  }>;
  npcs?: string[];
  handouts?: string[];
  tables?: string[];
  nextSceneId?: string;
  choices?: Array<{
    label: string;
    nextSceneId: string;
  }>;
  safetyFlags?: string[]; // lines/veils references
}

export interface NPC {
  id: string;
  moduleId: string;
  name: string;
  role: string;
  traits?: string[];
  motivation?: string;
  bonds?: string[];
  secrets?: string[];
  statBlock?: string | Record<string, unknown>;
  gmOnly?: boolean;
}

export interface Handout {
  id: string;
  moduleId: string;
  name: string;
  description?: string;
  gmNotes?: string;
  title: string;
  body?: string;
  imageUrl?: string;
  isSpoiler?: boolean;
}

export interface RollTable {
  id: string;
  moduleId: string;
  name: string;
  die: string; // e.g., 'd6', 'd20', '2d6'
  entries: Array<{
    range: [number, number];
    result: string;
  }>;
}

export interface ProgressTrack {
  id: string;
  moduleId: string;
  name: string;
  max: number;
  current: number;
  kind: 'clock' | 'meter';
}

// Campaign state management
export interface CampaignState {
  id?: string;
  channelId: string;
  currentModuleId: string;
  currentSceneId: string | null;
  sceneHistory: string[];
  progressTracks: ProgressTrack[];
  gmNotes: string[];
  loadedAt: Date;
  lastAdvancedAt: Date;
  updatedAt?: Date;
}

// Roll result for tables
export interface TableRollResult {
  table: RollTable;
  rolled: number;
  result: string;
  correlationId: string;
  timestamp: string;
}

// Permission levels
export type ModulePermission = 'GM' | 'PLAYER';

// Safety tools
export interface SafetyTools {
  contentWarnings: string[];
  linesAndVeils?: {
    lines: string[]; // hard limits
    veils: string[]; // fade to black
  };
  xCard: boolean; // X-card support
  pauseCard: boolean; // Pause card support
}

// Module loading configuration
export interface ModuleLoadConfig {
  guildId: string;
  channelId: string;
  loaderId: string; // Discord user ID
  autoStart?: boolean;
  skipSafetyBrief?: boolean;
}

// Command input validation types
export interface ModuleCommandContext {
  guildId: string;
  channelId: string;
  userId: string;
  correlationId: string;
  isGM: boolean;
}
