/**
 * Prisma-based Character Manager for PostgreSQL Database
 * Replaces the old file-based character manager
 */

import { getPrismaClient } from './prisma';
import { logger } from './logger';

// Character with relations type (simplified to avoid Prisma generated type issues)
export interface CharacterWithRelations {
  id: string;
  userId: string;
  guildId: string;
  name: string;
  concepts: string[];
  house?: string | null;
  homeworld?: string | null;
  avatarUrl?: string | null;
  attrMuscle: number;
  attrMove: number;
  attrIntellect: number;
  attrAwareness: number;
  attrCommunication: number;
  attrDiscipline: number;
  determination: number;
  maxDetermination: number;
  expTotal: number;
  expSpent: number;
  expAvailable: number;
  isActive: boolean;
  createdAt: Date;
  lastUpdated: Date;
  skills: any[];
  drives: any[];
  assets: any[];
  traits: any[];
}

export interface DuneSkill {
  name: string;
  value: number;
  focus?: string[];
}

export interface DuneDrive {
  name: string;
  statement: string;
  value: number;
}

export interface DuneAsset {
  name: string;
  type: 'talent' | 'equipment' | 'contact' | 'reputation';
  description: string;
  qualities?: string[];
  cost?: number;
}

export interface DuneTrait {
  name: string;
  type: 'flaw' | 'quirk' | 'background';
  description: string;
  mechanical?: string;
}

export class PrismaCharacterManager {
  private prisma = getPrismaClient();

  // Static constants
  static readonly SKILL_POINT_VALUES = [9, 7, 6, 5, 4];
  static readonly DRIVE_POINT_VALUES = [8, 7, 6, 5, 4];
  static readonly DUNE_SKILLS = ['Battle', 'Communicate', 'Discipline', 'Move', 'Understand'];
  static readonly DUNE_DRIVES = ['Duty', 'Faith', 'Justice', 'Power', 'Truth'];

  /**
   * Create a new character
   */
  async createCharacter(
    userId: string,
    guildId: string,
    name: string,
    concepts: string[],
    options: {
      house?: string;
      homeworld?: string;
      attributes?: {
        muscle?: number;
        move?: number;
        intellect?: number;
        awareness?: number;
        communication?: number;
        discipline?: number;
      };
      skills?: DuneSkill[];
      drives?: DuneDrive[];
      assets?: DuneAsset[];
    } = {}
  ): Promise<CharacterWithRelations> {
    try {
      logger.info(`Creating character "${name}" for user ${userId} in guild ${guildId}`);

      // Create character with default attributes
      const character = await this.prisma.character.create({
        data: {
          userId,
          guildId,
          name,
          concepts,
          house: options.house,
          homeworld: options.homeworld,
          attrMuscle: options.attributes?.muscle || 8,
          attrMove: options.attributes?.move || 8,
          attrIntellect: options.attributes?.intellect || 8,
          attrAwareness: options.attributes?.awareness || 8,
          attrCommunication: options.attributes?.communication || 8,
          attrDiscipline: options.attributes?.discipline || 8,
          determination: 0,
          maxDetermination: 0,
          expTotal: 0,
          expSpent: 0,
          expAvailable: 0,
        },
        include: {
          skills: true,
          drives: true,
          assets: true,
          traits: true,
        },
      });

      // Add default skills if provided
      if (options.skills && options.skills.length > 0) {
        await this.addSkillsToCharacter(character.id, options.skills);
      } else {
        // Add default skills
        await this.addSkillsToCharacter(character.id, this.getDefaultSkills());
      }

      // Add drives if provided
      if (options.drives && options.drives.length > 0) {
        await this.addDrivesToCharacter(character.id, options.drives);
      }

      // Add assets if provided
      if (options.assets && options.assets.length > 0) {
        await this.addAssetsToCharacter(character.id, options.assets);
      }

      // Return character with all relations
      return await this.getCharacterWithRelations(character.id);

    } catch (error) {
      logger.error('Error creating character:', error);
      throw new Error(`Failed to create character: ${error}`);
    }
  }

  /**
   * Get character with all relations
   */
  async getCharacterWithRelations(characterId: string): Promise<CharacterWithRelations> {
    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: {
        skills: true,
        drives: true,
        assets: true,
        traits: true,
      },
    });

    if (!character) {
      throw new Error(`Character with ID ${characterId} not found`);
    }

    return character;
  }

  /**
   * Get user's active character (most recently updated)
   */
  async getUserActiveCharacter(userId: string, guildId: string): Promise<CharacterWithRelations | null> {
    try {
      const character = await this.prisma.character.findFirst({
        where: {
          userId,
          guildId,
          isActive: true,
        },
        include: {
          skills: true,
          drives: true,
          assets: true,
          traits: true,
        },
        orderBy: {
          lastUpdated: 'desc',
        },
      });

      return character;
    } catch (error) {
      logger.error('Error getting user active character:', error);
      return null;
    }
  }

  /**
   * Get all characters for a user in a guild
   */
  async getUserCharacters(userId: string, guildId: string): Promise<CharacterWithRelations[]> {
    try {
      const characters = await this.prisma.character.findMany({
        where: {
          userId,
          guildId,
          isActive: true,
        },
        include: {
          skills: true,
          drives: true,
          assets: true,
          traits: true,
        },
        orderBy: {
          lastUpdated: 'desc',
        },
      });

      return characters;
    } catch (error) {
      logger.error('Error getting user characters:', error);
      return [];
    }
  }

  /**
   * Get character by ID
   */
  async getCharacter(characterId: string): Promise<CharacterWithRelations | null> {
    try {
      const character = await this.prisma.character.findUnique({
        where: { id: characterId },
        include: {
          skills: true,
          drives: true,
          assets: true,
          traits: true,
        },
      });

      return character;
    } catch (error) {
      logger.error('Error getting character:', error);
      return null;
    }
  }

  /**
   * Update character
   */
  async updateCharacter(
    characterId: string,
    updates: Partial<{
      name: string;
      concepts: string[];
      house: string;
      homeworld: string;
      avatarUrl: string;
      attrMuscle: number;
      attrMove: number;
      attrIntellect: number;
      attrAwareness: number;
      attrCommunication: number;
      attrDiscipline: number;
      determination: number;
      maxDetermination: number;
    }>
  ): Promise<CharacterWithRelations> {
    try {
      const updatedCharacter = await this.prisma.character.update({
        where: { id: characterId },
        data: updates,
        include: {
          skills: true,
          drives: true,
          assets: true,
          traits: true,
        },
      });

      logger.info(`Updated character ${characterId}`);
      return updatedCharacter;
    } catch (error) {
      logger.error('Error updating character:', error);
      throw new Error(`Failed to update character: ${error}`);
    }
  }

  /**
   * Delete character
   */
  async deleteCharacter(characterId: string, userId: string): Promise<boolean> {
    try {
      // Verify the character belongs to the user
      const character = await this.prisma.character.findUnique({
        where: { id: characterId },
      });

      if (!character || character.userId !== userId) {
        logger.warn(`User ${userId} attempted to delete character ${characterId} they don't own`);
        return false;
      }

      // Soft delete by setting isActive to false
      await this.prisma.character.update({
        where: { id: characterId },
        data: { isActive: false },
      });

      logger.info(`Deleted character ${characterId} for user ${userId}`);
      return true;
    } catch (error) {
      logger.error('Error deleting character:', error);
      return false;
    }
  }

  /**
   * Add skills to character
   */
  private async addSkillsToCharacter(characterId: string, skills: DuneSkill[]): Promise<void> {
    const skillData = skills.map(skill => ({
      characterId,
      name: skill.name,
      value: skill.value,
      focus: skill.focus || [],
    }));

    await this.prisma.characterSkill.createMany({
      data: skillData,
    });
  }

  /**
   * Add drives to character
   */
  private async addDrivesToCharacter(characterId: string, drives: DuneDrive[]): Promise<void> {
    const driveData = drives.map(drive => ({
      characterId,
      name: drive.name,
      statement: drive.statement,
      value: drive.value,
    }));

    await this.prisma.characterDrive.createMany({
      data: driveData,
    });
  }

  /**
   * Add assets to character
   */
  private async addAssetsToCharacter(characterId: string, assets: DuneAsset[]): Promise<void> {
    const assetData = assets.map(asset => ({
      characterId,
      name: asset.name,
      type: asset.type, // AssetType enum uses lowercase values
      description: asset.description,
      qualities: asset.qualities || [],
      cost: asset.cost,
    }));

    await this.prisma.characterAsset.createMany({
      data: assetData,
    });
  }

  /**
   * Get default skills for new characters
   */
  getDefaultSkills(): DuneSkill[] {
    return PrismaCharacterManager.DUNE_SKILLS.map(skillName => ({
      name: skillName,
      value: 0,
      focus: [],
    }));
  }

  /**
   * Update determination for character
   */
  async updateDetermination(characterId: string, change: number): Promise<CharacterWithRelations> {
    try {
      const character = await this.prisma.character.findUnique({
        where: { id: characterId },
      });

      if (!character) {
        throw new Error(`Character ${characterId} not found`);
      }

      const newDetermination = Math.max(0, character.determination + change);

      return await this.prisma.character.update({
        where: { id: characterId },
        data: { determination: newDetermination },
        include: {
          skills: true,
          drives: true,
          assets: true,
          traits: true,
        },
      });
    } catch (error) {
      logger.error('Error updating determination:', error);
      throw new Error(`Failed to update determination: ${error}`);
    }
  }

  /**
   * Set character skills using point-buy system
   */
  async setSkillsPointBuy(
    characterId: string,
    skillAssignments: { [skill: string]: number }
  ): Promise<CharacterWithRelations> {
    try {
      // Validate skill assignments
      const validation = this.validateSkillAssignments(skillAssignments);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Delete existing skills
      await this.prisma.characterSkill.deleteMany({
        where: { characterId },
      });

      // Create new skills
      const skillData = Object.entries(skillAssignments).map(([name, value]) => ({
        characterId,
        name,
        value,
        focus: [],
      }));

      await this.prisma.characterSkill.createMany({
        data: skillData,
      });

      return await this.getCharacterWithRelations(characterId);
    } catch (error) {
      logger.error('Error setting skills point-buy:', error);
      throw new Error(`Failed to set skills: ${error}`);
    }
  }

  /**
   * Set character drives using point-buy system
   */
  async setDrivesPointBuy(
    characterId: string,
    driveAssignments: { [drive: string]: number },
    driveStatements: { [drive: string]: string }
  ): Promise<CharacterWithRelations> {
    try {
      // Validate drive assignments
      const validation = this.validateDriveAssignments(driveAssignments);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Delete existing drives
      await this.prisma.characterDrive.deleteMany({
        where: { characterId },
      });

      // Create new drives
      const driveData = Object.entries(driveAssignments).map(([name, value]) => ({
        characterId,
        name,
        value,
        statement: driveStatements[name] || '',
      }));

      await this.prisma.characterDrive.createMany({
        data: driveData,
      });

      return await this.getCharacterWithRelations(characterId);
    } catch (error) {
      logger.error('Error setting drives point-buy:', error);
      throw new Error(`Failed to set drives: ${error}`);
    }
  }

  /**
   * Validate skill point-buy assignments
   */
  validateSkillAssignments(skills: { [skill: string]: number }): { valid: boolean; error?: string } {
    const values = Object.values(skills);
    const sortedValues = [...values].sort((a, b) => b - a);
    
    if (sortedValues.length !== PrismaCharacterManager.SKILL_POINT_VALUES.length) {
      return { valid: false, error: `Must assign exactly ${PrismaCharacterManager.SKILL_POINT_VALUES.length} skills` };
    }

    for (let i = 0; i < sortedValues.length; i++) {
      if (sortedValues[i] !== PrismaCharacterManager.SKILL_POINT_VALUES[i]) {
        return { valid: false, error: `Invalid skill values. Must use: ${PrismaCharacterManager.SKILL_POINT_VALUES.join(', ')}` };
      }
    }

    return { valid: true };
  }

  /**
   * Validate drive point-buy assignments
   */
  validateDriveAssignments(drives: { [drive: string]: number }): { valid: boolean; error?: string } {
    const values = Object.values(drives);
    const sortedValues = [...values].sort((a, b) => b - a);
    
    if (sortedValues.length !== PrismaCharacterManager.DRIVE_POINT_VALUES.length) {
      return { valid: false, error: `Must assign exactly ${PrismaCharacterManager.DRIVE_POINT_VALUES.length} drives` };
    }

    for (let i = 0; i < sortedValues.length; i++) {
      if (sortedValues[i] !== PrismaCharacterManager.DRIVE_POINT_VALUES[i]) {
        return { valid: false, error: `Invalid drive values. Must use: ${PrismaCharacterManager.DRIVE_POINT_VALUES.join(', ')}` };
      }
    }

    return { valid: true };
  }
}

// Export singleton instance
export const prismaCharacterManager = new PrismaCharacterManager();
