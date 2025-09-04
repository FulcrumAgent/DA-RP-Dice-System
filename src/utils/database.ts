/**
 * Database utilities for persistent data storage
 */

import fs from 'fs/promises';
import path from 'path';
import { logger } from './logger';
import { config } from '../config';

export interface MomentumPool {
  channelId: string;
  momentum: number;
  threat: number;
  lastUpdated: string;
}

export interface IDataManager {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown, ttlSeconds?: number): Promise<boolean>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
  
  // Add index signature for dynamic property access
  [key: string]: unknown;
}

export class DataManager {
  private dataDir: string;

  constructor() {
    this.dataDir = config.getConfig().dataDir;
    this.ensureDataDir();
  }

  /**
   * Ensure data directory exists
   */
  private async ensureDataDir(): Promise<void> {
    try {
      await fs.access(this.dataDir);
    } catch {
      await fs.mkdir(this.dataDir, { recursive: true });
      logger.info(`Created data directory: ${this.dataDir}`);
    }
  }

  /**
   * Load data from JSON file
   */
  private async loadJson<T>(filename: string): Promise<T | null> {
    const filepath = path.join(this.dataDir, filename);
    
    try {
      const data = await fs.readFile(filepath, 'utf-8');
      return JSON.parse(data) as T;
    } catch (error) {
      if ((error as { code?: string }).code !== 'ENOENT') {
        logger.error(`Error loading ${filename}:`, error);
      }
      return null;
    }
  }

  /**
   * Save data to JSON file
   */
  private async saveJson<T>(filename: string, data: T): Promise<void> {
    const filepath = path.join(this.dataDir, filename);
    
    try {
      await this.ensureDataDir();
      await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      logger.error(`Error saving ${filename}:`, error);
      throw error;
    }
  }

  /**
   * Public method to load data from JSON file
   */
  async loadData<T>(filename: string): Promise<T | null> {
    return await this.loadJson<T>(filename);
  }

  /**
   * Public method to save data to JSON file
   */
  async saveData<T>(filename: string, data: T): Promise<void> {
    await this.saveJson(filename, data);
  }

  /**
   * Get momentum pool for a specific channel
   */
  async getMomentumPool(channelId: string): Promise<MomentumPool> {
    const pools = await this.loadJson<Record<string, MomentumPool>>('momentum_pools.json') || {};
    
    if (pools[channelId]) {
      return pools[channelId];
    }

    // Create new pool
    return {
      channelId,
      momentum: 0,
      threat: 0,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Save momentum pool data
   */
  async saveMomentumPool(pool: MomentumPool): Promise<void> {
    const pools = await this.loadJson<Record<string, MomentumPool>>('momentum_pools.json') || {};
    
    pool.lastUpdated = new Date().toISOString();
    pools[pool.channelId] = pool;
    
    await this.saveJson('momentum_pools.json', pools);
  }

  /**
   * Update momentum and threat values
   */
  async updateMomentum(
    channelId: string, 
    momentumChange: number = 0, 
    threatChange: number = 0
  ): Promise<MomentumPool> {
    const pool = await this.getMomentumPool(channelId);
    
    pool.momentum = Math.max(0, pool.momentum + momentumChange);
    pool.threat = Math.max(0, pool.threat + threatChange);
    
    await this.saveMomentumPool(pool);
    return pool;
  }

  /**
   * Reset momentum pool to zero
   */
  async resetMomentumPool(channelId: string): Promise<MomentumPool> {
    const pool: MomentumPool = {
      channelId,
      momentum: 0,
      threat: 0,
      lastUpdated: new Date().toISOString()
    };
    
    await this.saveMomentumPool(pool);
    return pool;
  }

  /**
   * Get all momentum pools
   */
  async getAllMomentumPools(): Promise<Record<string, MomentumPool>> {
    const pools = await this.loadJson<Record<string, MomentumPool>>('momentum_pools.json') || {};
    return pools;
  }

  /**
  }

  /**
   * Save bot settings/configuration
   */
  async saveBotSettings(settings: Record<string, unknown>): Promise<void> {
    await this.saveJson('bot_settings.json', settings);
  }

  /**
   * Load bot settings
   */
  async loadBotSettings(): Promise<Record<string, unknown>> {
    const settings = await this.loadJson<Record<string, unknown>>('bot_settings.json') || {};
    return settings;
  }
}
