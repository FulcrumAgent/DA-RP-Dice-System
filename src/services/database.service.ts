/**
 * Database Service for PostgreSQL Integration
 * Handles database connections and provides methods for character management
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { DuneCharacter, NPC, CharacterCreationSession } from '../types/character';

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
   * Initialize database connection
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
   * Create a new character
   */
  async createCharacter(characterData: Omit<DuneCharacter, 'id' | 'createdAt' | 'lastUpdated'>): Promise<DuneCharacter> {
    try {
      const character = await this.prisma.character.create({
        data: {
          userId: characterData.userId,
          guildId: characterData.guildId,
          name: characterData.name,
          concepts: characterData.concepts,
          house: characterData.house,
          homeworld: characterData.homeworld,
          avatarUrl: characterData.avatar,
          attrMuscle: characterData.attributes.muscle,
          attrMove: characterData.attributes.move,
          attrIntellect: characterData.attributes.intellect,
          attrAwareness: characterData.attributes.awareness,
          attrCommunication: characterData.attributes.communication,
          attrDiscipline: characterData.attributes.discipline,
          determination: characterData.determination,
          maxDetermination: characterData.maxDetermination,
          expTotal: characterData.experience.total,
          expSpent: characterData.experience.spent,
          expAvailable: characterData.experience.available,
          isActive: characterData.isActive,
          skills: {
            create: characterData.skills.map(skill => ({
              name: skill.name,
              value: skill.value,
              focus: skill.focus || []
            }))
          },
          drives: {
            create: characterData.drives.map(drive => ({
              name: drive.name,
              statement: drive.statement,
              value: drive.value
            }))
          },
          assets: {
            create: characterData.assets.map(asset => ({
              name: asset.name,
              type: asset.type,
              description: asset.description,
              qualities: asset.qualities || [],
              cost: asset.cost
            }))
          },
          traits: {
            create: characterData.traits.map(trait => ({
              name: trait.name,
              type: trait.type,
              description: trait.description,
              mechanical: trait.mechanical
            }))
          }
        },
        include: {
          skills: true,
          drives: true,
          assets: true,
          traits: true
        }
      });

      return this.mapPrismaToCharacter(character);
    } catch (error) {
      logger.error('Error creating character:', error);
      throw error;
    }
  }

  /**
   * Get character by ID
   */
  async getCharacter(characterId: string): Promise<DuneCharacter | null> {
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

      return character ? this.mapPrismaToCharacter(character) : null;
    } catch (error) {
      logger.error('Error getting character:', error);
      throw error;
    }
  }

  /**
   * Get all characters for a user in a guild
   */
  async getUserCharacters(userId: string, guildId: string): Promise<DuneCharacter[]> {
    try {
      const characters = await this.prisma.character.findMany({
        where: {
          userId,
          guildId,
          isActive: true
        },
        include: {
          skills: true,
          drives: true,
          assets: true,
          traits: true
        },
        orderBy: { lastUpdated: 'desc' }
      });

      return characters.map(char => this.mapPrismaToCharacter(char));
    } catch (error) {
      logger.error('Error getting user characters:', error);
      throw error;
    }
  }

  /**
   * Update character
   */
  async updateCharacter(characterId: string, updates: Partial<DuneCharacter>): Promise<DuneCharacter> {
    try {
      const character = await this.prisma.character.update({
        where: { id: characterId },
        data: {
          name: updates.name,
          concepts: updates.concepts,
          house: updates.house,
          homeworld: updates.homeworld,
          avatarUrl: updates.avatar,
          attrMuscle: updates.attributes?.muscle,
          attrMove: updates.attributes?.move,
          attrIntellect: updates.attributes?.intellect,
          attrAwareness: updates.attributes?.awareness,
          attrCommunication: updates.attributes?.communication,
          attrDiscipline: updates.attributes?.discipline,
          determination: updates.determination,
          maxDetermination: updates.maxDetermination,
          expTotal: updates.experience?.total,
          expSpent: updates.experience?.spent,
          expAvailable: updates.experience?.available,
          isActive: updates.isActive
        },
        include: {
          skills: true,
          drives: true,
          assets: true,
          traits: true
        }
      });

      return this.mapPrismaToCharacter(character);
    } catch (error) {
      logger.error('Error updating character:', error);
      throw error;
    }
  }

  /**
   * Delete character (soft delete by setting isActive to false)
   */
  async deleteCharacter(characterId: string): Promise<void> {
    try {
      await this.prisma.character.update({
        where: { id: characterId },
        data: { isActive: false }
      });
    } catch (error) {
      logger.error('Error deleting character:', error);
      throw error;
    }
  }

  /**
   * Get or create momentum pool for guild/channel
   */
  async getMomentumPool(guildId: string, channelId: string) {
    try {
      const pool = await this.prisma.momentumPool.upsert({
        where: {
          guildId_channelId: {
            guildId,
            channelId
          }
        },
        update: {},
        create: {
          guildId,
          channelId,
          momentum: 0,
          threat: 0
        }
      });

      return {
        guildId: pool.guildId,
        channelId: pool.channelId,
        momentum: pool.momentum,
        threat: pool.threat,
        lastUpdated: pool.lastUpdated.toISOString()
      };
    } catch (error) {
      logger.error('Error getting momentum pool:', error);
      throw error;
    }
  }

  /**
   * Update momentum pool
   */
  async updateMomentumPool(guildId: string, channelId: string, momentum: number, threat: number) {
    try {
      const pool = await this.prisma.momentumPool.upsert({
        where: {
          guildId_channelId: {
            guildId,
            channelId
          }
        },
        update: {
          momentum,
          threat
        },
        create: {
          guildId,
          channelId,
          momentum,
          threat
        }
      });

      return {
        guildId: pool.guildId,
        channelId: pool.channelId,
        momentum: pool.momentum,
        threat: pool.threat,
        lastUpdated: pool.lastUpdated.toISOString()
      };
    } catch (error) {
      logger.error('Error updating momentum pool:', error);
      throw error;
    }
  }

  /**
   * Save character creation session
   */
  async saveCharacterCreationSession(session: CharacterCreationSession): Promise<void> {
    try {
      await this.prisma.characterCreationSession.upsert({
        where: {
          userId_guildId: {
            userId: session.userId,
            guildId: session.guildId
          }
        },
        update: {
          currentStep: session.currentStep,
          characterData: session.characterData as any,
          tempData: session.tempData as any,
          messageId: session.messageId,
          channelId: session.channelId
        },
        create: {
          userId: session.userId,
          guildId: session.guildId,
          currentStep: session.currentStep,
          characterData: session.characterData as any,
          tempData: session.tempData as any,
          messageId: session.messageId,
          channelId: session.channelId
        }
      });
    } catch (error) {
      logger.error('Error saving character creation session:', error);
      throw error;
    }
  }

  /**
   * Get character creation session
   */
  async getCharacterCreationSession(userId: string, guildId: string): Promise<CharacterCreationSession | null> {
    try {
      const session = await this.prisma.characterCreationSession.findUnique({
        where: {
          userId_guildId: {
            userId,
            guildId
          }
        }
      });

      if (!session) return null;

      return {
        userId: session.userId,
        currentStep: session.currentStep as any,
        characterData: session.characterData as any,
        tempData: session.tempData as any,
        messageId: session.messageId || undefined,
        channelId: session.channelId || undefined,
        lastUpdated: session.lastUpdated.getTime()
      };
    } catch (error) {
      logger.error('Error getting character creation session:', error);
      throw error;
    }
  }

  /**
   * Delete character creation session
   */
  async deleteCharacterCreationSession(userId: string, guildId: string): Promise<void> {
    try {
      await this.prisma.characterCreationSession.delete({
        where: {
          userId_guildId: {
            userId,
            guildId
          }
        }
      });
    } catch (error) {
      logger.error('Error deleting character creation session:', error);
      throw error;
    }
  }

  /**
   * Map Prisma character object to DuneCharacter interface
   */
  private mapPrismaToCharacter(prismaChar: any): DuneCharacter {
    return {
      id: prismaChar.id,
      userId: prismaChar.userId,
      guildId: prismaChar.guildId,
      name: prismaChar.name,
      concepts: prismaChar.concepts,
      house: prismaChar.house,
      homeworld: prismaChar.homeworld,
      avatar: prismaChar.avatarUrl,
      attributes: {
        muscle: prismaChar.attrMuscle,
        move: prismaChar.attrMove,
        intellect: prismaChar.attrIntellect,
        awareness: prismaChar.attrAwareness,
        communication: prismaChar.attrCommunication,
        discipline: prismaChar.attrDiscipline
      },
      skills: prismaChar.skills.map((skill: any) => ({
        name: skill.name,
        value: skill.value,
        focus: skill.focus
      })),
      drives: prismaChar.drives.map((drive: any) => ({
        name: drive.name,
        statement: drive.statement,
        value: drive.value
      })),
      assets: prismaChar.assets.map((asset: any) => ({
        name: asset.name,
        type: asset.type,
        description: asset.description,
        qualities: asset.qualities,
        cost: asset.cost
      })),
      traits: prismaChar.traits.map((trait: any) => ({
        name: trait.name,
        type: trait.type,
        description: trait.description,
        mechanical: trait.mechanical
      })),
      determination: prismaChar.determination,
      maxDetermination: prismaChar.maxDetermination,
      experience: {
        total: prismaChar.expTotal,
        spent: prismaChar.expSpent,
        available: prismaChar.expAvailable
      },
      createdAt: prismaChar.createdAt.toISOString(),
      lastUpdated: prismaChar.lastUpdated.toISOString(),
      isActive: prismaChar.isActive
    };
  }
}

// Export singleton instance
export const databaseService = DatabaseService.getInstance();
