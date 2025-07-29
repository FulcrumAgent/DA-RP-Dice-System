/**
 * Character Sheet Management System for Dune 2d20
 */

import { DataManager } from './database';
import { logger } from './logger';

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

export interface DuneCharacter {
  id: string;
  userId: string;
  guildId: string;
  name: string;
  concepts: string[];
  house?: string;
  homeworld?: string;
  avatar?: string; // Custom avatar URL for this character
  
  // Core Attributes
  attributes: {
    muscle: number;
    move: number;
    intellect: number;
    awareness: number;
    communication: number;
    discipline: number;
  };

  // Skills
  skills: DuneSkill[];

  // Drives
  drives: DuneDrive[];

  // Assets & Equipment
  assets: DuneAsset[];

  // Traits
  traits: DuneTrait[];

  // Resources
  determination: number;
  maxDetermination: number;

  // Experience
  experience: {
    total: number;
    spent: number;
    available: number;
  };

  // Metadata
  createdAt: string;
  lastUpdated: string;
  isActive: boolean;
}

export interface NPC {
  id: string;
  name: string;
  guildId: string;
  concepts: string[];
  description: string;
  tier?: 'minion' | 'toughened' | 'nemesis';
  avatar?: string; // Custom avatar URL for this NPC
  attributes?: Partial<DuneCharacter['attributes']>;
  skills?: DuneSkill[];
  assets?: DuneAsset[];
  traits?: DuneTrait[];
  createdBy: string;
  createdAt: string;
}

export class CharacterManager {
  private dataManager: DataManager;
  private characters: Map<string, DuneCharacter> = new Map();
  private npcs: Map<string, NPC> = new Map();

  constructor() {
    this.dataManager = new DataManager();
    this.loadData();
  }

  /**
   * Load characters and NPCs from storage
   */
  private async loadData(): Promise<void> {
    try {
      const charactersData = await this.dataManager.loadData<DuneCharacter[]>('characters.json');
      const npcsData = await this.dataManager.loadData<NPC[]>('npcs.json');

      if (charactersData) {
        charactersData.forEach(char => {
          // Data migration: handle old format where concepts was a single string
          if (typeof (char as unknown as { concepts: string | string[] }).concepts === 'string') {
            char.concepts = [(char as unknown as { concepts: string }).concepts];
            logger.info(`Migrated character ${char.name} from old concept format`);
          }
          // Ensure concepts is always an array
          if (!Array.isArray(char.concepts)) {
            char.concepts = [];
          }
          this.characters.set(char.id, char);
        });
        logger.info(`Loaded ${this.characters.size} characters`);
      }

      if (npcsData) {
        npcsData.forEach(npc => {
          this.npcs.set(npc.id, npc);
        });
        logger.info(`Loaded ${this.npcs.size} NPCs`);
      }
    } catch (error) {
      logger.error('Failed to load character data:', error);
    }
  }

  /**
   * Save characters to storage
   */
  private async saveCharacters(): Promise<void> {
    try {
      const charactersArray = Array.from(this.characters.values());
      await this.dataManager.saveData('characters.json', charactersArray);
    } catch (error) {
      logger.error('Failed to save characters:', error);
    }
  }

  /**
   * Save NPCs to storage
   */
  private async saveNPCs(): Promise<void> {
    try {
      const npcsArray = Array.from(this.npcs.values());
      await this.dataManager.saveData('npcs.json', npcsArray);
    } catch (error) {
      logger.error('Failed to save NPCs:', error);
    }
  }

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
      attributes?: Partial<DuneCharacter['attributes']>;
      skills?: DuneSkill[];
      drives?: DuneDrive[];
      assets?: DuneAsset[];
      talents?: string[];
    } = {}
  ): Promise<DuneCharacter> {
    // Check if user already has 3 characters (maximum allowed)
    const userCharacters = this.getUserCharacters(userId, guildId);
    if (userCharacters.length >= 3) {
      throw new Error('You already have 3 characters (maximum allowed). Use `/sheet delete` to remove one before creating a new character.');
    }

    const character: DuneCharacter = {
      id: `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      guildId,
      name,
      concepts,
      house: options.house,
      homeworld: options.homeworld,
      
      attributes: {
        muscle: options.attributes?.muscle || 8,
        move: options.attributes?.move || 8,
        intellect: options.attributes?.intellect || 8,
        awareness: options.attributes?.awareness || 8,
        communication: options.attributes?.communication || 8,
        discipline: options.attributes?.discipline || 8,
        ...options.attributes
      },

      skills: options.skills || this.getDefaultSkills(),
      drives: options.drives || [],
      assets: options.assets || [],
      traits: [],

      determination: 3,
      maxDetermination: 3,

      experience: {
        total: 0,
        spent: 0,
        available: 0
      },

      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      isActive: true
    };

    this.characters.set(character.id, character);
    await this.saveCharacters();

    logger.info(`Created character "${name}" for user ${userId}`);
    return character;
  }

  /**
   * Get default skills for new characters
   */
  private getDefaultSkills(): DuneSkill[] {
    return [
      { name: 'Battle', value: 0 },
      { name: 'Communicate', value: 0 },
      { name: 'Discipline', value: 0 },
      { name: 'Move', value: 0 },
      { name: 'Understand', value: 0 }
    ];
  }

  /**
   * Update character
   */
  async updateCharacter(
    characterId: string,
    updates: Partial<DuneCharacter>
  ): Promise<DuneCharacter> {
    const character = this.characters.get(characterId);
    if (!character) {
      throw new Error('Character not found');
    }

    // Merge updates
    Object.assign(character, updates, {
      lastUpdated: new Date().toISOString()
    });

    await this.saveCharacters();
    return character;
  }

  /**
   * Add skill to character
   */
  async addSkill(
    characterId: string,
    skillName: string,
    value: number,
    focus?: string[]
  ): Promise<DuneCharacter> {
    const character = this.characters.get(characterId);
    if (!character) {
      throw new Error('Character not found');
    }

    const existingSkillIndex = character.skills.findIndex(s => s.name === skillName);
    if (existingSkillIndex >= 0) {
      character.skills[existingSkillIndex] = { name: skillName, value, focus };
    } else {
      character.skills.push({ name: skillName, value, focus });
    }

    character.lastUpdated = new Date().toISOString();
    await this.saveCharacters();
    return character;
  }

  /**
   * Add drive to character
   */
  async addDrive(
    characterId: string,
    name: string,
    statement: string,
    value: number
  ): Promise<DuneCharacter> {
    const character = this.characters.get(characterId);
    if (!character) {
      throw new Error('Character not found');
    }

    character.drives.push({ name, statement, value });
    character.lastUpdated = new Date().toISOString();
    await this.saveCharacters();
    return character;
  }

  /**
   * Add asset to character
   */
  async addAsset(
    characterId: string,
    asset: DuneAsset
  ): Promise<DuneCharacter> {
    const character = this.characters.get(characterId);
    if (!character) {
      throw new Error('Character not found');
    }

    character.assets.push(asset);
    character.lastUpdated = new Date().toISOString();
    await this.saveCharacters();
    return character;
  }

  /**
   * Get user's active character
   */
  getUserActiveCharacter(userId: string, guildId: string): DuneCharacter | undefined {
    for (const character of this.characters.values()) {
      if (character.userId === userId && character.guildId === guildId && character.isActive) {
        return character;
      }
    }
    return undefined;
  }

  /**
   * Get all characters for a user in a guild
   */
  getUserCharacters(userId: string, guildId: string): DuneCharacter[] {
    const userCharacters: DuneCharacter[] = [];
    for (const character of this.characters.values()) {
      if (character.userId === userId && character.guildId === guildId) {
        userCharacters.push(character);
      }
    }
    return userCharacters;
  }

  /**
   * Get character by ID
   */
  getCharacter(characterId: string): DuneCharacter | undefined {
    return this.characters.get(characterId);
  }

  /**
   * Delete character
   */
  async deleteCharacter(characterId: string, userId: string): Promise<boolean> {
    const character = this.characters.get(characterId);
    if (!character) {
      return false;
    }

    if (character.userId !== userId) {
      throw new Error('You can only delete your own characters');
    }

    this.characters.delete(characterId);
    await this.saveCharacters();
    logger.info(`Deleted character "${character.name}" for user ${userId}`);
    return true;
  }

  /**
   * Create NPC
   */
  async createNPC(
    name: string,
    guildId: string,
    concepts: string[],
    description: string,
    createdBy: string,
    options: {
      tier?: 'minion' | 'toughened' | 'nemesis';
      attributes?: Partial<DuneCharacter['attributes']>;
      skills?: DuneSkill[];
      assets?: DuneAsset[];
      traits?: DuneTrait[];
    } = {}
  ): Promise<NPC> {
    const npc: NPC = {
      id: `npc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      guildId,
      concepts,
      description,
      tier: options.tier,
      attributes: options.attributes,
      skills: options.skills,
      assets: options.assets,
      traits: options.traits,
      createdBy,
      createdAt: new Date().toISOString()
    };

    this.npcs.set(npc.id, npc);
    await this.saveNPCs();

    logger.info(`Created NPC "${name}" by user ${createdBy}`);
    return npc;
  }

  /**
   * Update NPC
   */
  async updateNPC(
    npcId: string,
    field: string,
    value: string,
    updatedBy: string
  ): Promise<NPC> {
    const npc = this.npcs.get(npcId);
    if (!npc) {
      throw new Error('NPC not found');
    }

    // Create updated NPC object
    const updatedNPC = { ...npc };
    
    switch (field) {
      case 'name':
        updatedNPC.name = value;
        break;
      case 'concept':
        updatedNPC.concepts = [value]; // Replace with single concept for simplicity
        break;
      case 'description':
        updatedNPC.description = value;
        break;
      case 'tier':
        updatedNPC.tier = value.toLowerCase() as 'minion' | 'toughened' | 'nemesis';
        break;
      default:
        throw new Error(`Unknown field: ${field}`);
    }

    this.npcs.set(npcId, updatedNPC);
    await this.saveNPCs();

    logger.info(`Updated NPC "${npc.name}" field "${field}" by user ${updatedBy}`);
    return updatedNPC;
  }

  /**
   * Delete NPC
   */
  async deleteNPC(npcId: string, deletedBy: string): Promise<boolean> {
    const npc = this.npcs.get(npcId);
    if (!npc) {
      throw new Error('NPC not found');
    }

    // Remove from memory
    this.npcs.delete(npcId);
    
    // Save to persist the deletion
    await this.saveNPCs();

    logger.info(`Deleted NPC "${npc.name}" by user ${deletedBy}`);
    return true;
  }

  /**
   * Update determination for character
   */
  async updateDetermination(
    characterId: string,
    change: number
  ): Promise<DuneCharacter> {
    const character = this.characters.get(characterId);
    if (!character) {
      throw new Error('Character not found');
    }

    character.determination = Math.max(0, Math.min(character.maxDetermination, character.determination + change));
    character.lastUpdated = new Date().toISOString();
    await this.saveCharacters();
    return character;
  }

  /**
   * Get NPC by name within a guild
   */
  async getNPCByName(name: string, guildId: string): Promise<NPC | null> {
    // First check in-memory cache
    const memoryNpc = Array.from(this.npcs.values()).find(
      npc => npc.name.toLowerCase() === name.toLowerCase() && npc.guildId === guildId
    );
    if (memoryNpc) return memoryNpc;

    // Fallback to file-based lookup
    const npcs = await this.getGuildNPCs(guildId);
    return npcs.find(npc => npc.name.toLowerCase() === name.toLowerCase()) || null;
  }

  /**
   * Get all NPCs for a guild
   */
  async getGuildNPCs(guildId: string): Promise<NPC[]> {
    // First return from in-memory cache
    const memoryNpcs = Array.from(this.npcs.values()).filter(npc => npc.guildId === guildId);
    if (memoryNpcs.length > 0) return memoryNpcs;

    // Fallback to file-based lookup
    const data = await this.dataManager.loadData<{npcs: NPC[]}>(`npcs_${guildId}.json`);
    return data?.npcs || [];
  }

  /**
   * Search for assets across all characters and NPCs in a guild
   */
  async searchAssets(query: string, guildId: string): Promise<Array<{ name: string; type: string; description: string; source: string }>> {
    const results: Array<{ name: string; type: string; description: string; source: string }> = [];
    const lowerQuery = query.toLowerCase();

    // Define comprehensive asset list
    const assetCategories = {
      equipment: [
        { label: 'Crysknife', value: 'crysknife', description: 'Sacred Fremen blade made from sandworm tooth' },
        { label: 'Lasgun', value: 'lasgun', description: 'Energy weapon with variable settings' },
        { label: 'Personal Shield', value: 'personal_shield', description: 'Holtzman energy barrier' },
        { label: 'Stillsuit', value: 'stillsuit', description: 'Water-recycling desert survival gear' },
        { label: 'Maula Pistol', value: 'maula_pistol', description: 'Spring-loaded dart weapon' },
        { label: 'Hunter-Seeker', value: 'hunter_seeker', description: 'Assassination device' },
        { label: 'Thumper', value: 'thumper', description: 'Device to attract sandworms' },
        { label: 'Paracompass', value: 'paracompass', description: 'Navigation device for desert travel' }
      ],
      vehicles: [
        { label: 'Ornithopter', value: 'ornithopter', description: 'Flapping-wing aircraft' },
        { label: 'Groundcar', value: 'groundcar', description: 'Surface transportation vehicle' },
        { label: 'Frigate', value: 'frigate', description: 'Interplanetary spacecraft' },
        { label: 'Carryall', value: 'carryall', description: 'Heavy-lift transport aircraft' },
        { label: 'Sandcrawler', value: 'sandcrawler', description: 'Desert exploration vehicle' },
        { label: 'Guild Heighliner', value: 'heighliner_passage', description: 'Passage aboard spacing guild ship' }
      ],
      property: [
        { label: 'Safe House', value: 'safe_house', description: 'Secure hideout or residence' },
        { label: 'Spice Cache', value: 'spice_cache', description: 'Hidden melange storage' },
        { label: 'Water Reserve', value: 'water_reserve', description: 'Precious water storage facility' },
        { label: 'Trading Post', value: 'trading_post', description: 'Commercial establishment' },
        { label: 'Sietch Access', value: 'sietch_access', description: 'Entry rights to Fremen community' },
        { label: 'Noble Estate', value: 'noble_estate', description: 'Hereditary land holdings' }
      ],
      connections: [
        { label: 'Smuggler Contact', value: 'smuggler_contact', description: 'Connection to black market operations' },
        { label: 'Guild Navigator', value: 'guild_navigator', description: 'Relationship with spacing guild' },
        { label: 'Bene Gesserit Sister', value: 'bene_gesserit_sister', description: 'Contact within the sisterhood' },
        { label: 'Mentat Advisor', value: 'mentat_advisor', description: 'Human computer consultant' },
        { label: 'Fremen Guide', value: 'fremen_guide', description: 'Desert survival expert' },
        { label: 'House Spy Network', value: 'house_spy_network', description: 'Intelligence gathering contacts' },
        { label: 'Suk Doctor', value: 'suk_doctor', description: 'Imperial conditioning physician' }
      ],
      information: [
        { label: 'Spice Route Maps', value: 'spice_route_maps', description: 'Secret harvesting locations' },
        { label: 'House Secrets', value: 'house_secrets', description: 'Compromising noble information' },
        { label: 'Fremen Prophecies', value: 'fremen_prophecies', description: 'Desert folk predictions' },
        { label: 'Guild Schedules', value: 'guild_schedules', description: 'Spacing guild travel times' },
        { label: 'Imperial Codes', value: 'imperial_codes', description: 'Government communication ciphers' },
        { label: 'Sandworm Patterns', value: 'sandworm_patterns', description: 'Creature behavior data' }
      ],
      wealth: [
        { label: 'Spice Hoard', value: 'spice_hoard', description: 'Valuable melange stockpile' },
        { label: 'Solari Reserve', value: 'solari_reserve', description: 'Imperial currency savings' },
        { label: 'Precious Artifacts', value: 'precious_artifacts', description: 'Valuable historical items' },
        { label: 'Trade Monopoly', value: 'trade_monopoly', description: 'Exclusive commercial rights' },
        { label: 'Water Debt Claims', value: 'water_debt_claims', description: 'Owed water from others' },
        { label: 'Noble Stipend', value: 'noble_stipend', description: 'Regular house allowance' }
      ]
    };

    // Search through all asset categories
    for (const [categoryName, assets] of Object.entries(assetCategories)) {
      for (const asset of assets) {
        if (asset.label.toLowerCase().includes(lowerQuery) || 
            asset.description.toLowerCase().includes(lowerQuery)) {
          results.push({
            name: asset.label,
            type: categoryName,
            description: asset.description,
            source: 'Core Rules'
          });
        }
      }
    }

    // Also search character assets from in-memory cache
    for (const character of this.characters.values()) {
      if (character.guildId === guildId) {
        character.assets?.forEach(asset => {
          if (asset.name.toLowerCase().includes(lowerQuery) || 
              asset.description.toLowerCase().includes(lowerQuery)) {
            results.push({
              name: asset.name,
              type: asset.type,
              description: asset.description,
              source: `Character: ${character.name}`
            });
          }
        });
      }
    }

    // Search NPC assets from in-memory cache
    for (const npc of this.npcs.values()) {
      if (npc.guildId === guildId && npc.assets) {
        npc.assets.forEach(asset => {
          if (asset.name.toLowerCase().includes(lowerQuery) || 
              asset.description.toLowerCase().includes(lowerQuery)) {
            results.push({
              name: asset.name,
              type: asset.type,
              description: asset.description,
              source: `NPC: ${npc.name}`
            });
          }
        });
      }
    }

    return results.slice(0, 10); // Limit to 10 results
  }

  /**
   * Get all characters for a guild
   */
  async getGuildCharacters(guildId: string): Promise<DuneCharacter[]> {
    // First return from in-memory cache
    const memoryCharacters = Array.from(this.characters.values()).filter(char => char.guildId === guildId);
    if (memoryCharacters.length > 0) return memoryCharacters;

    // Fallback to file-based lookup
    const data = await this.dataManager.loadData<{characters: DuneCharacter[]}>(`characters_${guildId}.json`);
    return data?.characters || [];
  }

  // Point-buy system constants
  static readonly SKILL_POINT_VALUES = [9, 7, 6, 5, 4];
  static readonly DRIVE_POINT_VALUES = [8, 7, 6, 5, 4];
  static readonly DUNE_SKILLS = ['Battle', 'Communicate', 'Discipline', 'Move', 'Understand'];
  static readonly DUNE_DRIVES = ['Duty', 'Faith', 'Justice', 'Power', 'Truth'];

  /**
   * Validate skill point-buy assignments
   */
  validateSkillAssignments(skills: { [skill: string]: number }): { valid: boolean; error?: string } {
    const assignedValues = Object.values(skills).sort((a, b) => b - a);
    const expectedValues = [...CharacterManager.SKILL_POINT_VALUES].sort((a, b) => b - a);

    if (assignedValues.length !== CharacterManager.DUNE_SKILLS.length) {
      return { valid: false, error: `❌ **Missing Skills** - You must assign values to all 5 skills: ${CharacterManager.DUNE_SKILLS.join(', ')}` };
    }

    if (JSON.stringify(assignedValues) !== JSON.stringify(expectedValues)) {
      return { valid: false, error: `❌ **Invalid Point Values** - You must use each value exactly once: ${CharacterManager.SKILL_POINT_VALUES.join(', ')}\n\n**You used:** ${assignedValues.join(', ')}\n**Required:** ${expectedValues.join(', ')}` };
    }

    for (const [skill] of Object.entries(skills)) {
      if (!CharacterManager.DUNE_SKILLS.includes(skill)) {
        return { valid: false, error: `❌ **Invalid Skill Name: "${skill}"**\n\n**Valid skills:** ${CharacterManager.DUNE_SKILLS.join(', ')}` };
      }
    }

    return { valid: true };
  }

  /**
   * Validate drive point-buy assignments
   */
  validateDriveAssignments(drives: { [drive: string]: number }): { valid: boolean; error?: string } {
    const assignedValues = Object.values(drives).sort((a, b) => b - a);
    const expectedValues = [...CharacterManager.DRIVE_POINT_VALUES].sort((a, b) => b - a);

    if (assignedValues.length !== CharacterManager.DUNE_DRIVES.length) {
      return { valid: false, error: `❌ **Missing Drives** - You must assign values to all 5 drives: ${CharacterManager.DUNE_DRIVES.join(', ')}` };
    }

    if (JSON.stringify(assignedValues) !== JSON.stringify(expectedValues)) {
      return { valid: false, error: `❌ **Invalid Point Values** - You must use each value exactly once: ${CharacterManager.DRIVE_POINT_VALUES.join(', ')}\n\n**You used:** ${assignedValues.join(', ')}\n**Required:** ${expectedValues.join(', ')}` };
    }

    for (const [drive] of Object.entries(drives)) {
      if (!CharacterManager.DUNE_DRIVES.includes(drive)) {
        return { valid: false, error: `❌ **Invalid Drive Name: "${drive}"**\n\n**Valid drives:** ${CharacterManager.DUNE_DRIVES.join(', ')}` };
      }
    }

    return { valid: true };
  }

  /**
   * Set character skills using point-buy system
   */
  async setSkillsPointBuy(
    characterId: string,
    skillAssignments: { [skill: string]: number }
  ): Promise<DuneCharacter> {
    const character = this.getCharacter(characterId);
    if (!character) {
      throw new Error('Character not found');
    }

    const validation = this.validateSkillAssignments(skillAssignments);
    if (!validation.valid) {
      throw new Error(validation.error!);
    }

    // Update character skills
    character.skills = CharacterManager.DUNE_SKILLS.map(skillName => ({
      name: skillName,
      value: skillAssignments[skillName],
      focus: character.skills.find(s => s.name === skillName)?.focus || []
    }));

    character.lastUpdated = new Date().toISOString();
    await this.saveCharacters();
    return character;
  }

  /**
   * Set character drives using point-buy system
   */
  async setDrivesPointBuy(
    characterId: string,
    driveAssignments: { [drive: string]: number },
    driveStatements: { [drive: string]: string }
  ): Promise<DuneCharacter> {
    const character = this.getCharacter(characterId);
    if (!character) {
      throw new Error('Character not found');
    }

    const validation = this.validateDriveAssignments(driveAssignments);
    if (!validation.valid) {
      throw new Error(validation.error!);
    }

    // Update character drives
    character.drives = CharacterManager.DUNE_DRIVES.map(driveName => ({
      name: driveName,
      value: driveAssignments[driveName],
      statement: driveStatements[driveName] || `${driveName} drives me`
    }));

    character.lastUpdated = new Date().toISOString();
    await this.saveCharacters();
    return character;
  }

  /**
   * Set character avatar
   */
  async setCharacterAvatar(
    characterId: string,
    avatarUrl: string,
    userId: string
  ): Promise<DuneCharacter> {
    const character = this.getCharacter(characterId);
    if (!character) {
      throw new Error('Character not found');
    }

    // Verify ownership
    if (character.userId !== userId) {
      throw new Error('You can only set avatars for your own characters');
    }

    character.avatar = avatarUrl;
    character.lastUpdated = new Date().toISOString();
    await this.saveCharacters();

    logger.info(`Set avatar for character "${character.name}" (${characterId})`);
    return character;
  }

  /**
   * Remove character avatar
   */
  async removeCharacterAvatar(
    characterId: string,
    userId: string
  ): Promise<DuneCharacter> {
    const character = this.getCharacter(characterId);
    if (!character) {
      throw new Error('Character not found');
    }

    // Verify ownership
    if (character.userId !== userId) {
      throw new Error('You can only remove avatars from your own characters');
    }

    delete character.avatar;
    character.lastUpdated = new Date().toISOString();
    await this.saveCharacters();

    logger.info(`Removed avatar for character "${character.name}" (${characterId})`);
    return character;
  }

  /**
   * Set NPC avatar
   */
  async setNPCAvatar(
    npcId: string,
    avatarUrl: string,
    userId: string
  ): Promise<NPC> {
    const npc = this.npcs.get(npcId);
    if (!npc) {
      throw new Error('NPC not found');
    }

    // Verify ownership
    if (npc.createdBy !== userId) {
      throw new Error('You can only set avatars for NPCs you created');
    }

    npc.avatar = avatarUrl;
    await this.saveNPCs();

    logger.info(`Set avatar for NPC "${npc.name}" (${npcId})`);
    return npc;
  }

  /**
   * Remove NPC avatar
   */
  async removeNPCAvatar(
    npcId: string,
    userId: string
  ): Promise<NPC> {
    const npc = this.npcs.get(npcId);
    if (!npc) {
      throw new Error('NPC not found');
    }

    // Verify ownership
    if (npc.createdBy !== userId) {
      throw new Error('You can only remove avatars from NPCs you created');
    }

    delete npc.avatar;
    await this.saveNPCs();

    logger.info(`Removed avatar for NPC "${npc.name}" (${npcId})`);
    return npc;
  }

  /**
   * Get avatar URL for character or NPC, with fallback to user avatar
   */
  getAvatarUrl(character: DuneCharacter | NPC, userAvatarUrl: string): string {
    return character.avatar || userAvatarUrl;
  }

  /**
   * Validate image URL format and type
   */
  validateImageUrl(url: string): { valid: boolean; error?: string } {
    try {
      const parsedUrl = new URL(url);
      
      // Check for supported image extensions
      const supportedExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
      const hasValidExtension = supportedExtensions.some(ext => 
        parsedUrl.pathname.toLowerCase().endsWith(ext)
      );
      
      if (!hasValidExtension) {
        return {
          valid: false,
          error: 'Image must be in PNG, JPG, JPEG, WebP, or GIF format'
        };
      }
      
      // Check for HTTPS (Discord requires secure URLs)
      if (parsedUrl.protocol !== 'https:') {
        return {
          valid: false,
          error: 'Image URL must use HTTPS protocol'
        };
      }
      
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid URL format'
      };
    }
  }
}

// Export singleton instance
export const characterManager = new CharacterManager();
