/**
 * Dune Tarot Card System Types
 * Based on the canonical Dune Tarot described in the novels
 */

export enum TarotSuit {
  KNIVES = 'Knives',
  COINS = 'Coins',
  WATER = 'Water',
  SPICE = 'Spice'
}

export enum TarotRank {
  ACE = 'Ace',
  TWO = '2',
  THREE = '3',
  FOUR = '4',
  FIVE = '5',
  SIX = '6',
  SEVEN = '7',
  EIGHT = '8',
  NINE = '9',
  TEN = '10',
  REGENT = 'Regent',
  HEIR = 'Heir',
  LADY = 'Lady',
  LORD = 'Lord'
}

export interface TarotCard {
  id: string;
  name: string;
  suit?: TarotSuit;
  rank?: TarotRank;
  isMajorArcana: boolean;
  description: string;
  imageUrl?: string;
  symbolism?: string;
  roleplayHints?: string[];
}

export interface TarotDeck {
  id: string;
  name: string;
  description: string;
  cards: TarotCard[];
  isComplete: boolean;
  createdAt: string;
  lastShuffledAt?: string;
}

export interface TarotReading {
  id: string;
  userId: string;
  channelId: string;
  readingType: 'single' | 'three-card' | 'custom';
  cards: TarotCard[];
  interpretation?: string;
  timestamp: string;
  correlationId: string;
}

// Sysselraad game types
export interface SysselraadGame {
  id: string;
  channelId: string;
  players: SysselraadPlayer[];
  gameState: SysselraadGameState;
  board: SysselraadBoard;
  currentTurn: number;
  gameRules: SysselraadRules;
  createdAt: string;
  updatedAt: string;
  status: 'waiting' | 'active' | 'completed';
}

export interface SysselraadPlayer {
  userId: string;
  displayName: string;
  chips: number;
  hand: TarotCard[];
  votesEarned: string[]; // House IDs
  position: number;
}

export interface SysselraadBoard {
  houses: SysselraadHouse[];
  centerHouseId: string;
}

export interface SysselraadHouse {
  id: string;
  name: string;
  houseCard: TarotCard;
  taskCard?: TarotCard;
  taskRevealed: boolean;
  chips: number;
  position: { x: number; y: number };
  voteClaimed: boolean;
  claimedBy?: string;
}

export interface SysselraadGameState {
  phase: 'setup' | 'playing' | 'ended';
  winner?: string;
  winCondition?: 'vote-majority' | 'sysselraad-line' | 'landsraad-locked';
  lastAction?: {
    playerId: string;
    action: string;
    timestamp: string;
  };
}

export interface SysselraadRules {
  variant: 'basic' | 'speed' | 'faufreluches' | 'mentat' | 'street';
  playerCount: number;
  startingChips: number;
  housesToCover: number;
  minimumBribe?: number;
  bankLimit?: number;
  additionalRules?: string[];
}

// Card value ordering for Sysselraad (highest to lowest)
export const SYSSELRAAD_CARD_VALUES: Record<TarotRank, number> = {
  [TarotRank.LORD]: 14,
  [TarotRank.LADY]: 13,
  [TarotRank.HEIR]: 12,
  [TarotRank.REGENT]: 11,
  [TarotRank.TEN]: 10,
  [TarotRank.NINE]: 9,
  [TarotRank.EIGHT]: 8,
  [TarotRank.SEVEN]: 7,
  [TarotRank.SIX]: 6,
  [TarotRank.FIVE]: 5,
  [TarotRank.FOUR]: 4,
  [TarotRank.THREE]: 3,
  [TarotRank.TWO]: 2,
  [TarotRank.ACE]: 1
};
