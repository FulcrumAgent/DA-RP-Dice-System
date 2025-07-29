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

// Example talents - expand this list as needed
const AVAILABLE_TALENTS = [
  { id: 'mentat', name: 'Mentat', description: 'Advanced mental calculation and data processing' },
  { id: 'weirding_way', name: 'Weirding Way', description: 'Bene Gesserit martial arts and voice control' },
  { id: 'swordmaster', name: 'Swordmaster', description: 'Mastery of bladed weapons' },
  { id: 'desert_survival', name: 'Desert Survival', description: 'Expertise in surviving in desert environments' },
  { id: 'mentat_memory', name: 'Mentat Memory', description: 'Perfect recall of information' },
  { id: 'voice', name: 'The Voice', description: 'Power to control others with vocal patterns' },
  { id: 'prescience', name: 'Prescience', description: 'Limited ability to see possible futures' },
  { id: 'shield_fighter', name: 'Shield Fighter', description: 'Specialized in shield combat techniques' },
  { id: 'diplomat', name: 'Diplomat', description: 'Skilled in negotiation and politics' },
  { id: 'smuggler', name: 'Smuggler', description: 'Expertise in moving goods undetected' },
  { id: 'mechanic', name: 'Mechanic', description: 'Skill with machinery and technology' },
  { id: 'healer', name: 'Healer', description: 'Medical knowledge and first aid skills' }
];

export async function handleTalentsSelect(interaction: ButtonInteraction, member: GuildMember) {
  const state = characterCreationState.getState(member.id, interaction.guild!.id);
  if (!state) {
    await interaction.reply({ content: 'No character creation in progress.', ephemeral: true });
    return;
  }

  const selectedTalents = state.data.talents || [];
  const availableTalents = AVAILABLE_TALENTS.filter(t => !selectedTalents.includes(t.id));
  
  // If all talents are selected or no more available, show current selection
  if (availableTalents.length === 0) {
    await showTalentsOverview(interaction, member, selectedTalents);
    return;
  }

  // Create select menu for available talents
  const talentSelect = new StringSelectMenuBuilder()
    .setCustomId('select_talent')
    .setPlaceholder('Select a talent to add')
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(
      availableTalents.map(talent => ({
        label: talent.name,
        description: talent.description,
        value: talent.id
      }))
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(talentSelect);
  
  await interaction.reply({
    content: 'Select a talent to add to your character:',
    components: [row],
    ephemeral: true
  });
}

export async function handleTalentSelect(interaction: StringSelectMenuInteraction, member: GuildMember) {
  const talentId = interaction.values[0];
  const talent = AVAILABLE_TALENTS.find(t => t.id === talentId);
  
  if (!talent) {
    await interaction.reply({ content: 'Invalid talent selected.', ephemeral: true });
    return;
  }

  const state = characterCreationState.getState(member.id, interaction.guild!.id);
  if (!state) {
    await interaction.reply({ content: 'No character creation in progress.', ephemeral: true });
    return;
  }

  // Add talent to selected talents
  const updatedTalents = [...(state.data.talents || []), talentId];
  
  // Update state
  await characterCreationState.updateState(member.id, interaction.guild!.id, {
    data: { ...state.data, talents: updatedTalents },
    lastUpdated: Date.now()
  });

  // Show updated talents
  await showTalentsOverview(interaction, member, updatedTalents);
}

export async function showTalentsOverview(interaction: ButtonInteraction | StringSelectMenuInteraction, member: GuildMember, talentIds: string[] = []) {
  const selectedTalents = talentIds.map(id => AVAILABLE_TALENTS.find(t => t.id === id)).filter(Boolean);
  
  const embed = new EmbedBuilder()
    .setTitle('Character Talents')
    .setDescription('Special abilities and training for your character')
    .setColor(0xD4AF37);

  if (selectedTalents.length > 0) {
    embed.addFields(
      selectedTalents.map((talent, index) => ({
        name: `🎯 ${talent?.name || `Talent ${index + 1}`}`,
        value: talent?.description || 'No description available',
        inline: true
      }))
    );
  } else {
    embed.setDescription('No talents selected yet. Click the button below to add talents.');
  }

  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('talents_select')
        .setLabel(selectedTalents.length > 0 ? 'Add Another Talent' : 'Select Talents')
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
}
