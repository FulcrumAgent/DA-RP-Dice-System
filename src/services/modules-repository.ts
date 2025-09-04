/**
 * Module Repository Layer
 * Provides CRUD operations for module data with caching
 */

import { PrismaClient } from '@prisma/client';
import { 
  ModuleManifest, 
  Scene, 
  NPC, 
  Handout, 
  RollTable, 
  CampaignState, 
  ProgressTrack 
} from '../types/module-types';
import { moduleLogger } from '../utils/module-logger';
// Using a simple Map for caching - can be upgraded to LRU later
type Cache<T> = Map<string, { data: T; expiry: number }>;

class SimpleCache<T> {
  private cache = new Map<string, { data: T; expiry: number }>();
  
  constructor(private ttl: number) {}
  
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.data;
  }
  
  set(key: string, value: T): void {
    this.cache.set(key, { data: value, expiry: Date.now() + this.ttl });
  }
  
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
}

// In-memory LRU cache for frequently accessed data
interface CacheConfig {
  modules: SimpleCache<ModuleManifest>;
  scenes: SimpleCache<Scene[]>;
  npcs: SimpleCache<NPC[]>;
  handouts: SimpleCache<Handout[]>;
  tables: SimpleCache<RollTable[]>;
  campaigns: SimpleCache<CampaignState>;
}

export class ModulesRepository {
  private cache: CacheConfig;
  
  constructor(private prisma: PrismaClient) {
    // Initialize simple caches
    this.cache = {
      modules: new SimpleCache<ModuleManifest>(1000 * 60 * 15), // 15 min
      scenes: new SimpleCache<Scene[]>(1000 * 60 * 10), // 10 min
      npcs: new SimpleCache<NPC[]>(1000 * 60 * 10),
      handouts: new SimpleCache<Handout[]>(1000 * 60 * 10),
      tables: new SimpleCache<RollTable[]>(1000 * 60 * 10),
      campaigns: new SimpleCache<CampaignState>(1000 * 60 * 5) // 5 min
    };
  }

  // Module Operations
  async getModuleBySlug(slug: string): Promise<ModuleManifest | null> {
    const cacheKey = `module:${slug}`;
    const cached = this.cache.modules.get(cacheKey);
    
    if (cached) {
      moduleLogger.debug({ slug, source: 'cache' }, 'Retrieved module from cache');
      return cached;
    }

    try {
      const result = await this.prisma.$queryRaw`
        SELECT 
          id, slug, title, authors, version, license, source_url as "sourceUrl",
          content_warnings as "contentWarnings", tags, recommended_level as "recommendedLevel",
          estimated_sessions as "estimatedSessions", created_at as "createdAt", 
          updated_at as "updatedAt"
        FROM modules 
        WHERE slug = ${slug}
      ` as ModuleManifest[];

      const module = result[0] || null;
      if (module) {
        this.cache.modules.set(cacheKey, module);
        moduleLogger.debug({ slug, source: 'database' }, 'Retrieved module from database');
      }
      
      return module;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      moduleLogger.error({ slug, error: errorMessage }, 'Failed to get module');
      throw error;
    }
  }

  async getAllModules(): Promise<ModuleManifest[]> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT 
          id, slug, title, authors, version, license, source_url as "sourceUrl",
          content_warnings as "contentWarnings", tags, recommended_level as "recommendedLevel",
          estimated_sessions as "estimatedSessions", created_at as "createdAt", 
          updated_at as "updatedAt"
        FROM modules 
        ORDER BY title
      ` as ModuleManifest[];

      moduleLogger.debug({ count: result.length }, 'Retrieved all modules');
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      moduleLogger.error({ error: errorMessage }, 'Failed to get all modules');
      throw error;
    }
  }

  // Scene Operations
  async getModuleScenes(moduleId: string): Promise<Scene[]> {
    const cacheKey = `scenes:${moduleId}`;
    const cached = this.cache.scenes.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const result = await this.prisma.$queryRaw`
        SELECT 
          id, module_id as "moduleId", act, order_num as "order", title,
          gm_notes as "gmNotes", read_aloud as "readAloud", checks, npcs, handouts, tables,
          next_scene_id as "nextSceneId", choices, safety_flags as "safetyFlags"
        FROM module_scenes 
        WHERE module_id = ${moduleId}::uuid
        ORDER BY act, order_num
      ` as Scene[];

      this.cache.scenes.set(cacheKey, result);
      moduleLogger.debug({ moduleId, count: result.length }, 'Retrieved module scenes');
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      moduleLogger.error({ moduleId, error: errorMessage }, 'Failed to get module scenes');
      throw error;
    }
  }

  async getSceneById(sceneId: string): Promise<Scene | null> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT 
          id, module_id as "moduleId", act, order_num as "order", title,
          gm_notes as "gmNotes", read_aloud as "readAloud", checks, npcs, handouts, tables,
          next_scene_id as "nextSceneId", choices, safety_flags as "safetyFlags"
        FROM module_scenes 
        WHERE id = ${sceneId}::uuid
      ` as Scene[];

      return result[0] || null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      moduleLogger.error({ sceneId, error: errorMessage }, 'Failed to get scene');
      throw error;
    }
  }

  // Handout Operations
  async getModuleHandouts(moduleId: string): Promise<Handout[]> {
    const cacheKey = `handouts:${moduleId}`;
    const cached = this.cache.handouts.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const result = await this.prisma.$queryRaw`
        SELECT 
          id, module_id as "moduleId", name, description, gm_notes as "gmNotes"
        FROM module_handouts 
        WHERE module_id = ${moduleId}::uuid
        ORDER BY name
      ` as Handout[];

      this.cache.handouts.set(cacheKey, result);
      moduleLogger.debug({ moduleId, count: result.length }, 'Retrieved module handouts');
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      moduleLogger.error({ moduleId, error: errorMessage }, 'Failed to get module handouts');
      throw error;
    }
  }

  async getHandoutById(handoutId: string): Promise<Handout | null> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT 
          id, module_id as "moduleId", name, description, gm_notes as "gmNotes"
        FROM module_handouts 
        WHERE id = ${handoutId}::uuid
      ` as Handout[];

      return result[0] || null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      moduleLogger.error({ handoutId, error: errorMessage }, 'Failed to get handout');
      throw error;
    }
  }

  // NPC Operations
  async getModuleNPCs(moduleId: string): Promise<NPC[]> {
    const cacheKey = `npcs:${moduleId}`;
    const cached = this.cache.npcs.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const result = await this.prisma.$queryRaw`
        SELECT 
          id, module_id as "moduleId", name, role, traits, motivation, bonds, 
          secrets, stat_block as "statBlock", gm_only as "gmOnly"
        FROM module_npcs 
        WHERE module_id = ${moduleId}::uuid
        ORDER BY name
      ` as NPC[];

      this.cache.npcs.set(cacheKey, result);
      moduleLogger.debug({ moduleId, count: result.length }, 'Retrieved module NPCs');
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      moduleLogger.error({ moduleId, error: errorMessage }, 'Failed to get module NPCs');
      throw error;
    }
  }

  async getNPCByName(moduleId: string, name: string): Promise<NPC | null> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT 
          id, module_id as "moduleId", name, role, traits, motivation, bonds, 
          secrets, stat_block as "statBlock", gm_only as "gmOnly"
        FROM module_npcs 
        WHERE module_id = ${moduleId}::uuid AND LOWER(name) = LOWER(${name})
      ` as NPC[];

      return result[0] || null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      moduleLogger.error({ moduleId, name, error: errorMessage }, 'Failed to get NPC by name');
      throw error;
    }
  }

  // Campaign State Operations
  async getCampaignState(channelId: string): Promise<CampaignState | null> {
    const cacheKey = `campaign:${channelId}`;
    const cached = this.cache.campaigns.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const result = await this.prisma.$queryRaw`
        SELECT 
          channel_id as "channelId", current_module_id as "currentModuleId",
          current_scene_id as "currentSceneId", progress_tracks as "progressTracks",
          gm_notes as "gmNotes", loaded_at as "loadedAt", 
          last_advanced_at as "lastAdvancedAt"
        FROM campaign_states 
        WHERE channel_id = ${channelId}
      ` as CampaignState[];

      const state = result[0] || null;
      if (state) {
        this.cache.campaigns.set(cacheKey, state);
      }
      
      return state;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      moduleLogger.error({ channelId, error: errorMessage }, 'Failed to get campaign state');
      throw error;
    }
  }

  async createOrUpdateCampaignState(state: CampaignState): Promise<void> {
    const cacheKey = `campaign:${state.channelId}`;
    
    try {
      await this.prisma.$executeRaw`
        INSERT INTO campaign_states 
        (channel_id, current_module_id, current_scene_id, progress_tracks, gm_notes, loaded_at, last_advanced_at)
        VALUES (${state.channelId}, ${state.currentModuleId}::uuid, 
                ${state.currentSceneId}::uuid, ${JSON.stringify(state.progressTracks)}::jsonb,
                ${JSON.stringify(state.gmNotes)}::jsonb, ${state.loadedAt}, ${state.lastAdvancedAt})
        ON CONFLICT (channel_id) 
        DO UPDATE SET 
          current_module_id = EXCLUDED.current_module_id,
          current_scene_id = EXCLUDED.current_scene_id,
          progress_tracks = EXCLUDED.progress_tracks,
          gm_notes = EXCLUDED.gm_notes,
          loaded_at = EXCLUDED.loaded_at,
          last_advanced_at = EXCLUDED.last_advanced_at
      `;

      // Update cache
      this.cache.campaigns.set(cacheKey, state);
      
      moduleLogger.debug({ 
        channelId: state.channelId, 
        currentModuleId: state.currentModuleId 
      }, 'Updated campaign state');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      moduleLogger.error({ 
        channelId: state.channelId, 
        error: errorMessage 
      }, 'Failed to update campaign state');
      throw error;
    }
  }

  // Cache invalidation
  invalidateModuleCache(moduleId: string): void {
    this.cache.scenes.delete(`scenes:${moduleId}`);
    this.cache.npcs.delete(`npcs:${moduleId}`);
    this.cache.handouts.delete(`handouts:${moduleId}`);
    this.cache.tables.delete(`tables:${moduleId}`);
    
    moduleLogger.debug({ moduleId }, 'Invalidated module cache');
  }

  clearAllCaches(): void {
    this.cache.modules.clear();
    this.cache.scenes.clear();
    this.cache.npcs.clear();
    this.cache.handouts.clear();
    this.cache.tables.clear();
    this.cache.campaigns.clear();
    
    moduleLogger.debug({}, 'Cleared all caches');
  }
}
