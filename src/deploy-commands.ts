/**
 * Deploy slash commands to Discord
 */

import { REST, Routes } from 'discord.js';
import { config } from './config';
import { logger } from './utils/logger';

// Command imports
import { diceRollerCommands } from './commands/dice-roller';
import { duneSystemCommands } from './commands/dune-system';

import * as sceneHostCommand from './commands/scene-host';
import * as characterSheetCommand from './commands/character-sheet';

import * as referenceCommand from './commands/reference';
import * as npcManagerCommand from './commands/npc-manager';
import * as duneReferenceCommand from './commands/dune-reference';

async function deployCommands() {
  const botConfig = config.getConfig();
  
  if (!botConfig.discordToken) {
    logger.error('DISCORD_TOKEN is required');
    process.exit(1);
  }

  if (!botConfig.clientId) {
    logger.error('CLIENT_ID is required');
    process.exit(1);
  }

  // Collect all commands
  const commands = [
    ...diceRollerCommands,
    ...duneSystemCommands,

    sceneHostCommand.data,
    characterSheetCommand.data,
    referenceCommand.data,
    npcManagerCommand.data,
    duneReferenceCommand.data
  ].map(command => command.toJSON());

  const rest = new REST({ version: '10' }).setToken(botConfig.discordToken);

  try {
    logger.info(`Started refreshing ${commands.length} application (/) commands.`);

    let data: unknown[];
    
    if (botConfig.guildId) {
      // Deploy to specific guild (faster for development)
      data = await rest.put(
        Routes.applicationGuildCommands(botConfig.clientId, botConfig.guildId),
        { body: commands }
      ) as unknown[];
      logger.info(`Successfully reloaded ${data.length} guild application (/) commands for guild ${botConfig.guildId}.`);
    } else {
      // Deploy globally (takes up to 1 hour)
      data = await rest.put(
        Routes.applicationCommands(botConfig.clientId),
        { body: commands }
      ) as unknown[];
      logger.info(`Successfully reloaded ${data.length} global application (/) commands.`);
    }

  } catch (error) {
    logger.error('Error deploying commands:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  deployCommands();
}

export { deployCommands };
