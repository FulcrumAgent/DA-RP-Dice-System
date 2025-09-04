/**
 * Application entry point
 */

import { bot } from './bot';
import { logger } from './utils/logger';
import { config } from './config';

async function main(): Promise<void> {
  try {
    // Validate configuration
    const botConfig = config.getConfig();
    
    if (!botConfig.discordToken) {
      throw new Error('DISCORD_TOKEN is required in environment variables');
    }

    if (!botConfig.clientId) {
      logger.warn('CLIENT_ID not set - some features may not work properly');
    }

    logger.info('Starting Dune Discord Bot...');
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`Log Level: ${botConfig.logLevel}`);
    
    if (botConfig.guildId) {
      logger.info(`Guild-specific deployment: ${botConfig.guildId}`);
    } else {
      logger.info('Global command deployment (may take up to 1 hour)');
    }



    // Start the bot
    await bot.start();
    
    logger.info('Dune Discord Bot started successfully! 🚀');

  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the application
main();
