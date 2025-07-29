/**
 * Avatar Management System for Characters and NPCs
 */

import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  EmbedBuilder, 
  MessageFlags,
  AutocompleteInteraction,
  AttachmentBuilder
} from 'discord.js';
import { characterManager } from '../utils/character-manager';
import { logger } from '../utils/logger';

export const avatarCommand = new SlashCommandBuilder()
  .setName('avatar')
  .setDescription('Manage character and NPC avatars')
  .addSubcommand(subcommand =>
    subcommand
      .setName('set')
      .setDescription('Set a custom avatar for a character or NPC')
      .addStringOption(option =>
        option.setName('character')
          .setDescription('Character or NPC to set avatar for')
          .setRequired(true)
          .setAutocomplete(true)
      )
      .addStringOption(option =>
        option.setName('url')
          .setDescription('Image URL (PNG, JPG, JPEG, WebP, or GIF)')
          .setRequired(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('remove')
      .setDescription('Remove custom avatar from a character or NPC')
      .addStringOption(option =>
        option.setName('character')
          .setDescription('Character or NPC to remove avatar from')
          .setRequired(true)
          .setAutocomplete(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('view')
      .setDescription('View current avatar for a character or NPC')
      .addStringOption(option =>
        option.setName('character')
          .setDescription('Character or NPC to view avatar for')
          .setRequired(true)
          .setAutocomplete(true)
      )
  );

export async function handleAvatarCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  const subcommand = interaction.options.getSubcommand();
  
  switch (subcommand) {
    case 'set':
      await handleSetAvatar(interaction);
      break;
    case 'remove':
      await handleRemoveAvatar(interaction);
      break;
    case 'view':
      await handleViewAvatar(interaction);
      break;
    default:
      await interaction.reply({
        content: '❌ Unknown subcommand.',
        flags: MessageFlags.Ephemeral
      });
  }
}

async function handleSetAvatar(interaction: ChatInputCommandInteraction): Promise<void> {
  const characterName = interaction.options.getString('character', true);
  const avatarUrl = interaction.options.getString('url', true);
  const userId = interaction.user.id;
  const guildId = interaction.guildId!;

  try {
    // Validate the image URL
    const validation = characterManager.validateImageUrl(avatarUrl);
    if (!validation.valid) {
      await interaction.reply({
        content: `❌ Invalid image URL: ${validation.error}`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    // Find character or NPC
    const userCharacters = characterManager.getUserCharacters(userId, guildId);
    const character = userCharacters.find(c => c.name.toLowerCase() === characterName.toLowerCase());
    
    if (character) {
      // Set character avatar
      const updatedCharacter = await characterManager.setCharacterAvatar(character.id, avatarUrl, userId);
      
      const embed = new EmbedBuilder()
        .setTitle('✅ Avatar Set Successfully')
        .setDescription(`Custom avatar has been set for **${updatedCharacter.name}**`)
        .setColor('#00ff00')
        .setThumbnail(avatarUrl)
        .setTimestamp();

      await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral
      });
      
      logger.info(`User ${userId} set avatar for character ${updatedCharacter.name}`);
      return;
    }

    // Check NPCs
    const guildNPCs = await characterManager.getGuildNPCs(guildId);
    const npc = guildNPCs.find(n => n.name.toLowerCase() === characterName.toLowerCase() && n.createdBy === userId);
    
    if (npc) {
      // Set NPC avatar
      const updatedNPC = await characterManager.setNPCAvatar(npc.id, avatarUrl, userId);
      
      const embed = new EmbedBuilder()
        .setTitle('✅ Avatar Set Successfully')
        .setDescription(`Custom avatar has been set for NPC **${updatedNPC.name}**`)
        .setColor('#00ff00')
        .setThumbnail(avatarUrl)
        .setTimestamp();

      await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral
      });
      
      logger.info(`User ${userId} set avatar for NPC ${updatedNPC.name}`);
      return;
    }

    await interaction.reply({
      content: `❌ Character or NPC "${characterName}" not found, or you don't have permission to modify it.`,
      flags: MessageFlags.Ephemeral
    });

  } catch (error) {
    logger.error('Error setting avatar:', error);
    await interaction.reply({
      content: '❌ An error occurred while setting the avatar. Please try again.',
      flags: MessageFlags.Ephemeral
    });
  }
}

async function handleRemoveAvatar(interaction: ChatInputCommandInteraction): Promise<void> {
  const characterName = interaction.options.getString('character', true);
  const userId = interaction.user.id;
  const guildId = interaction.guildId!;

  try {
    // Find character or NPC
    const userCharacters = characterManager.getUserCharacters(userId, guildId);
    const character = userCharacters.find(c => c.name.toLowerCase() === characterName.toLowerCase());
    
    if (character) {
      // Remove character avatar
      const updatedCharacter = await characterManager.removeCharacterAvatar(character.id, userId);
      
      const embed = new EmbedBuilder()
        .setTitle('✅ Avatar Removed Successfully')
        .setDescription(`Custom avatar has been removed from **${updatedCharacter.name}**\nWill now use your Discord avatar as fallback.`)
        .setColor('#ff9900')
        .setTimestamp();

      await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral
      });
      
      logger.info(`User ${userId} removed avatar from character ${updatedCharacter.name}`);
      return;
    }

    // Check NPCs
    const guildNPCs = await characterManager.getGuildNPCs(guildId);
    const npc = guildNPCs.find(n => n.name.toLowerCase() === characterName.toLowerCase() && n.createdBy === userId);
    
    if (npc) {
      // Remove NPC avatar
      const updatedNPC = await characterManager.removeNPCAvatar(npc.id, userId);
      
      const embed = new EmbedBuilder()
        .setTitle('✅ Avatar Removed Successfully')
        .setDescription(`Custom avatar has been removed from NPC **${updatedNPC.name}**\nWill now use your Discord avatar as fallback.`)
        .setColor('#ff9900')
        .setTimestamp();

      await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral
      });
      
      logger.info(`User ${userId} removed avatar from NPC ${updatedNPC.name}`);
      return;
    }

    await interaction.reply({
      content: `❌ Character or NPC "${characterName}" not found, or you don't have permission to modify it.`,
      flags: MessageFlags.Ephemeral
    });

  } catch (error) {
    logger.error('Error removing avatar:', error);
    await interaction.reply({
      content: '❌ An error occurred while removing the avatar. Please try again.',
      flags: MessageFlags.Ephemeral
    });
  }
}

async function handleViewAvatar(interaction: ChatInputCommandInteraction): Promise<void> {
  const characterName = interaction.options.getString('character', true);
  const userId = interaction.user.id;
  const guildId = interaction.guildId!;

  try {
    // Find character or NPC (can view any character/NPC, not just owned ones)
    const guildCharacters = await characterManager.getGuildCharacters(guildId);
    const character = guildCharacters.find(c => c.name.toLowerCase() === characterName.toLowerCase());
    
    if (character) {
      const avatarUrl = characterManager.getAvatarUrl(character, interaction.user.displayAvatarURL());
      const isCustom = !!character.avatar;
      
      const embed = new EmbedBuilder()
        .setTitle(`🖼️ ${character.name}'s Avatar`)
        .setColor(isCustom ? '#00ff00' : '#999999')
        .setDescription(`**Character:** ${character.name}\n**Avatar:** ${character.avatar ? 'Custom avatar set' : 'Using Discord avatar (default)'}`)
        .setThumbnail(avatarUrl)
        .setTimestamp();

      if (isCustom) {
        embed.addFields({
          name: 'Custom Avatar URL',
          value: `[View Full Size](${character.avatar})`,
          inline: false
        });
      }

      await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    // Check NPCs
    const guildNPCs = await characterManager.getGuildNPCs(guildId);
    const npc = guildNPCs.find(n => n.name.toLowerCase() === characterName.toLowerCase());
    
    if (npc) {
      // Get the creator's avatar for fallback
      const creator = await interaction.client.users.fetch(npc.createdBy);
      const avatarUrl = characterManager.getAvatarUrl(npc, creator.displayAvatarURL());
      const isCustom = !!npc.avatar;
      
      const embed = new EmbedBuilder()
        .setTitle(`🖼️ ${npc.name}'s Avatar (NPC)`)
        .setDescription(isCustom ? 'Using custom avatar' : `Using ${creator.displayName}'s Discord avatar (no custom avatar set)`)
        .setColor(isCustom ? '#00ff00' : '#999999')
        .setThumbnail(avatarUrl)
        .setTimestamp();

      if (isCustom) {
        embed.addFields({
          name: 'Custom Avatar URL',
          value: `[View Full Size](${npc.avatar})`,
          inline: false
        });
      }

      await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    await interaction.reply({
      content: `❌ Character or NPC "${characterName}" not found.`,
      flags: MessageFlags.Ephemeral
    });

  } catch (error) {
    logger.error('Error viewing avatar:', error);
    await interaction.reply({
      content: '❌ An error occurred while viewing the avatar. Please try again.',
      flags: MessageFlags.Ephemeral
    });
  }
}

// Autocomplete handler for character/NPC names
export async function handleAvatarAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
  const focusedValue = interaction.options.getFocused().toLowerCase();
  const userId = interaction.user.id;
  const guildId = interaction.guildId!;

  try {
    const choices: { name: string; value: string }[] = [];

    // Get user's characters
    const userCharacters = characterManager.getUserCharacters(userId, guildId);
    for (const character of userCharacters) {
      if (character.name.toLowerCase().includes(focusedValue)) {
        choices.push({
          name: `${character.name} (Character)`,
          value: character.name
        });
      }
    }

    // Get user's NPCs
    const guildNPCs = await characterManager.getGuildNPCs(guildId);
    const userNPCs = guildNPCs.filter(npc => npc.createdBy === userId);
    for (const npc of userNPCs) {
      if (npc.name.toLowerCase().includes(focusedValue)) {
        choices.push({
          name: `${npc.name} (NPC)`,
          value: npc.name
        });
      }
    }

    // For view command, also include other characters/NPCs in the guild
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === 'view') {
      const guildCharacters = await characterManager.getGuildCharacters(guildId);
      for (const character of guildCharacters) {
        if (character.userId !== userId && character.name.toLowerCase().includes(focusedValue)) {
          choices.push({
            name: `${character.name} (Other's Character)`,
            value: character.name
          });
        }
      }

      for (const npc of guildNPCs) {
        if (npc.createdBy !== userId && npc.name.toLowerCase().includes(focusedValue)) {
          choices.push({
            name: `${npc.name} (Other's NPC)`,
            value: npc.name
          });
        }
      }
    }

    // Limit to 25 choices (Discord limit)
    const limitedChoices = choices.slice(0, 25);

    await interaction.respond(limitedChoices);
  } catch (error) {
    logger.error('Error in avatar autocomplete:', error);
    await interaction.respond([]);
  }
}
