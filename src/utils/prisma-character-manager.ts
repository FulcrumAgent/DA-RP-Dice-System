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

  // Validate image URL for avatars
  validateImageUrl(url: string): { valid: boolean; error?: string } {
    try {
      const parsedUrl = new URL(url);
      
      // Check if it's HTTP/HTTPS
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return { valid: false, error: 'URL must use HTTP or HTTPS protocol' };
      }
      
      // Check file extension
      const validExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
      const pathname = parsedUrl.pathname.toLowerCase();
      const hasValidExtension = validExtensions.some(ext => pathname.endsWith(ext));
      
      if (!hasValidExtension) {
        return { valid: false, error: 'Image must be PNG, JPG, JPEG, WebP, or GIF format' };
      }
      
      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Invalid URL format' };
    }
  }

  // Set character avatar
  async setCharacterAvatar(characterId: string, avatarUrl: string, userId: string): Promise<CharacterWithRelations> {
    const character = await this.getCharacter(characterId);
    if (!character) {
      throw new Error('Character not found');
    }
    
    if (character.userId !== userId) {
      throw new Error('You can only set avatars for your own characters');
    }
    
    return await this.updateCharacter(characterId, { avatarUrl });
  }

  // Remove character avatar
  async removeCharacterAvatar(characterId: string, userId: string): Promise<CharacterWithRelations> {
    const character = await this.getCharacter(characterId);
    if (!character) {
      throw new Error('Character not found');
    }
    
    if (character.userId !== userId) {
      throw new Error('You can only remove avatars from your own characters');
    }
    
    return await this.updateCharacter(characterId, { avatarUrl: undefined });
  }

  // ===== NPC MANAGEMENT METHODS =====

  // Get all NPCs for a guild
  async getGuildNPCs(guildId: string): Promise<any[]> {
    try {
      const npcs = await this.prisma.npc.findMany({
        where: { guildId },
        include: {
          skills: true,
          assets: true,
          traits: true,
          drives: true // Include drives for Nemesis NPCs
        },
        orderBy: { createdAt: 'desc' }
      });
      
      return npcs.map((npc: any) => this.formatNPCForLegacyCompatibility(npc));
    } catch (error) {
      logger.error('Error fetching guild NPCs:', error);
      throw new Error('Failed to fetch guild NPCs');
    }
  }

  // Get NPC by name
  async getNPCByName(name: string, guildId: string): Promise<any | null> {
    try {
      const npc = await this.prisma.npc.findFirst({
        where: {
          name: { equals: name, mode: 'insensitive' },
          guildId
        },
        include: {
          skills: true,
          assets: true,
          traits: true,
          drives: true // Include drives for Nemesis NPCs
        }
      });
      
      return npc ? this.formatNPCForLegacyCompatibility(npc) : null;
    } catch (error) {
      logger.error('Error fetching NPC by name:', error);
      return null;
    }
  }

  // Create a new NPC with tier-specific fields
  async createNPC(
    name: string,
    guildId: string,
    concepts: string[],
    tier: 'minion' | 'toughened' | 'nemesis',
    attributes: {
      muscle?: number;
      move?: number;
      intellect?: number;
      awareness?: number;
      communication?: number;
      discipline?: number;
    },
    skills: Array<{ name: string; value: number; focus?: string[] }>,
    assets: Array<{ name: string; type: string; description?: string; qualities?: string[]; cost?: number }>,
    traits: Array<{ name: string; type: string; description?: string; mechanical?: string }>,
    drives: Array<{ name: string; statement: string; value: number }> = [], // Only for Nemesis tier
    createdBy: string,
    description?: string
  ): Promise<any> {
    try {
      // Validate tier-specific data
      if (tier === 'nemesis' && drives.length === 0) {
        logger.warn(`Creating Nemesis NPC "${name}" without drives - this may not be intended`);
      }
      if ((tier === 'minion' || tier === 'toughened') && drives.length > 0) {
        logger.warn(`Creating ${tier} NPC "${name}" with drives - drives will be ignored for this tier`);
      }

      const npcData: any = {
        name,
        guildId,
        concepts,
        tier,
        createdBy,
        description,
        attrMuscle: attributes.muscle,
        attrMove: attributes.move,
        attrIntellect: attributes.intellect,
        attrAwareness: attributes.awareness,
        attrCommunication: attributes.communication,
        attrDiscipline: attributes.discipline,
        skills: {
          create: skills.map(skill => ({
            name: skill.name,
            value: skill.value,
            focus: skill.focus || []
          }))
        },
        assets: {
          create: assets.map(asset => ({
            name: asset.name,
            type: asset.type as any,
            description: asset.description,
            qualities: asset.qualities || [],
            cost: asset.cost
          }))
        },
        traits: {
          create: traits.map(trait => ({
            name: trait.name,
            type: trait.type as any,
            description: trait.description,
            mechanical: trait.mechanical
          }))
        }
      };

      // Only add drives for Nemesis tier NPCs
      if (tier === 'nemesis' && drives.length > 0) {
        npcData.drives = {
          create: drives.map(drive => ({
            name: drive.name,
            statement: drive.statement,
            value: drive.value
          }))
        };
      }

      const npc = await this.prisma.npc.create({
        data: npcData,
        include: {
          skills: true,
          assets: true,
          traits: true,
          drives: true // Include drives in the response
        }
      });
      
      logger.info(`Created NPC: ${name} in guild ${guildId}`);
      return this.formatNPCForLegacyCompatibility(npc);
    } catch (error) {
      logger.error('Error creating NPC:', error);
      throw new Error('Failed to create NPC');
    }
  }

  // Update NPC field
  async updateNPC(npcId: string, field: string, value: any, userId: string): Promise<any> {
    try {
      // First verify the NPC exists and user has permission
      const existingNPC = await this.prisma.npc.findUnique({
        where: { id: npcId }
      });
      
      if (!existingNPC) {
        throw new Error('NPC not found');
      }
      
      if (existingNPC.createdBy !== userId) {
        throw new Error('You can only edit NPCs you created');
      }
      
      // Handle special tier change with stat regeneration
      if (field === 'tier_change') {
        const tierData = JSON.parse(value);
        const updateData = {
          tier: tierData.tier,
          attributes: tierData.attributes,
          lastUpdated: new Date().toISOString()
        };
        
        // Update the NPC with new tier and stats
        const updatedNPC = await this.prisma.npc.update({
          where: { id: npcId },
          data: updateData,
          include: {
            skills: true,
            assets: true,
            traits: true,
            drives: true
          }
        });
        
        // Delete existing related data
        await this.prisma.nPCSkill.deleteMany({ where: { npcId } });
        await this.prisma.nPCAsset.deleteMany({ where: { npcId } });
        await this.prisma.nPCTrait.deleteMany({ where: { npcId } });
        await this.prisma.nPCDrive.deleteMany({ where: { npcId } });
        
        // Create new skills
        if (tierData.skills && tierData.skills.length > 0) {
          await this.prisma.nPCSkill.createMany({
            data: tierData.skills.map((skill: any) => ({
              npcId,
              name: skill.name,
              value: skill.value,
              focus: skill.focus || []
            }))
          });
        }
        
        // Create new assets
        if (tierData.assets && tierData.assets.length > 0) {
          await this.prisma.nPCAsset.createMany({
            data: tierData.assets.map((asset: any) => ({
              npcId,
              name: asset.name,
              type: asset.type,
              description: asset.description || '',
              qualities: asset.qualities || [],
              cost: asset.cost || 0
            }))
          });
        }
        
        // Create new traits
        if (tierData.traits && tierData.traits.length > 0) {
          await this.prisma.nPCTrait.createMany({
            data: tierData.traits.map((trait: any) => ({
              npcId,
              name: trait.name,
              type: trait.type,
              description: trait.description || '',
              mechanical: trait.mechanical || ''
            }))
          });
        }
        
        // Create new drives (only for Nemesis tier)
        if (tierData.tier === 'nemesis' && tierData.drives && tierData.drives.length > 0) {
          await this.prisma.nPCDrive.createMany({
            data: tierData.drives.map((drive: any) => ({
              npcId,
              name: drive.name,
              statement: drive.statement,
              value: drive.value
            }))
          });
        }
        
        // Fetch the updated NPC with all relations
        const finalNPC = await this.prisma.npc.findUnique({
          where: { id: npcId },
          include: {
            skills: true,
            assets: true,
            traits: true,
            drives: true
          }
        });
        
        logger.info(`Updated NPC ${npcId} tier to ${tierData.tier} with regenerated stats`);
        return this.formatNPCForLegacyCompatibility(finalNPC);
      }
      
      // Map field names to database columns for regular updates
      const fieldMap: { [key: string]: string } = {
        'name': 'name',
        'concept': 'concepts',
        'description': 'description',
        'tier': 'tier'
      };
      
      const dbField = fieldMap[field] || field;
      const updateData: any = {};
      
      if (field === 'concept') {
        updateData.concepts = [value];
      } else {
        updateData[dbField] = value;
      }
      
      const updatedNPC = await this.prisma.npc.update({
        where: { id: npcId },
        data: updateData,
        include: {
          skills: true,
          assets: true,
          traits: true,
          drives: true // Include drives for Nemesis NPCs
        }
      });
      
      logger.info(`Updated NPC ${npcId} field ${field}`);
      return this.formatNPCForLegacyCompatibility(updatedNPC);
    } catch (error) {
      logger.error('Error updating NPC:', error);
      throw error;
    }
  }

  // Delete NPC
  async deleteNPC(npcId: string, userId: string): Promise<boolean> {
    try {
      // First verify the NPC exists and user has permission
      const existingNPC = await this.prisma.npc.findUnique({
        where: { id: npcId }
      });
      
      if (!existingNPC) {
        throw new Error('NPC not found');
      }
      
      if (existingNPC.createdBy !== userId) {
        throw new Error('You can only delete NPCs you created');
      }
      
      await this.prisma.npc.delete({
        where: { id: npcId }
      });
      
      logger.info(`Deleted NPC ${npcId}`);
      return true;
    } catch (error) {
      logger.error('Error deleting NPC:', error);
      throw error;
    }
  }

  // Set NPC avatar
  async setNPCAvatar(npcId: string, avatarUrl: string, userId: string): Promise<any> {
    try {
      // Validate the image URL
      const validation = this.validateImageUrl(avatarUrl);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
      
      // Verify the NPC exists and user has permission
      const existingNPC = await this.prisma.npc.findUnique({
        where: { id: npcId }
      });
      
      if (!existingNPC) {
        throw new Error('NPC not found');
      }
      
      if (existingNPC.createdBy !== userId) {
        throw new Error('You can only modify avatars for NPCs you created');
      }
      
      const updatedNPC = await this.prisma.npc.update({
        where: { id: npcId },
        data: { avatarUrl },
        include: {
          skills: true,
          assets: true,
          traits: true,
          drives: true // Include drives for Nemesis NPCs
        }
      });
      
      logger.info(`Set avatar for NPC ${npcId}`);
      return this.formatNPCForLegacyCompatibility(updatedNPC);
    } catch (error) {
      logger.error('Error setting NPC avatar:', error);
      throw error;
    }
  }

  // Remove NPC avatar
  async removeNPCAvatar(npcId: string, userId: string): Promise<any> {
    try {
      // Verify the NPC exists and user has permission
      const existingNPC = await this.prisma.npc.findUnique({
        where: { id: npcId }
      });
      
      if (!existingNPC) {
        throw new Error('NPC not found');
      }
      
      if (existingNPC.createdBy !== userId) {
        throw new Error('You can only modify avatars for NPCs you created');
      }
      
      const updatedNPC = await this.prisma.npc.update({
        where: { id: npcId },
        data: { avatarUrl: null },
        include: {
          skills: true,
          assets: true,
          traits: true,
          drives: true // Include drives for Nemesis NPCs
        }
      });
      
      logger.info(`Removed avatar for NPC ${npcId}`);
      return this.formatNPCForLegacyCompatibility(updatedNPC);
    } catch (error) {
      logger.error('Error removing NPC avatar:', error);
      throw error;
    }
  }

  // Format NPC data for legacy compatibility with tier-specific fields
  private formatNPCForLegacyCompatibility(npc: any): any {
    const formattedNPC: any = {
      id: npc.id,
      name: npc.name,
      guildId: npc.guildId,
      concepts: npc.concepts,
      description: npc.description,
      tier: npc.tier,
      avatarUrl: npc.avatarUrl,
      createdBy: npc.createdBy,
      createdAt: npc.createdAt,
      attributes: {
        muscle: npc.attrMuscle,
        move: npc.attrMove,
        intellect: npc.attrIntellect,
        awareness: npc.attrAwareness,
        communication: npc.attrCommunication,
        discipline: npc.attrDiscipline
      },
      skills: npc.skills?.map((skill: any) => ({
        name: skill.name,
        value: skill.value,
        focus: skill.focus
      })) || [],
      assets: npc.assets?.map((asset: any) => ({
        name: asset.name,
        type: asset.type,
        description: asset.description,
        qualities: asset.qualities,
        cost: asset.cost
      })) || [],
      traits: npc.traits?.map((trait: any) => ({
        name: trait.name,
        type: trait.type,
        description: trait.description,
        mechanical: trait.mechanical
      })) || []
    };

    // Only include drives for Nemesis tier NPCs
    if (npc.tier === 'nemesis') {
      formattedNPC.drives = npc.drives?.map((drive: any) => ({
        name: drive.name,
        statement: drive.statement,
        value: drive.value
      })) || [];
    }

    return formattedNPC;
  }

  // ===== TIER-SPECIFIC NPC GENERATION HELPERS =====

  /**
   * Generate NPC stats based on tier following Dune: Adventures conventions
   * Minion: Simple stats, no drives
   * Toughened: Better stats, no drives  
   * Nemesis: Full character sheet with drives
   */
  generateNPCStatsForTier(tier: 'minion' | 'toughened' | 'nemesis') {
    const baseAttributes = {
      muscle: 8,
      move: 8, 
      intellect: 8,
      awareness: 8,
      communication: 8,
      discipline: 8
    };

    const baseSkills: Array<{ name: string; value: number; focus: string[] }> = [
      { name: 'Battle', value: 6, focus: [] },
      { name: 'Communicate', value: 6, focus: [] },
      { name: 'Discipline', value: 6, focus: [] },
      { name: 'Move', value: 6, focus: [] },
      { name: 'Understand', value: 6, focus: [] }
    ];

    let attributes = { ...baseAttributes };
    let skills: Array<{ name: string; value: number; focus: string[] }> = [...baseSkills];
    let drives: DuneDrive[] = [];
    let assets: DuneAsset[] = [];
    let traits: DuneTrait[] = [];

    switch (tier) {
      case 'minion':
        // Minions: Basic stats, simple equipment
        attributes = {
          muscle: 7 + Math.floor(Math.random() * 3), // 7-9
          move: 7 + Math.floor(Math.random() * 3),
          intellect: 7 + Math.floor(Math.random() * 3), 
          awareness: 7 + Math.floor(Math.random() * 3),
          communication: 7 + Math.floor(Math.random() * 3),
          discipline: 7 + Math.floor(Math.random() * 3)
        };
        skills = [
          { name: 'Battle', value: 5 + Math.floor(Math.random() * 3), focus: [] }, // 5-7
          { name: 'Communicate', value: 5 + Math.floor(Math.random() * 3), focus: [] },
          { name: 'Discipline', value: 5 + Math.floor(Math.random() * 3), focus: [] },
          { name: 'Move', value: 5 + Math.floor(Math.random() * 3), focus: [] },
          { name: 'Understand', value: 5 + Math.floor(Math.random() * 3), focus: [] }
        ];
        break;

      case 'toughened':
        // Toughened: Better stats, some equipment/traits
        attributes = {
          muscle: 8 + Math.floor(Math.random() * 3), // 8-10
          move: 8 + Math.floor(Math.random() * 3),
          intellect: 8 + Math.floor(Math.random() * 3),
          awareness: 8 + Math.floor(Math.random() * 3), 
          communication: 8 + Math.floor(Math.random() * 3),
          discipline: 8 + Math.floor(Math.random() * 3)
        };
        skills = [
          { name: 'Battle', value: 6 + Math.floor(Math.random() * 3), focus: [] }, // 6-8
          { name: 'Communicate', value: 6 + Math.floor(Math.random() * 3), focus: [] },
          { name: 'Discipline', value: 6 + Math.floor(Math.random() * 3), focus: [] },
          { name: 'Move', value: 6 + Math.floor(Math.random() * 3), focus: [] },
          { name: 'Understand', value: 6 + Math.floor(Math.random() * 3), focus: [] }
        ];
        assets = [
          { name: 'Combat Training', type: 'talent', description: 'Enhanced combat capabilities' },
          { name: 'Quality Equipment', type: 'equipment', description: 'Better than standard gear' }
        ];
        break;

      case 'nemesis':
        // Nemesis: Full character sheet with drives
        attributes = {
          muscle: 9 + Math.floor(Math.random() * 3), // 9-11
          move: 9 + Math.floor(Math.random() * 3),
          intellect: 9 + Math.floor(Math.random() * 3),
          awareness: 9 + Math.floor(Math.random() * 3),
          communication: 9 + Math.floor(Math.random() * 3),
          discipline: 9 + Math.floor(Math.random() * 3)
        };
        
        // Use proper skill point-buy values for Nemesis
        const skillValues = [...PrismaCharacterManager.SKILL_POINT_VALUES].sort(() => Math.random() - 0.5);
        skills = [
          { name: 'Battle', value: skillValues[0], focus: ['Combat Tactics'] },
          { name: 'Communicate', value: skillValues[1], focus: ['Intimidation'] },
          { name: 'Discipline', value: skillValues[2], focus: ['Mental Fortitude'] },
          { name: 'Move', value: skillValues[3], focus: ['Agility'] },
          { name: 'Understand', value: skillValues[4], focus: ['Strategy'] }
        ];

        // Generate drives using proper point-buy values
        const driveValues = [...PrismaCharacterManager.DRIVE_POINT_VALUES].sort(() => Math.random() - 0.5);
        const driveNames = [...PrismaCharacterManager.DUNE_DRIVES].sort(() => Math.random() - 0.5);
        drives = [
          { name: driveNames[0], statement: `Driven by ${driveNames[0].toLowerCase()}`, value: driveValues[0] },
          { name: driveNames[1], statement: `Seeks ${driveNames[1].toLowerCase()}`, value: driveValues[1] },
          { name: driveNames[2], statement: `Values ${driveNames[2].toLowerCase()}`, value: driveValues[2] },
          { name: driveNames[3], statement: `Pursues ${driveNames[3].toLowerCase()}`, value: driveValues[3] },
          { name: driveNames[4], statement: `Embodies ${driveNames[4].toLowerCase()}`, value: driveValues[4] }
        ];

        assets = [
          { name: 'Master Combatant', type: 'talent', description: 'Exceptional fighting skills' },
          { name: 'Superior Equipment', type: 'equipment', description: 'Top-tier gear and weapons' },
          { name: 'Network of Contacts', type: 'contact', description: 'Extensive connections' },
          { name: 'Fearsome Reputation', type: 'reputation', description: 'Known and feared' }
        ];
        
        traits = [
          { name: 'Ruthless', type: 'flaw', description: 'Will do anything to achieve goals' },
          { name: 'Strategic Mind', type: 'background', description: 'Thinks several steps ahead' }
        ];
        break;
    }

    return {
      attributes,
      skills,
      drives, // Empty for minion/toughened, populated for nemesis
      assets,
      traits
    };
  }

  /**
   * Check if an NPC tier supports drives
   */
  static npcTierHasDrives(tier: 'minion' | 'toughened' | 'nemesis'): boolean {
    return tier === 'nemesis';
  }

  /**
   * Get tier display information
   */
  static getTierInfo(tier: 'minion' | 'toughened' | 'nemesis') {
    const tierInfo = {
      minion: {
        displayName: 'Minion (Supporting Character)',
        description: 'Simple stat block, no drives. Rolls use skill + attribute only.',
        color: 0x808080 // Gray
      },
      toughened: {
        displayName: 'Toughened (Notable Supporting Character)', 
        description: 'Better stats and assets, but no drives. Rolls use skill + attribute only.',
        color: 0xFFA500 // Orange
      },
      nemesis: {
        displayName: 'Nemesis (Adversary)',
        description: 'Full character sheet with drives. Uses all PC rules including skill + drive rolls.',
        color: 0xFF0000 // Red
      }
    };
    return tierInfo[tier];
  }
}

// Export singleton instance
export const prismaCharacterManager = new PrismaCharacterManager();
