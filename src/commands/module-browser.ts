import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction 
} from 'discord.js';
import { Command } from '../interfaces/command';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('modules')
    .setDescription('Browse and manage adventure modules (temporarily disabled)'),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply({
      content: '🚧 **Module Browser Temporarily Disabled**\n\nThis command is currently undergoing maintenance to support the new database system. It will be re-enabled in a future update.',
      ephemeral: true
    });
  }
};
