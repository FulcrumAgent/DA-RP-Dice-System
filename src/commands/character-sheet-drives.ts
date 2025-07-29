import { 
  ButtonInteraction, 
  StringSelectMenuInteraction, 
  ActionRowBuilder, 
  StringSelectMenuBuilder, 
  EmbedBuilder, 
  ButtonBuilder,
  GuildMember
} from 'discord.js';
import { characterCreationState } from '../utils/character-creation-state';

export const DUNE_DRIVES: readonly string[] = ['Duty', 'Faith', 'Justice', 'Power', 'Truth'] as const;
const DRIVE_VALUES = [8, 7, 6, 5, 4] as const;

export async function handleDrivesSelect(interaction: ButtonInteraction, member: GuildMember) {
  const state = characterCreationState.getState(member.id, interaction.guild!.id);
  if (!state) {
    await interaction.reply({ content: 'No character creation in progress.', ephemeral: true });
    return;
  }

  // Initialize drives if not exists
  const currentDrives = state.data.drives || {};
  
  // If all drives are assigned, show current assignments
  if (Object.keys(currentDrives).length === DUNE_DRIVES.length) {
    if (!interaction.guild || !interaction.guildId) {
      await interaction.reply({ content: 'This command must be used in a server.', ephemeral: true });
      return;
    }
    await showDrivesOverview(interaction, member, interaction.guild, interaction.guildId, currentDrives);
    return;
  }

  // Create select menu for drives
  const driveSelect = new StringSelectMenuBuilder()
    .setCustomId('select_drive')
    .setPlaceholder('Select a drive to assign a value to')
    .addOptions(
      DUNE_DRIVES
        .filter(drive => !(drive in currentDrives))
        .map(drive => ({
          label: drive,
          description: `Assign a value to ${drive}`,
          value: drive
        }))
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(driveSelect);
  
  await interaction.reply({
    content: 'Select a drive to assign a value to:',
    components: [row],
    ephemeral: true
  });
}

export async function handleDriveSelect(interaction: StringSelectMenuInteraction, member: GuildMember) {
  const drive = interaction.values[0];
  const state = characterCreationState.getState(member.id, interaction.guild!.id);
  if (!state) {
    await interaction.reply({ content: 'No character creation in progress.', ephemeral: true });
    return;
  }

  const currentDrives = state.data.drives || {};
  const assignedValues = Object.values(currentDrives);
  const remainingValues = DRIVE_VALUES.filter(v => !assignedValues.includes(v));

  // Create select menu for available values
  const valueSelect = new StringSelectMenuBuilder()
    .setCustomId(`select_drive_value:${drive}`)
    .setPlaceholder(`Select a value for ${drive}`)
    .addOptions(
      remainingValues.map(value => ({
        label: value.toString(),
        description: `Assign ${value} to ${drive}`,
        value: value.toString()
      }))
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(valueSelect);
  
  await interaction.update({
    content: `Select a value to assign to ${drive}:`,
    components: [row]
  });
}

export async function handleDriveValueSelect(interaction: StringSelectMenuInteraction, member: GuildMember) {
  const [, drive] = interaction.customId.split(':');
  const value = parseInt(interaction.values[0]);
  
  const state = characterCreationState.getState(member.id, interaction.guild!.id);
  if (!state) {
    await interaction.reply({ content: 'No character creation in progress.', ephemeral: true });
    return;
  }

  // Update drives
  const updatedDrives = { ...(state.data.drives || {}), [drive]: value };
  
  // Update state
  await characterCreationState.updateState(member.id, interaction.guild!.id, {
    data: { ...state.data, drives: updatedDrives },
    lastUpdated: Date.now()
  });

  // Show updated drives
  if (!interaction.guild || !interaction.guildId) {
    await interaction.reply({ content: 'This command must be used in a server.', ephemeral: true });
    return;
  }
  await showDrivesOverview(interaction, member, interaction.guild, interaction.guildId, updatedDrives);
}

export async function showDrivesOverview(interaction: ButtonInteraction | StringSelectMenuInteraction, member: GuildMember, guild: unknown, guildId: string, drives: unknown) {
  const embed = new EmbedBuilder()
    .setTitle('Character Drives')
    .setDescription('Your character\'s core motivations and beliefs')
    .setColor(0xD4AF37);

  // Ensure drives is treated as a string array
  const drivesArray = Array.isArray(drives) ? drives : [];
  
  const driveFields = DUNE_DRIVES.map((drive, index) => {
    const driveValue = drivesArray[index] || 'Not assigned';
    
    return {
      name: `🔹 ${drive}`,
      value: `**${driveValue}**`,
      inline: true
    };
  });

  embed.addFields(driveFields);

  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('drives_select')
        .setLabel('Edit Drives')
        .setStyle(1) // Primary
    );

  if (interaction.deferred || interaction.replied) {
    await interaction.editReply({
      embeds: [embed],
      components: [row],
      content: ''
    });
  } else {
    await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true
    });
  }
  
  return embed;
}
