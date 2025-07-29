/**
 * Export handlers for character sheet interactions
 */

import { GuildMember, StringSelectMenuInteraction, ButtonInteraction } from 'discord.js';
import { characterManager } from '../utils/character-manager';

// Note: character-sheet.ts doesn't export these functions anymore
// They are handled directly in the execute function

// Export function to handle all select menu interactions including concepts
export async function handleInteraction(interaction: StringSelectMenuInteraction): Promise<void> {
  const member = interaction.member as GuildMember;
  
  // Handle delete character selection
  if (interaction.customId === 'delete_character_select') {
    await handleDeleteCharacterSelect(interaction, member);
  }
  else {
    // No other interactions handled here - this is a placeholder
    throw new Error(`Unhandled interaction: ${interaction.customId}`);
  }
}

// Export button interaction handler
export async function handleButtonInteraction(interaction: ButtonInteraction): Promise<void> {
  
  // Handle delete character cancel button
  if (interaction.customId === 'delete_character_cancel') {
    await handleDeleteCharacterCancel(interaction);
  }
  else {
    // No other button interactions handled here - this is a placeholder
    throw new Error(`Unhandled button interaction: ${interaction.customId}`);
  }
}

// Handle delete character selection
async function handleDeleteCharacterSelect(interaction: StringSelectMenuInteraction, member: GuildMember): Promise<void> {
  const characterId = interaction.values[0];
  const character = characterManager.getCharacter(characterId);
  
  if (!character) {
    await interaction.update({ 
      content: '❌ Character not found.', 
      components: [] 
    });
    return;
  }

  // Verify ownership
  if (character.userId !== member.id) {
    await interaction.update({ 
      content: '❌ You can only delete your own characters.', 
      components: [] 
    });
    return;
  }

  await interaction.deferUpdate();

  try {
    await characterManager.deleteCharacter(characterId, member.id);
    await interaction.editReply({ 
      content: `💀 Character **${character.name}** has been deleted. Farewell, ${character.concepts.join(', ')}.`,
      components: []
    });
  } catch (error) {
    await interaction.editReply({ 
      content: `❌ Failed to delete character: ${error}`,
      components: []
    });
  }
}

// Handle delete character cancel
async function handleDeleteCharacterCancel(interaction: ButtonInteraction): Promise<void> {
  await interaction.update({ 
    content: '✅ Character deletion cancelled.',
    components: []
  });
}
