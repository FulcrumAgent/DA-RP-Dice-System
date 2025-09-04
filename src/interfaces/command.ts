import { 
  SlashCommandBuilder, 
  SlashCommandSubcommandsOnlyBuilder,
  ChatInputCommandInteraction,
  AutocompleteInteraction 
} from 'discord.js';

export interface Command {
  data: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
}
