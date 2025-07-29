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
  async createCharacter(userId: string, guildId: string, characterData: CharacterData): Promise<any> {
    try {
      // For now, create a basic character record
      // This can be expanded later to match your exact needs
      const character = await this.prisma.character.create({
        data: {
          userId,
          guildId,
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
   * Create character creation session
   */
  async createCharacterCreationSession(userId: string, guildId: string): Promise<any> {
    try {
      const session = await this.prisma.characterCreationSession.create({
        data: {
          userId,
          guildId,
          currentStep: 'NAME',
          characterData: {},
          tempData: {}
        }
      });
      
      logger.info(`Created character creation session ${session.id} for user ${userId}`);
      return session;
    } catch (error) {
      logger.error('Failed to create character creation session:', error);
      throw error;
    }
  }

  /**
   * Get character creation session by user ID
   */
  async getCharacterCreationSession(userId: string, guildId: string): Promise<any | null> {
    try {
      const session = await this.prisma.characterCreationSession.findFirst({
        where: { userId, guildId }
      });
      return session;
    } catch (error) {
      logger.error('Failed to get character creation session:', error);
      throw error;
    }
  }

  /**
   * Update character creation session
   */
  async updateCharacterCreationSession(sessionId: string, updates: any): Promise<any> {
    try {
      const session = await this.prisma.characterCreationSession.update({
        where: { id: sessionId },
        data: {
          ...updates,
          lastUpdated: new Date()
        }
      });
      
      logger.info(`Updated character creation session ${sessionId}`);
      return session;
    } catch (error) {
      logger.error('Failed to update character creation session:', error);
      throw error;
    }
  }

  /**
   * Delete character creation session
   */
  async deleteCharacterCreationSession(sessionId: string): Promise<void> {
    try {
      await this.prisma.characterCreationSession.delete({
        where: { id: sessionId }
      });
      
      logger.info(`Deleted character creation session ${sessionId}`);
    } catch (error) {
      logger.error('Failed to delete character creation session:', error);
      throw error;
    }
  }
}
