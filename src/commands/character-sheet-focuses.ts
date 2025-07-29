import { 
  ActionRowBuilder, 
  EmbedBuilder, 
  StringSelectMenuBuilder, 
  StringSelectMenuInteraction,
  ButtonInteraction,
  GuildMember
} from 'discord.js';
import { characterCreationState } from '../utils/character-creation-state';
import { showCreationPanel } from './character-creation-flow';
import { logger } from '../utils/logger';
import { CREATION_STEPS } from './character-creation-flow';
import type { CharacterData, CharacterCreationState } from '../types/character-types';

interface Focus {
  skill: string;
  focus: string;
  description: string;
}

/**
 * Official focus list organized by skill
 * Each skill has an array of available focuses with descriptions
 */
const FOCUS_OPTIONS: Record<string, Focus[]> = {
  Battle: [
    { skill: 'Battle', focus: 'Blades', description: 'Expertise with melee weapons' },
    { skill: 'Battle', focus: 'Projectiles', description: 'Proficiency with ranged weapons' },
    { skill: 'Battle', focus: 'Unarmed', description: 'Mastery of hand-to-hand combat' },
    { skill: 'Battle', focus: 'Tactics', description: 'Strategic battlefield thinking' }
  ],
  Communicate: [
    { skill: 'Communicate', focus: 'Negotiation', description: 'Reaching agreements through discussion' },
    { skill: 'Communicate', focus: 'Deception', description: 'Manipulating others' },
    { skill: 'Communicate', focus: 'Diplomacy', description: 'Formal negotiations and treaties' },
    { skill: 'Communicate', focus: 'Seduction', description: 'Romantic persuasion' }
  ],
  Discipline: [
    { skill: 'Discipline', focus: 'Fear', description: 'Resistance to fear and intimidation' },
    { skill: 'Discipline', focus: 'Pain', description: 'Endurance of physical pain' },
    { skill: 'Discipline', focus: 'Temptation', description: 'Resistance to temptation and corruption' },
    { skill: 'Discipline', focus: 'Concentration', description: 'Mental focus and clarity' }
  ],
  Move: [
    { skill: 'Move', focus: 'Ornithopters', description: 'Piloting ornithopters' },
    { skill: 'Move', focus: 'Groundcars', description: 'Expertise with ground vehicles' },
    { skill: 'Move', focus: 'Animals', description: 'Handling and riding animals' },
    { skill: 'Move', focus: 'Stealth', description: 'Moving unseen' },
    { skill: 'Move', focus: 'Desert', description: 'Surviving in arid environments' },
    { skill: 'Move', focus: 'Urban', description: 'Navigating cities' },
    { skill: 'Move', focus: 'Wilderness', description: 'Surviving in natural environments' }
  ],
  Understand: [
    { skill: 'Understand', focus: 'Emotions', description: 'Understanding emotional states' },
    { skill: 'Understand', focus: 'Deception', description: 'Detecting lies and manipulation' },
    { skill: 'Understand', focus: 'Motivation', description: 'Understanding what drives people' },
    { skill: 'Understand', focus: 'Empathy', description: 'Feeling and sharing emotions' },
    { skill: 'Understand', focus: 'History', description: 'Knowledge of past events and cultures' },
    { skill: 'Understand', focus: 'Religion', description: 'Understanding religious practices' },
    { skill: 'Understand', focus: 'Culture', description: 'Knowledge of social customs' },
    { skill: 'Understand', focus: 'Science', description: 'Scientific knowledge and principles' },
    { skill: 'Understand', focus: 'Medicine', description: 'Medical knowledge and practice' },
    { skill: 'Understand', focus: 'Technology', description: 'Understanding and working with technology' },
    { skill: 'Understand', focus: 'Spice', description: 'Understanding spice and its effects' }
  ]
};

export async function handleFocusesSelect(interaction: ButtonInteraction, member: GuildMember) {
  try {
    if (!interaction.guildId) {
      await interaction.reply({
        content: '❌ This command must be used in a server channel.',
        ephemeral: true
      });
      return;
    }

    // Get the current state
    const state = characterCreationState.getState(member.id, interaction.guildId);
    if (!state) {
      await interaction.reply({
        content: '❌ No character creation in progress. Use `/character create` to start.',
        ephemeral: true
      });
      return;
    }
    
    // Ensure we have valid character data
    if (!state.data) {
      await interaction.reply({
        content: '❌ Invalid character data. Please start a new character creation.',
        ephemeral: true
      });
      return;
    }
    
    // Defer the reply to avoid interaction timeout
    await interaction.deferUpdate();

    // Build the focus panel
    const panel = await buildFocusPanel(
      member,
      state
    );

    if (!panel) {
      // If no panel is returned, it means either all focuses are already selected
      // or there was an error building the panel
      const { showCreationPanel } = await import('./character-creation-flow');
      
      // Check if all skills have focuses assigned
      const skills = state.data.skills || {};
      const focuses = state.data.focuses || {};
      const allSkillsHaveFocuses = Object.entries(skills).every(([skill, value]) => {
        // Ensure value is a number before comparison
        const skillValue = typeof value === 'number' ? value : 0;
        return skillValue === 0 || (focuses && typeof focuses[skill] === 'string');
      });
      
      if (allSkillsHaveFocuses) {
        // All skills have focuses, move to the next step (DRIVES)
        await showCreationPanel(
          interaction,
          member,
          CREATION_STEPS.DRIVES,
          '✅ All focuses have been selected! Moving to the next step.'
        );
      } else {
        // Some skills don't have focuses, but no panel was returned - this is an error
        logger.error('Failed to build focus panel but not all skills have focuses');
        await interaction.editReply({
          content: '❌ An error occurred while building the focus selection panel. Please try again.',
          components: [],
          embeds: []
        });
      }
      return;
    }

    // Update the interaction with the focus panel
    await interaction.editReply({
      embeds: [panel.embed],
      components: [panel.menu]
    });

  } catch (error) {
    logger.error('Error in handleFocusesSelect:', error);
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply({
        content: '❌ An error occurred while showing the focus selection panel.',
        components: [],
        embeds: []
      });
    } else {
      await interaction.reply({
        content: '❌ An error occurred while showing the focus selection panel.',
        ephemeral: true
      });
    }
  }
}

interface BuildFocusPanelResult {
  embed: EmbedBuilder;
  menu: ActionRowBuilder<StringSelectMenuBuilder>;
  skill: string;
  value: number;
}

/**
 * Builds a focus selection panel for the next skill that needs a focus
 * @param member The guild member creating the character
 * @param state The current character creation state
 * @param guildId The ID of the guild where the command was used
 * @returns A panel with embed and menu components, or null if no skills need focuses
 */
async function buildFocusPanel(
  member: GuildMember,
  state: CharacterCreationState
): Promise<BuildFocusPanelResult | null> {
  try {
    if (!state.data) {
      logger.warn('No character data found in state');
      return null;
    }

    const characterData = state.data;
    const skills = characterData.skills || {};
    const focuses = characterData.focuses || {};

    // Get the next skill that needs a focus
    // Find the next skill that needs a focus (value > 0 and no focus assigned)
    const nextSkill = Object.entries(skills).find(([skill, value]) => {
      const skillValue = typeof value === 'number' ? value : 0;
      return skillValue > 0 && !focuses[skill];
    });

    if (!nextSkill) {
      return null; // No more skills need focuses
    }

    const [skill, value] = nextSkill;
    const currentFocuses = Object.entries(focuses);
    const availableFocuses = FOCUS_OPTIONS[skill] || [];
    const usedFocuses = new Set(currentFocuses.map(([, f]) => f));

    // Filter out already selected focuses and ensure we have valid focus objects
    const filteredFocuses = availableFocuses.filter((f): f is Focus => {
      return typeof f === 'object' && 
             f !== null && 
             'focus' in f && 
             typeof f.focus === 'string' &&
             !usedFocuses.has(f.focus);
    });

    if (filteredFocuses.length === 0) {
      // If no focuses are available, log a warning and return null
      logger.warn(`No available focuses for skill: ${skill}`);
      return null;
    }

    // Create the select menu with proper validation
    if (!filteredFocuses || filteredFocuses.length === 0) {
      logger.warn(`No valid focuses available for skill: ${skill}`);
      return null;
    }

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('focus_select')
      .setPlaceholder(`Select a focus for ${skill} (${value})`)
      .addOptions(
        filteredFocuses
          .filter((f): f is Focus => !!f && typeof f === 'object' && 'focus' in f && 'description' in f)
          .map(focus => ({
            label: focus.focus.slice(0, 100), // Ensure label is within Discord's limits
            description: (focus.description || '').slice(0, 100), // Ensure description is within limits
            value: `${skill}:${focus.focus}`.slice(0, 100), // Ensure value is within limits
          }))
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    // Build the embed
    const embed = new EmbedBuilder()
      .setTitle('Select Focus')
      .setDescription(`### Select a focus for ${skill} (${value})\n\nEach skill can have one focus. Choose carefully as this represents your character's area of expertise.`)
      .setColor('#0099ff');

    // Add current focuses if any
    if (currentFocuses.length > 0) {
      // Filter out any undefined or null values
      const validFocuses = currentFocuses.filter(([, f]) => f);
      if (validFocuses.length > 0) {
        embed.addFields({
          name: 'Current Focuses',
          value: validFocuses.map(([s, f]) => `• **${s}**: ${f}`).join('\n'),
          inline: false
        });
      }
    }

    return { 
      embed, 
      menu: row, 
      skill, 
      value: typeof value === 'number' ? value : 0 
    };
  } catch (error) {
    logger.error('Error in buildFocusPanel:', error);
    return null;
  }
}

export async function handleFocusSelect(interaction: StringSelectMenuInteraction, member: GuildMember) {
  try {
    if (!interaction.guildId) {
      await interaction.reply({
        content: '❌ This command must be used in a server channel.',
        ephemeral: true
      });
      return;
    }

    // First defer the update
    await interaction.deferUpdate();

    // Get current state
    const state = characterCreationState.getState(member.id, interaction.guildId);
    if (!state || !state.data) {
      await interaction.editReply({
        content: '❌ No character creation in progress or invalid state.',
        components: [],
        embeds: []
      });
      return;
    }

    // Get selected focus with validation
    const selectedValue = interaction.values[0];
    if (typeof selectedValue !== 'string') {
      await interaction.editReply({
        content: '❌ Invalid focus selection. Please try again.',
        components: [],
        embeds: []
      });
      return;
    }
    
    const [skill, focus] = selectedValue.split(':');
    if (!skill || !focus) {
      await interaction.editReply({
        content: '❌ Invalid focus format. Please try again.',
        components: [],
        embeds: []
      });
      return;
    }
    
    // Get current character data with type safety
    const currentData = state.data;
    
    // Update focuses with proper typing
    const updatedFocuses: Record<string, string> = {
      ...(currentData.focuses || {})
    };
    
    // Set the new focus for the skill
    updatedFocuses[skill] = focus;
    
    // Update the character data with the new focus
    await characterCreationState.updateState(member.id, interaction.guildId, {
      data: {
        ...currentData,
        focuses: updatedFocuses
      }
    });

    // Get the updated state
    const updatedState = characterCreationState.getState(member.id, interaction.guildId);
    if (!updatedState) {
      await interaction.editReply({
        content: '❌ Error: Failed to get updated state.',
        components: [],
        embeds: []
      });
      return;
    }

    // Get the updated character data
    const updatedData = updatedState.data as CharacterData;
    const currentSkills = updatedData.skills || {};
    const currentFocuses = updatedData.focuses || {};
    
    // Check if we have all required focuses with type safety
    const skillsNeedingFocus = Object.entries(currentSkills).reduce((count, [, value]) => {
      const skillValue = typeof value === 'number' ? value : 0;
      return count + (skillValue > 0 ? 1 : 0);
    }, 0);
    
    const selectedFocusesCount = Object.values(currentFocuses).filter(f => 
      typeof f === 'string' && f.trim() !== ''
    ).length;
    
    if (selectedFocusesCount >= skillsNeedingFocus) {
      // All required focuses are selected, move to the next step
      await showCreationPanel(
        interaction, 
        member, 
        'DRIVES',
        `✅ Selected focus: ${focus} (${skill})`
      );
      return;
    }

    // Show the updated creation panel with the current focus selection
    await showCreationPanel(
      interaction, 
      member, 
      'FOCUSES',
      `✅ Selected ${skill} focus: ${focus}!`
    );

  } catch (error) {
    logger.error('Error in handleFocusSelect:', error);
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply({
        content: '❌ An error occurred while processing your focus selection. Please try again.',
        components: [],
        embeds: []
      });
    } else {
      await interaction.reply({
        content: '❌ An error occurred while processing your focus selection. Please try again.',
        ephemeral: true
      });
    }
  }
}
