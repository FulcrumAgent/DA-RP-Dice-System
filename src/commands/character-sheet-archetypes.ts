import { 
  ButtonInteraction,
  StringSelectMenuInteraction,
  ActionRowBuilder, 
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  GuildMember
} from 'discord.js';
import { characterCreationState } from '../utils/character-creation-state';
import { logger } from '../utils/logger';

// Complete Dune archetypes for character creation
export const BASIC_ARCHETYPES = [
  {
    value: 'agent',
    name: 'Agent',
    description: 'Espionage and covert operations specialist',
    emoji: '🕵️‍♂️'
  },
  {
    value: 'bene_gesserit',
    name: 'Bene Gesserit',
    description: 'Sisterhood member with Voice and political skills',
    emoji: '🔮'
  },
  {
    value: 'courtier',
    name: 'Courtier',
    description: 'Imperial court diplomat and schemer',
    emoji: '🎭'
  },
  {
    value: 'duellist',
    name: 'Duellist',
    description: 'Master of personal combat and formal duels',
    emoji: '⚔️'
  },
  {
    value: 'envoy',
    name: 'Envoy',
    description: 'Skilled negotiator between factions',
    emoji: '🤝'
  },
  {
    value: 'face_dancer',
    name: 'Face Dancer',
    description: 'Shape-shifting Bene Tleilax agent',
    emoji: '🎭'
  },
  {
    value: 'fremen',
    name: 'Fremen',
    description: 'Desert warrior and sandrider',
    emoji: '🏜️'
  },
  {
    value: 'guild_agent',
    name: 'Guild Agent',
    description: 'Spacing Guild representative',
    emoji: '🌌'
  },
  {
    value: 'mentat',
    name: 'Mentat',
    description: 'Human computer and strategist',
    emoji: '🧠'
  },
  {
    value: 'noble',
    name: 'Noble',
    description: 'Member of a Great House',
    emoji: '👑'
  },
  {
    value: 'swordmaster',
    name: 'Swordmaster',
    description: 'Elite warrior and bodyguard',
    emoji: '⚔️'
  },
  {
    value: 'trooper',
    name: 'Trooper',
    description: 'Professional military fighter',
    emoji: '🪖'
  },
  {
    value: 'smuggler',
    name: 'Smuggler',
    description: 'Black market trader and rogue',
    emoji: '🚀'
  },
  {
    value: 'planetologist',
    name: 'Planetologist',
    description: 'Planetary scientist and ecologist',
    emoji: '🔬'
  }
];

// Handle archetype selection button
export async function handleArchetypeSelectButton(interaction: ButtonInteraction) {
  try {
    // Defer the update once
    await interaction.deferUpdate();
    
    // Fetch the current message and embed
    const message = await interaction.fetchReply();
    const embed = message.embeds?.[0];

    // Create archetype selection menu
    const selectMenu = new ActionRowBuilder()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('archetype_choice')
          .setPlaceholder('Choose your character\'s archetype...')
          .addOptions(
            BASIC_ARCHETYPES.map(archetype =>
              new StringSelectMenuOptionBuilder()
                .setLabel(`${archetype.emoji} ${archetype.name}`)
                .setDescription(archetype.description)
                .setValue(archetype.value)
            )
          )
      );

    // Update the interaction with the selection menu
    await interaction.editReply({
      content: '\n\n**Choose your character\'s archetype:**',
      embeds: embed ? [embed] : [],
      components: [selectMenu.toJSON()]
    });

  } catch (error) {
    logger.error('Error in handleArchetypeSelectButton:', error);
    await interaction.editReply({
      content: '❌ An error occurred while showing archetype options.',
      components: [],
      embeds: interaction.message.embeds ? interaction.message.embeds : []
    });
  }
}

// Handle archetype choice from select menu
export async function handleArchetypeChoice(interaction: StringSelectMenuInteraction, member: GuildMember): Promise<void> {
  try {
    // Get the selected archetype
    const selectedValue = interaction.values[0];
    const selectedArchetype = BASIC_ARCHETYPES.find(arch => arch.value === selectedValue);

    // Update the character creation state with the selected archetype
    if (!selectedArchetype) {
      await interaction.editReply({
        content: '❌ Invalid archetype selection. Please try again.',
        components: [],
        embeds: interaction.message.embeds ? interaction.message.embeds : []
      });
      return;
    }

    await characterCreationState.updateState(member.id, interaction.guild!.id, {
      data: { archetypes: [selectedArchetype.name] }
    });

    // Update the creation panel with the new archetype
    try {
      // Update the message with the new archetype selection
      await interaction.deferUpdate();
      await interaction.editReply({
        content: selectedArchetype ? `✅ **${selectedArchetype.emoji} ${selectedArchetype.name}** selected!` : '❌ Invalid archetype selection.',
        embeds: interaction.message.embeds ? interaction.message.embeds : [],
        components: []
      });

      // Show the next step
      const { CREATION_STEPS, showCreationPanel } = await import('./character-creation-flow');
      await showCreationPanel(interaction, member, CREATION_STEPS.SKILLS, selectedArchetype ? `✅ **${selectedArchetype.emoji} ${selectedArchetype.name}** selected!` : '❌ Invalid archetype selection.');
    } catch (error) {
      logger.error('Error showing updated creation panel:', error);
      await interaction.editReply({
        content: '❌ Failed to update character creation panel. Please try again.',
        components: [],
        embeds: interaction.message.embeds ? interaction.message.embeds : []
      });
      return;
    }
  } catch (error) {
    logger.error('Error in handleArchetypeChoice:', error);
    await interaction.editReply({
      content: '❌ An error occurred while selecting the archetype.',
      components: [],
      embeds: interaction.message.embeds ? interaction.message.embeds : []
    });
  }
}
