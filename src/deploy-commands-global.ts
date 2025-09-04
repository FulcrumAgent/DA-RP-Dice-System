/**
 * Deploy slash commands globally to Discord (ignores GUILD_ID)
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

async function deployCommandsGlobally() {
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
    logger.info(`Started refreshing ${commands.length} application (/) commands GLOBALLY.`);

    // Always deploy globally (ignores GUILD_ID setting)
    const data = await rest.put(
      Routes.applicationCommands(botConfig.clientId),
      { body: commands }
    ) as unknown[];
    
    logger.info(`Successfully reloaded ${data.length} global application (/) commands.`);
    logger.info('Global commands may take up to 1 hour to appear in all servers.');

  } catch (error) {
    logger.error('Error deploying global commands:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  deployCommandsGlobally();
}

export { deployCommandsGlobally };
