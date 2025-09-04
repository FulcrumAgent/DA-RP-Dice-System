"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bot_1 = require("./bot");
const logger_1 = require("./utils/logger");
const config_1 = require("./config");
async function main() {
    try {
        const botConfig = config_1.config.getConfig();
        if (!botConfig.discordToken) {
            throw new Error('DISCORD_TOKEN is required in environment variables');
        }
        if (!botConfig.clientId) {
            logger_1.logger.warn('CLIENT_ID not set - some features may not work properly');
        }
        logger_1.logger.info('Starting Dune Discord Bot...');
        logger_1.logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        logger_1.logger.info(`Log Level: ${botConfig.logLevel}`);
        if (botConfig.guildId) {
            logger_1.logger.info(`Guild-specific deployment: ${botConfig.guildId}`);
        }
        else {
            logger_1.logger.info('Global command deployment (may take up to 1 hour)');
        }
        await bot_1.bot.start();
        logger_1.logger.info('Dune Discord Bot started successfully! 🚀');
    }
    catch (error) {
        logger_1.logger.error('Failed to start application:', error);
        process.exit(1);
    }
}
process.on('unhandledRejection', (reason, promise) => {
    logger_1.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (error) => {
    logger_1.logger.error('Uncaught Exception:', error);
    process.exit(1);
});
main();
