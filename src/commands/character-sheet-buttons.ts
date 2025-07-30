/**
 * Button handlers for character sheet commands
 */

import { ButtonInteraction, GuildMember, EmbedBuilder } from 'discord.js';
import { characterCreationState } from '../utils/character-creation-state';
import { prismaCharacterManager } from '../utils/prisma-character-manager';
import { logger } from '../utils/logger';

// Button interaction handlers
export async function handleFinalizeButton(interaction: ButtonInteraction) {
  if (!interaction.guild || !interaction.member) {
    await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
    return;
  }

  const member = interaction.member as GuildMember;
  await interaction.deferReply();

  try {
    const state = characterCreationState.getState(member.id, interaction.guild.id);
    if (!state) {
      await interaction.editReply({ content: '❌ No character creation in progress.' });
      return;
    }

    // Create the character using the Prisma character manager
    await prismaCharacterManager.createCharacter(
      member.id,
      state.data.name || 'Unnamed Character',
      state.data.concepts || [],
      {
        house: state.data.house,
        homeworld: state.data.homeworld
      }
    );
    
    // Complete the creation state (this removes it)
    await characterCreationState.completeCreation(member.id, interaction.guild.id);

    const embed = new EmbedBuilder()
      .setTitle('✅ Character Finalized!')
      .setDescription(`**${state.data.name}** has been saved successfully!\n\nYou can now use \`/sheet view\` to see your character or \`/sheet edit\` to make changes.`)
      .setColor(0x00FF00);

    await interaction.editReply({ embeds: [embed], components: [] });
  } catch (error) {
    logger.error('Finalize character error:', error);
    await interaction.editReply({ content: '❌ Failed to finalize character. Please try again.' });
  }
}

export async function handleCancelButton(interaction: ButtonInteraction) {
  if (!interaction.guild || !interaction.member) {
    await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
    return;
  }

  const member = interaction.member as GuildMember;
  await interaction.deferReply();

  try {
    const state = characterCreationState.getState(member.id, interaction.guild.id);
    if (!state) {
      await interaction.editReply({ content: '❌ No character creation in progress.' });
      return;
    }

    // Cancel the creation state
    await characterCreationState.cancelCreation(member.id, interaction.guild.id);

    const embed = new EmbedBuilder()
      .setTitle('❌ Character Creation Cancelled')
      .setDescription('Your character creation has been cancelled. Use `/sheet create` to start over.')
      .setColor(0xFF0000);

    await interaction.editReply({ embeds: [embed], components: [] });
  } catch (error) {
    logger.error('Cancel character error:', error);
    await interaction.editReply({ content: '❌ Failed to cancel character creation.' });
  }
}
