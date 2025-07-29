import { CharacterData } from './character';

export enum CreationStep {
  NAME = 'NAME',
  CONCEPT = 'CONCEPT',
  ARCHETYPE = 'ARCHETYPE',
  SKILLS = 'SKILLS',
  FOCUSES = 'FOCUSES',
  DRIVES = 'DRIVES',
  TALENTS = 'TALENTS',
  ASSETS = 'ASSETS',
  TRAITS = 'TRAITS',
  STARTING_POOLS = 'STARTING_POOLS',
  SUMMARY = 'SUMMARY',
  FINALIZE = 'FINALIZE'
}

export interface CharacterCreationSession {
  userId: string;
  guildId: string;
  characterData: CharacterData;
  currentStep: CreationStep;
  lastUpdated: number;
  messageId?: string;
  channelId?: string;
}
