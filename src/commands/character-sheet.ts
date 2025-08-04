/**
 * Character Sheet Management Commands - Clean Implementation
 * Section 0 Compliant: Mare Synchronos-style ephemeral character creation
 */

import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  EmbedBuilder, 
  GuildMember,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ButtonInteraction,
  MessageFlags,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalSubmitInteraction,
  CommandInteraction
} from 'discord.js';
import { prismaCharacterManager, CharacterWithRelations } from '../utils/prisma-character-manager';
import { SKILLS } from '../data/skills';
import { logger } from '../utils/logger';

// Helper function to get skill descriptions
function getSkillDescription(skillName: string): string {
  const skill = SKILLS.find(s => s.name === skillName);
  return skill ? skill.description : `${skillName} skill`;
}

export const data = new SlashCommandBuilder()
  .setName('sheet')
  .setDescription('Character sheet management commands')
  .addSubcommand(subcommand =>
    subcommand
      .setName('create')
      .setDescription('Start creating a new character (unified ephemeral process)')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('view')
      .setDescription('View a character sheet')
      .addStringOption(option =>
        option
          .setName('character')
          .setDescription('Character name to view')
          .setRequired(false)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('edit')
      .setDescription('Edit an existing character (unified ephemeral process)')
      .addStringOption(option =>
        option
          .setName('character')
          .setDescription('Character name to edit')
          .setRequired(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('delete')
      .setDescription('Delete a character')
      .addStringOption(option =>
        option
          .setName('character')
          .setDescription('Character name to delete')
          .setRequired(true)
      )
  );

export async function execute(interaction: CommandInteraction) {
  if (!interaction.isChatInputCommand()) return;
  if (!interaction.guild) {
    await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
    return;
  }

  const member = interaction.member as GuildMember;
  const subcommand = interaction.options.getSubcommand();

  try {
    switch (subcommand) {
      case 'create':
        await handleCreateCharacter(interaction, member);
        break;
      case 'view':
        await handleViewCharacter(interaction, member);
        break;
      case 'edit':
        await handleEditCharacter(interaction, member);
        break;
      case 'delete':
        await handleDeleteCharacter(interaction, member);
        break;
      default:
        await interaction.reply({ content: 'Unknown subcommand.', ephemeral: true });
    }
  } catch (error) {
    logger.error('Character sheet command error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: `❌ ${errorMessage}`, ephemeral: true });
    } else {
      await interaction.reply({ content: `❌ ${errorMessage}`, ephemeral: true });
    }
  }
}

/**
 * Handle character creation - unified ephemeral process
 */
async function handleCreateCharacter(interaction: ChatInputCommandInteraction, member: GuildMember) {
  try {
    // Check if user already has characters (up to 3 allowed)
    const userCharacters = await prismaCharacterManager.getUserCharacters(member.id);
    logger.info(`Character limit check for user ${member.id}: found ${userCharacters.length} characters:`, userCharacters.map((c: CharacterWithRelations) => ({ id: c.id, name: c.name, isActive: c.isActive })));
    
    if (userCharacters.length >= 3) {
      await interaction.reply({
        content: `⚠️ You already have ${userCharacters.length} characters (maximum allowed: 3). Characters found: ${userCharacters.map((c: CharacterWithRelations) => c.name).join(', ')}. Use \`/sheet delete\` to remove one before creating a new character.`,
        ephemeral: true
      });
      return;
    }

    // Start unified ephemeral character creation using character-creator
    const { CharacterCreator } = await import('./character-creator.js');
    await CharacterCreator.startCreation(interaction, member);
    logger.info(`Started character creation for user ${member.id} in guild ${interaction.guild!.id}`);
  } catch (error) {
    logger.error('Character creation start error:', error);
    throw error;
  }
}

/**
 * Handle character viewing with privacy controls
 */
async function handleViewCharacter(interaction: ChatInputCommandInteraction, member: GuildMember) {
  try {
    const characterName = interaction.options.getString('character');
    let targetCharacter: CharacterWithRelations | null = null;
    let isOwner = false;

    if (characterName) {
      // Find character by name among user's characters
      const userCharacters = await prismaCharacterManager.getUserCharacters(member.id);
      const foundCharacter = userCharacters.find((char: CharacterWithRelations) => char.name.toLowerCase() === characterName.toLowerCase());
      if (foundCharacter) {
        targetCharacter = foundCharacter;
        isOwner = true;
      }
    } else {
      // View user's active character (or first character if no active one)
      const userCharacters = await prismaCharacterManager.getUserCharacters(member.id);
      targetCharacter = await prismaCharacterManager.getUserActiveCharacter(member.id) || userCharacters[0] || null;
      isOwner = true;
    }

    if (!targetCharacter) {
      await interaction.reply({
        content: characterName ? `❌ Character "${characterName}" not found.` : '❌ You don\'t have a character yet. Use `/sheet create` to make one.',
        ephemeral: true
      });
      return;
    }

    // Create character display embed with privacy controls
    const embed = createCharacterViewEmbed(targetCharacter, isOwner, interaction.user);
    await interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (error) {
    logger.error('Character view error:', error);
    throw error;
  }
}

/**
 * Handle character editing - unified ephemeral process
 */
async function handleEditCharacter(interaction: ChatInputCommandInteraction, member: GuildMember) {
  try {
    const characterName = interaction.options.getString('character', true);
    const characters = await prismaCharacterManager.getUserCharacters(member.id);
    
    if (!characters || characters.length === 0) {
      await interaction.reply({
        content: '❌ You don\'t have a character to edit. Use `/sheet create` to make one first.',
        ephemeral: true
      });
      return;
    }

    const character = characters.find((char: CharacterWithRelations) => char.name.toLowerCase() === characterName.toLowerCase());
    if (!character) {
      await interaction.reply({
        content: `❌ Character "${characterName}" not found or you don't own it.`,
        ephemeral: true
      });
      return;
    }

    // Start character editing session
    await startCharacterEditing(interaction, character);
  } catch (error) {
    logger.error('Character edit error:', error);
    throw error;
  }
}

/**
 * Handle character deletion
 */
async function handleDeleteCharacter(interaction: ChatInputCommandInteraction, member: GuildMember) {
  try {
    const characterName = interaction.options.getString('character', true);
    const userCharacters = await prismaCharacterManager.getUserCharacters(member.id);
    const character = userCharacters.find((char: CharacterWithRelations) => char.name.toLowerCase() === characterName.toLowerCase());
    
    if (!character) {
      if (userCharacters.length === 0) {
        await interaction.reply({
          content: '❌ You don\'t have any characters to delete.',
          ephemeral: true
        });
      } else {
        await interaction.reply({
          content: `❌ Character "${characterName}" not found. Your characters: ${userCharacters.map((c: CharacterWithRelations) => c.name).join(', ')}.`,
          ephemeral: true
        });
      }
      return;
    }

    // Create confirmation buttons
    const confirmButton = new ButtonBuilder()
      .setCustomId('confirm_delete')
      .setLabel('Delete Character')
      .setStyle(ButtonStyle.Danger);
    
    const cancelButton = new ButtonBuilder()
      .setCustomId('cancel_delete')
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(confirmButton, cancelButton);

    await interaction.reply({
      content: `⚠️ **Are you sure you want to delete "${character.name}"?**\n\nThis action cannot be undone!`,
      components: [row],
      ephemeral: true
    });
  } catch (error) {
    logger.error('Character delete error:', error);
    throw error;
  }
}

/**
 * Character Editing System
 */
interface EditingSession {
  characterId: string;
  character: CharacterWithRelations;
  userId: string;
  guildId: string;
  originalInteraction?: ChatInputCommandInteraction;
}

const editingSessions = new Map<string, EditingSession>();

/**
 * Start character editing session
 */
async function startCharacterEditing(interaction: ChatInputCommandInteraction, character: CharacterWithRelations) {
  const sessionId = `${interaction.user.id}_${interaction.guildId}`;
  
  // Store the editing session
  editingSessions.set(sessionId, {
    characterId: character.id,
    character: { ...character }, // Create a copy for editing
    userId: interaction.user.id,
    guildId: interaction.guildId!,
    originalInteraction: interaction
  });
  
  await showEditingPanel(interaction, sessionId);
}

/**
 * Show the main editing panel
 */
async function showEditingPanel(interaction: ChatInputCommandInteraction, sessionId: string, update = false) {
  const session = editingSessions.get(sessionId);
  if (!session) {
    await interaction.reply({
      content: '❌ Editing session not found. Please try again.',
      ephemeral: true
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(`🔧 Editing: ${session.character.name}`)
    .setDescription('Select what you want to edit:')
    .setColor(0x8B4513)
    .addFields(
      { name: '📝 Name', value: session.character.name, inline: true },
      { name: '💭 Concepts', value: session.character.concepts?.join(', ') || 'Not set', inline: true },
      { name: '🎭 House', value: session.character.house || 'None', inline: true },
      { name: '🎯 Drives', value: formatDrives(session.character), inline: false },
      { name: '⚔️ Skills', value: formatSkills(session.character), inline: false }
    )
    .setFooter({ text: 'Changes are saved automatically when you finish editing.' });

  const buttons = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('edit_name')
        .setLabel('Edit Name')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📝'),
      new ButtonBuilder()
        .setCustomId('edit_concepts')
        .setLabel('Edit Concepts')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('💭'),
      new ButtonBuilder()
        .setCustomId('edit_drives')
        .setLabel('Edit Drives')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🎯'),
      new ButtonBuilder()
        .setCustomId('edit_skills')
        .setLabel('Edit Skills')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('⚔️')
    );

  const actionButtons = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('edit_statements')
        .setLabel('Edit Drive Statements')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📜'),
      new ButtonBuilder()
        .setCustomId('save_character')
        .setLabel('Save Changes')
        .setStyle(ButtonStyle.Success)
        .setEmoji('💾'),
      new ButtonBuilder()
        .setCustomId('cancel_editing')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('❌')
    );

  const options = {
    embeds: [embed],
    components: [buttons, actionButtons],
    ephemeral: true
  };

  if (update) {
    await interaction.editReply(options);
  } else {
    await interaction.reply(options);
  }
}

/**
 * Format drives for display
 */
function formatDrives(character: CharacterWithRelations): string {
  if (!character.drives || character.drives.length === 0) return 'Not set';
  
  const driveEntries = character.drives
    .map((drive: any) => `${drive.name}: ${drive.value}`)
    .join(', ');
  
  return driveEntries || 'Not set';
}

/**
 * Format skills for display
 */
function formatSkills(character: CharacterWithRelations): string {
  if (!character.skills || character.skills.length === 0) return 'Not set';
  
  const skillEntries = character.skills
    .map((skill: any) => `${skill.name}: ${skill.value}`)
    .join(', ');
  
  return skillEntries || 'Not set';
}

/**
 * Handle character editing button interactions
 */
export async function handleEditingButton(interaction: ButtonInteraction): Promise<void> {
  const sessionId = `${interaction.user.id}_${interaction.guildId}`;
  const session = editingSessions.get(sessionId);
  
  if (!session) {
    await interaction.reply({
      content: '❌ No active editing session found. Please start editing again with `/sheet edit`.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  switch (interaction.customId) {
    case 'edit_name': {
      const modal = new ModalBuilder()
        .setCustomId('edit_name_modal')
        .setTitle('🔧 Edit Name');

      const nameInput = new TextInputBuilder()
        .setCustomId('character_name')
        .setLabel('Character Name')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Enter new character name')
        .setValue(session.character.name)
        .setMaxLength(50)
        .setRequired(true);

      const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput);
      modal.addComponents(firstActionRow);

      await interaction.showModal(modal);
      break;
    }
      
    case 'edit_concepts': {
      const modal = new ModalBuilder()
        .setCustomId('edit_concepts_modal')
        .setTitle('🔧 Edit Concepts');

      const conceptsInput = new TextInputBuilder()
        .setCustomId('character_concepts')
        .setLabel('Character Concepts (comma-separated)')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('e.g. Shy Polyglot Linguist, Desert Survivor')
        .setValue(session.character.concepts?.join(', ') || '')
        .setMaxLength(500)
        .setRequired(false);

      const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(conceptsInput);
      modal.addComponents(firstActionRow);

      await interaction.showModal(modal);
      break;
    }
      
    case 'edit_drives': {
      const modal = new ModalBuilder()
        .setCustomId('edit_drives_modal')
        .setTitle('🔧 Assign Drive Values: 4, 5, 6, 7, 8');

      const driveNames = ['Duty', 'Faith', 'Justice', 'Power', 'Truth'];
      const inputs = driveNames.map(driveName => {
        const drive = session.character.drives?.find(d => d.name.toLowerCase() === driveName.toLowerCase());
        const currentValue = drive && drive.value > 0 ? drive.value.toString() : '';
        return new TextInputBuilder()
          .setCustomId(driveName)
          .setLabel(`${driveName} (Enter: 4, 5, 6, 7, or 8)`)
          .setStyle(TextInputStyle.Short)
          .setValue(currentValue)
          .setPlaceholder('Enter: 4, 5, 6, 7, or 8')
          .setRequired(true)
          .setMaxLength(1);
      });

      // Add all 5 inputs (Discord modal limit)
      inputs.forEach(input => {
        modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
      });

      await interaction.showModal(modal);
      break;
    }
      
    case 'edit_skills': {
      const modal = new ModalBuilder()
        .setCustomId('edit_skills_modal')
        .setTitle('🔧 Assign Skill Values: 4, 5, 6, 7, 8');

      const skillNames = ['Battle', 'Communicate', 'Discipline', 'Move', 'Understand'];
      const inputs = skillNames.map(skillName => {
        const skill = session.character.skills?.find(s => s.name.toLowerCase() === skillName.toLowerCase());
        const currentValue = skill && skill.value > 0 ? skill.value.toString() : '';
        return new TextInputBuilder()
          .setCustomId(skillName)
          .setLabel(`${skillName} (Enter: 4, 5, 6, 7, or 8)`)
          .setStyle(TextInputStyle.Short)
          .setValue(currentValue)
          .setPlaceholder('Enter: 4, 5, 6, 7, or 8')
          .setRequired(true)
          .setMaxLength(1);
      });

      // Add all 5 skill inputs
      inputs.forEach(input => {
        modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
      });

      await interaction.showModal(modal);
      break;
    }
      
    case 'edit_statements': {
      const modal = new ModalBuilder()
        .setCustomId('edit_statements_modal')
        .setTitle('🔧 Write Drive Statements');

      const driveNames = ['Duty', 'Faith', 'Justice', 'Power', 'Truth'];
      const inputs = driveNames.map(driveName => {
        const drive = session.character.drives?.find(d => d.name.toLowerCase() === driveName.toLowerCase());
        const currentStatement = drive?.statement || '';
        const driveValue = drive?.value || 0;
        
        return new TextInputBuilder()
          .setCustomId(driveName)
          .setLabel(`${driveName} (${driveValue}) - Write your statement`)
          .setStyle(TextInputStyle.Paragraph)
          .setValue(currentStatement)
          .setPlaceholder(`Describe what ${driveName.toLowerCase()} means to your character...`)
          .setRequired(true)
          .setMaxLength(500);
      });

      // Add all 5 drive statement inputs
      inputs.forEach(input => {
        modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
      });

      await interaction.showModal(modal);
      break;
    }
      
    case 'save_character': {
      // Save the edited character
      const characterData = {
        name: session.character.name,
        concepts: session.character.concepts,
        house: session.character.house || undefined,
        homeworld: session.character.homeworld || undefined,
        avatarUrl: session.character.avatarUrl || undefined,
        attrMuscle: session.character.attrMuscle,
        attrMove: session.character.attrMove,
        attrIntellect: session.character.attrIntellect,
        attrAwareness: session.character.attrAwareness,
        attrCommunication: session.character.attrCommunication,
        attrDiscipline: session.character.attrDiscipline,
        determination: session.character.determination,
        maxDetermination: session.character.maxDetermination,
      };
      const updatedCharacter = await prismaCharacterManager.updateCharacter(session.character.id, characterData);
      
      if (updatedCharacter) {
        // Clear the editing session
        editingSessions.delete(sessionId);
        
        await interaction.update({
          embeds: [new EmbedBuilder()
            .setTitle('✅ Character Saved')
            .setDescription(`Successfully saved changes to **${updatedCharacter.name}**.`)
            .setColor(0x00FF00)
          ],
          components: []
        });
      } else {
        await interaction.reply({
          content: '❌ Failed to save character changes. Please try again.',
          flags: MessageFlags.Ephemeral
        });
      }
      break;
    }
    
    case 'cancel_editing':
      // Clear the editing session without saving
      editingSessions.delete(sessionId);
      
      await interaction.update({
        embeds: [new EmbedBuilder()
          .setTitle('❌ Editing Cancelled')
          .setDescription('Character editing has been cancelled. No changes were saved.')
          .setColor(0xFF0000)
        ],
        components: []
      });
      break;
      
    default:
      await interaction.reply({
        content: '❌ Unknown editing action.',
        flags: MessageFlags.Ephemeral
      });
  }
}

/**
 * Handle character editing modal submissions
 */
export async function handleEditingModal(interaction: ModalSubmitInteraction): Promise<void> {
  const sessionId = `${interaction.user.id}_${interaction.guildId}`;
  const session = editingSessions.get(sessionId);
  
  if (!session) {
    await interaction.reply({
      content: '❌ No active editing session found. Please start editing again with `/sheet edit`.',
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  switch (interaction.customId) {
    case 'edit_name_modal': {
      const newName = interaction.fields.getTextInputValue('character_name').trim();
      
      if (!newName) {
        await interaction.reply({
          content: '❌ Character name cannot be empty.',
          flags: MessageFlags.Ephemeral
        });
        return;
      }
      
      // Update the character name in the session
      session.character.name = newName;
      
      // Update the original editing panel silently
      if (session.originalInteraction) {
        await showEditingPanel(session.originalInteraction, sessionId, true);
      }
      
      // Acknowledge the modal submission
      await interaction.deferUpdate();
      break;
    }
    
    case 'edit_concepts_modal': {
      const conceptsText = interaction.fields.getTextInputValue('character_concepts').trim();
      
      // Parse concepts from comma-separated string
      const concepts = conceptsText 
        ? conceptsText.split(',').map(c => c.trim()).filter(c => c.length > 0)
        : [];
      
      // Update the character concepts in the session
      session.character.concepts = concepts;
      
      // Update the original editing panel silently
      if (session.originalInteraction) {
        await showEditingPanel(session.originalInteraction, sessionId, true);
      }
      
      // Acknowledge the modal submission
      await interaction.deferUpdate();
      break;
    }
    
    case 'edit_drives_modal': {
      const driveNames = ['Duty', 'Faith', 'Justice', 'Power', 'Truth'];
      const drives = driveNames.map(driveName => {
        const value = parseInt(interaction.fields.getTextInputValue(driveName)) || 0;
        const existingDrive = session.character.drives?.find(d => d.name.toLowerCase() === driveName.toLowerCase());
        return {
          name: driveName,
          value: value,
          statement: existingDrive?.statement || ''
        };
      }).filter(d => d.value > 0);
      
      session.character.drives = drives;
      
      // Update the original editing panel silently
      if (session.originalInteraction) {
        await showEditingPanel(session.originalInteraction, sessionId, true);
      }
      
      // Acknowledge the modal submission
      await interaction.deferUpdate();
      break;
    }
    
    case 'edit_skills_modal': {
      const skillNames = ['Battle', 'Communicate', 'Discipline', 'Move', 'Understand'];
      const skills = skillNames.map(skillName => {
        const value = parseInt(interaction.fields.getTextInputValue(skillName)) || 0;
        return {
          name: skillName,
          value: value
        };
      }).filter(s => s.value > 0);
      
      session.character.skills = skills;
      
      // Update the original editing panel silently
      if (session.originalInteraction) {
        await showEditingPanel(session.originalInteraction, sessionId, true);
      }
      
      // Acknowledge the modal submission
      await interaction.deferUpdate();
      break;
    }
    
    case 'edit_statements_modal': {
      const driveNames = ['Duty', 'Faith', 'Justice', 'Power', 'Truth'];
      
      // Update each drive's statement from the individual fields
      driveNames.forEach(driveName => {
        const statement = interaction.fields.getTextInputValue(driveName).trim();
        const drive = session.character.drives?.find(d => d.name.toLowerCase() === driveName.toLowerCase());
        if (drive) {
          drive.statement = statement;
        }
      });
      
      // Update the original editing panel silently
      if (session.originalInteraction) {
        await showEditingPanel(session.originalInteraction, sessionId, true);
      }
      
      // Acknowledge the modal submission
      await interaction.deferUpdate();
      break;
    }
    
    default:
      await interaction.reply({
        content: '❌ Unknown editing modal.',
        flags: MessageFlags.Ephemeral
      });
  }
}

/**
 * Create character view embed with privacy controls
 */
function createCharacterViewEmbed(character: CharacterWithRelations, isOwner: boolean, user?: any): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(0xD4AF37)
    .setTitle(`📜 ${character.name || 'Unknown Character'}`)
    .setDescription((character.concepts && Array.isArray(character.concepts) && character.concepts.length > 0) 
      ? character.concepts.join(', ') 
      : 'No concept set');

  // Add character avatar if user is provided
  if (user) {
    const avatarUrl = character.avatarUrl || user.displayAvatarURL();
    embed.setThumbnail(avatarUrl);
  }

  // Helper function to get skill value by name
  const getSkillValue = (skillName: string): number => {
    if (!character.skills || !Array.isArray(character.skills)) return 0;
    const skill = character.skills.find((s: any) => s.name.toLowerCase() === skillName.toLowerCase());
    return skill?.value || 0;
  };

  // Helper function to get drive value by name
  const getDriveValue = (driveName: string): number => {
    if (!character.drives || !Array.isArray(character.drives)) return 0;
    const drive = character.drives.find((d: any) => d.name.toLowerCase() === driveName.toLowerCase());
    return drive?.value || 0;
  };

  // Always show basic info (name, concept, drive scores, skill scores)
  const driveScores = `**Duty:** ${getDriveValue('Duty')}\n**Faith:** ${getDriveValue('Faith')}\n**Justice:** ${getDriveValue('Justice')}\n**Power:** ${getDriveValue('Power')}\n**Truth:** ${getDriveValue('Truth')}`;
  const skillScores = `**Battle:** ${getSkillValue('Battle')}\n**Communicate:** ${getSkillValue('Communicate')}\n**Discipline:** ${getSkillValue('Discipline')}\n**Move:** ${getSkillValue('Move')}\n**Understand:** ${getSkillValue('Understand')}`;
  
  // Validate field values are not empty
  const fields = [];
  if (driveScores && driveScores.trim().length > 0) {
    fields.push({ name: '🎯 Drive Scores', value: driveScores, inline: true });
  }
  if (skillScores && skillScores.trim().length > 0) {
    fields.push({ name: '⚔️ Skill Scores', value: skillScores, inline: true });
  }
  
  if (fields.length > 0) {
    embed.addFields(fields);
  }

  // Show additional details only to owner
  if (isOwner) {
    // Show skill focuses
    const focusText = (character.skills && Array.isArray(character.skills)) 
      ? character.skills
          .filter((skill: any) => skill.focus && Array.isArray(skill.focus) && skill.focus.length > 0)
          .map((skill: any) => `**${skill.name}:** ${skill.focus!.join(', ')}`)
          .join('\n')
      : '';
    
    if (focusText && focusText.trim().length > 0) {
      embed.addFields([{ name: '🎯 Focuses', value: focusText, inline: false }]);
    }

    // Show assets
    if (character.assets && Array.isArray(character.assets) && character.assets.length > 0) {
      const assetText = character.assets
        .filter((asset: any) => asset && asset.name)
        .map((asset: any) => `**${asset.name}** (${asset.type || 'Unknown'})`)
        .join('\n');
      if (assetText && assetText.trim().length > 0) {
        embed.addFields([{ name: '🎒 Assets', value: assetText, inline: false }]);
      }
    }

    // Show traits
    if (character.traits && Array.isArray(character.traits) && character.traits.length > 0) {
      const traitText = character.traits
        .filter((trait: any) => trait && trait.name)
        .map((trait: any) => `**${trait.name}** (${trait.type || 'Unknown'})`)
        .join('\n');
      if (traitText && traitText.trim().length > 0) {
        embed.addFields([{ name: '✨ Traits', value: traitText, inline: false }]);
      }
    }

    // Show drive statements
    const statementText = (character.drives && Array.isArray(character.drives))
      ? character.drives
          .filter((drive: any) => drive && drive.statement && drive.statement.trim().length > 0)
          .map((drive: any) => `**${drive.name}:** "${drive.statement}"`)
          .join('\n')
      : '';
    
    if (statementText && statementText.trim().length > 0) {
      embed.addFields([{ name: '📝 Drive Statements', value: statementText, inline: false }]);
    }
  } else {
    embed.setFooter({ text: 'Limited view - only owner can see full details' });
  }

  return embed;
}

// Export functions for bot.ts compatibility
export async function handleInteraction() {
  // This is a placeholder - the actual handling is done in the execute function
  throw new Error('handleInteraction should not be called directly - use the execute function instead');
}

export async function handleButtonInteraction() {
  // This is a placeholder - the actual handling is done in the execute function
  throw new Error('handleButtonInteraction should not be called directly - use the execute function instead');
}
