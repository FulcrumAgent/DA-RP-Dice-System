/**
 * Database Service for PostgreSQL Integration
 * Handles database connections and provides methods for character management
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { CharacterData, CharacterCreationState } from '../types/character-types';

export class DatabaseService {
  private prisma: PrismaClient;
  private static instance: DatabaseService;

  constructor() {
    this.prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Connect to database
   */
  async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      logger.info('Connected to PostgreSQL database');
    } catch (error) {
      logger.error('Failed to connect to database:', error);
      throw error;
    }
  }

  /**
   * Disconnect from database
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
    logger.info('Disconnected from database');
  }

  /**
   * Create a new character (simplified version)
   */
  async createCharacter(userId: string, characterData: CharacterData): Promise<any> {
    try {
      // For now, create a basic character record
      // This can be expanded later to match your exact needs
      const character = await this.prisma.character.create({
        data: {
          userId,
          name: characterData.name || 'Unnamed Character',
          concepts: characterData.concepts || [],
          house: characterData.house,
          homeworld: characterData.homeworld,
          avatarUrl: null, // Will be set later if needed
          // Set default attribute values
          attrMuscle: 8,
          attrMove: 8,
          attrIntellect: 8,
          attrAwareness: 8,
          attrCommunication: 8,
          attrDiscipline: 8,
          determination: 3,
          maxDetermination: 3,
          expTotal: 0,
          expSpent: 0,
          expAvailable: 0,
          isActive: true
        }
      });
      
      logger.info(`Created character ${character.id} for user ${userId}`);
      return character;
    } catch (error) {
      logger.error('Failed to create character:', error);
      throw error;
    }
  }

  /**
   * Get character by ID
   */
  async getCharacterById(characterId: string): Promise<any | null> {
    try {
      const character = await this.prisma.character.findUnique({
        where: { id: characterId },
        include: {
          skills: true,
          drives: true,
          assets: true,
          traits: true
        }
      });
      return character;
    } catch (error) {
      logger.error('Failed to get character:', error);
      throw error;
    }
  }

  /**
   * Get characters by user ID
   */
  async getCharactersByUserId(userId: string): Promise<any[]> {
    try {
      const characters = await this.prisma.character.findMany({
        where: { userId, isActive: true },
        include: {
          skills: true,
          drives: true,
          assets: true,
          traits: true
        }
      });
      return characters;
    } catch (error) {
      logger.error('Failed to get characters by user ID:', error);
      throw error;
    }
  }

  /**
   * Update character
   */
  async updateCharacter(characterId: string, updates: Partial<CharacterData>): Promise<any> {
    try {
      const character = await this.prisma.character.update({
        where: { id: characterId },
        data: {
          name: updates.name,
          concepts: updates.concepts,
          house: updates.house,
          homeworld: updates.homeworld,
          lastUpdated: new Date()
        }
      });
      
      logger.info(`Updated character ${characterId}`);
      return character;
    } catch (error) {
      logger.error('Failed to update character:', error);
      throw error;
    }
  }

  /**
   * Delete character (soft delete)
   */
  async deleteCharacter(characterId: string): Promise<void> {
    try {
      await this.prisma.character.update({
        where: { id: characterId },
        data: { isActive: false }
      });
      
      logger.info(`Soft deleted character ${characterId}`);
    } catch (error) {
      logger.error('Failed to delete character:', error);
      throw error;
    }
  }

  /**
   * Create character creation session (DISABLED - CharacterCreationSession model removed)
   */
  async createCharacterCreationSession(userId: string): Promise<any> {
    // This method is disabled as CharacterCreationSession model was removed during guild unification
    logger.warn('createCharacterCreationSession called but CharacterCreationSession model no longer exists');
    throw new Error('CharacterCreationSession functionality has been removed during database unification');
  }

  /**
   * Get character creation session by user ID (DISABLED - CharacterCreationSession model removed)
   */
  async getCharacterCreationSession(userId: string): Promise<any | null> {
    // This method is disabled as CharacterCreationSession model was removed during guild unification
    logger.warn('getCharacterCreationSession called but CharacterCreationSession model no longer exists');
    throw new Error('CharacterCreationSession functionality has been removed during database unification');
  }

  /**
   * Update character creation session (DISABLED - CharacterCreationSession model removed)
   */
  async updateCharacterCreationSession(sessionId: string, updates: any): Promise<any> {
    // This method is disabled as CharacterCreationSession model was removed during guild unification
    logger.warn('updateCharacterCreationSession called but CharacterCreationSession model no longer exists');
    throw new Error('CharacterCreationSession functionality has been removed during database unification');
  }

  /**
   * Delete character creation session (DISABLED - CharacterCreationSession model removed)
   */
  async deleteCharacterCreationSession(sessionId: string): Promise<void> {
    // This method is disabled as CharacterCreationSession model was removed during guild unification
    logger.warn('deleteCharacterCreationSession called but CharacterCreationSession model no longer exists');
    throw new Error('CharacterCreationSession functionality has been removed during database unification');
  }
}
