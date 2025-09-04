/**
 * Configuration management for the Dune Discord Bot
 */

import dotenv from 'dotenv';
import { GatewayIntentBits } from 'discord.js';

// Load environment variables
dotenv.config();

export interface BotConfig {
  // Discord Settings
  discordToken: string;
  guildId?: string;
  clientId: string;
  
  // Extra-Life Settings

  
  // Bot Settings
  debugMode: boolean;
  logLevel: string;
  dataDir: string;
  
  // Discord.js Configuration
  intents: GatewayIntentBits[];
}

class ConfigManager {
  private static instance: ConfigManager;
  private config: BotConfig;

  private constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private loadConfig(): BotConfig {
    return {
      // Discord Settings
      discordToken: process.env.DISCORD_TOKEN || '',
      guildId: process.env.GUILD_ID,
      clientId: process.env.CLIENT_ID || '',
      
      // Extra-Life Settings

      
      // Bot Settings
      debugMode: process.env.DEBUG_MODE?.toLowerCase() === 'true',
      logLevel: process.env.LOG_LEVEL || 'info',
      dataDir: process.env.DATA_DIR || 'data',
      
      // Discord.js Configuration
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    };
  }

  private validateConfig(): void {
    if (!this.config.discordToken) {
      throw new Error('DISCORD_TOKEN is required in environment variables');
    }
    
    if (!this.config.clientId) {
      throw new Error('CLIENT_ID is required in environment variables');
    }
  }

  public getConfig(): BotConfig {
    return { ...this.config };
  }

  public get discordToken(): string {
    return this.config.discordToken;
  }

  public get guildId(): string | undefined {
    return this.config.guildId;
  }

  public get clientId(): string {
    return this.config.clientId;
  }


}

export const config = ConfigManager.getInstance();
