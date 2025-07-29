import {
  SlashCommandBuilder,
  CommandInteraction,
  ChatInputCommandInteraction,
  GuildMember,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalSubmitInteraction
} from 'discord.js';
import { logger } from '../utils/logger';

export const data = new SlashCommandBuilder()
  .setName('npc')
  .setDescription('NPC management commands (temporarily disabled)')
  .addSubcommand(subcommand =>
    subcommand
      .setName('create')
      .setDescription('Create a new NPC (temporarily disabled)')
      .addStringOption(option =>
        option.setName('name')
          .setDescription('Name of the NPC')
          .setRequired(true))
      .addStringOption(option =>
        option.setName('concept')
          .setDescription('Primary concept/role of the NPC')
          .setRequired(true))
      .addStringOption(option =>
        option.setName('tier')
          .setDescription('NPC tier')
          .setRequired(true)
          .addChoices(
            { name: 'Minion', value: 'minion' },
            { name: 'Toughened', value: 'toughened' },
            { name: 'Nemesis', value: 'nemesis' }
          ))
      .addStringOption(option =>
        option.setName('description')
          .setDescription('Brief description of the NPC')
          .setRequired(false)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('list')
      .setDescription('List all NPCs in this server (temporarily disabled)'))
  .addSubcommand(subcommand =>
    subcommand
      .setName('view')
      .setDescription('View detailed NPC information (temporarily disabled)')
      .addStringOption(option =>
        option.setName('name')
          .setDescription('Name of the NPC to view')
          .setRequired(true)
          .setAutocomplete(true)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('edit')
      .setDescription('Edit NPC properties (temporarily disabled)')
      .addStringOption(option =>
        option.setName('name')
          .setDescription('Name of the NPC to edit')
          .setRequired(true)
          .setAutocomplete(true))
      .addStringOption(option =>
        option.setName('field')
          .setDescription('Field to edit')
          .setRequired(true)
          .addChoices(
            { name: 'Name', value: 'name' },
            { name: 'Concept', value: 'concept' },
            { name: 'Description', value: 'description' },
            { name: 'Tier', value: 'tier' }
          ))
      .addStringOption(option =>
        option.setName('value')
          .setDescription('New value for the field')
          .setRequired(true)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('delete')
      .setDescription('Delete an NPC (temporarily disabled)')
      .addStringOption(option =>
        option.setName('name')
          .setDescription('Name of the NPC to delete')
          .setRequired(true)
          .setAutocomplete(true)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('roll')
      .setDescription('Roll for an NPC (temporarily disabled)')
      .addStringOption(option =>
        option.setName('name')
          .setDescription('Name of the NPC')
          .setRequired(true)
          .setAutocomplete(true))
      .addStringOption(option =>
        option.setName('type')
          .setDescription('Type of roll')
          .setRequired(true)
          .addChoices(
            { name: 'Basic Roll', value: 'basic' },
            { name: 'Skill + Drive', value: 'skill' },
            { name: 'Attack', value: 'attack' },
            { name: 'Defend', value: 'defend' }
          ))
      .addIntegerOption(option =>
        option.setName('difficulty')
          .setDescription('Difficulty of the test (default: 2)')
          .setRequired(false)
          .setMinValue(1)
          .setMaxValue(5))
      .addStringOption(option =>
        option.setName('skill')
          .setDescription('Skill to use (for skill rolls)')
          .setRequired(false))
      .addStringOption(option =>
        option.setName('drive')
          .setDescription('Drive to use (for skill rolls)')
          .setRequired(false))
      .addStringOption(option =>
        option.setName('asset')
          .setDescription('Asset or weapon to use')
          .setRequired(false))
      .addStringOption(option =>
        option.setName('description')
          .setDescription('Description of the action')
          .setRequired(false)));

export async function execute(interaction: ChatInputCommandInteraction) {
  const subcommand = interaction.options.getSubcommand();

  // All NPC commands are temporarily disabled
  await interaction.reply({
    content: '❌ **NPC commands are temporarily disabled**\n\n' +
             'The NPC system is being migrated to the new database architecture. ' +
             'This feature will be restored once the Prisma NPC implementation is complete.\n\n' +
             '**Available alternatives:**\n' +
             '• Use `/dune-roll` for character dice rolls\n' +
             '• Use `/sheet` commands for character management\n' +
             '• Use `/lookup` for game references',
    ephemeral: true
  });

  logger.info(`NPC command attempted: ${subcommand} by ${interaction.user.tag} (temporarily disabled)`);
}

export async function autocomplete(interaction: any) {
  // Return empty autocomplete since NPCs are disabled
  await interaction.respond([]);
}
