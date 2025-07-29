/**
 * Unified Character Creation Flow - Mare Synchronos Style Navigation
 */

import { 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  CommandInteraction, 
  EmbedBuilder, 
  ButtonInteraction, 
  ModalSubmitInteraction,
  StringSelectMenuInteraction,
  type GuildMember,
  type MessageComponentInteraction,
  type InteractionReplyOptions,
  type InteractionUpdateOptions,
  type MessageEditOptions,
  type StringSelectMenuBuilder
} from 'discord.js';
import type { 
  CharacterData, 
  CharacterCreationSession, 
  ResourcePools, 
  CreationStep 
} from '../types/character';
import { CREATION_STEPS } from '../types/character';
import { logger } from '../utils/logger';

// Default resource pools for new characters
const DEFAULT_RESOURCE_POOLS: ResourcePools = {
  health: 5,
  resolve: 5,
  momentum: 5
};

// Type for the session with additional properties
export interface ExtendedCharacterCreationSession extends Omit<CharacterCreationSession, 'currentStep' | 'channelId'> {
  guildId: string;
  userId: string;
  channelId: string | undefined;
  currentStep: keyof typeof CREATION_STEPS;
  characterData: Partial<CharacterData>;
  lastUpdated: number;
}



// Store character creation sessions
const characterCreationSessions = new Map<string, ExtendedCharacterCreationSession>();

/**
 * Unified Character Creation Flow - Mare Synchronos Style Navigation
 */


/**
 * Builds the navigation buttons (Previous/Next) for the character creation flow
 */
export function buildNavigationButtons(
  currentStep: keyof typeof CREATION_STEPS,
  session: ExtendedCharacterCreationSession
): ActionRowBuilder<ButtonBuilder> {
  const currentIndex = Object.values(CREATION_STEPS).indexOf(currentStep);
  const isFirstStep = currentIndex === 0;
  const isLastStep = currentIndex === Object.values(CREATION_STEPS).length - 1;
  const canContinue = canProceedToNext(currentStep, session.characterData);

  const row = new ActionRowBuilder<ButtonBuilder>();

  // Add Previous button if not on first step
  if (!isFirstStep) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`nav_prev_${session.userId}_${session.guildId}`)
        .setLabel('◀ Previous')
        .setStyle(ButtonStyle.Secondary)
    );
  }

  // Add Next/Complete button
  const nextButton = new ButtonBuilder()
    .setCustomId(`nav_next_${session.userId}_${session.guildId}`)
    .setStyle(ButtonStyle.Primary);

  if (isLastStep) {
    nextButton.setLabel('✅ Complete');
  } else {
    nextButton.setLabel('Next ▶');
    if (!canContinue) {
      nextButton.setDisabled(true);
    }
  }

  row.addComponents(nextButton);
  return row;
}



// Define the step descriptions for display
const STEP_DESCRIPTIONS = {
  [CREATION_STEPS.NAME]: '🏷️ **Set Your Character Name**\n\nChoose a name that fits the Dune universe. Consider names from various cultures and houses.',
  [CREATION_STEPS.CONCEPT]: '💭 **Define Your Character Concept**\n\nDescribe your character in a single phrase. Examples:\n• "Fremen desert warrior"\n• "Noble house spy seeking revenge"\n• "Guild navigator apprentice"',
  [CREATION_STEPS.ARCHETYPE]: '🎨 **Select Your Archetype**\n\nChoose the archetype that best represents your character\'s role and background in the Imperium.',
  [CREATION_STEPS.SKILLS]: '⚔️ **Assign Skill Points**\n\nDistribute points among the five core skills:\n• **Battle** - Combat and warfare\n• **Communicate** - Social interaction and manipulation\n• **Discipline** - Mental and physical self-control\n• **Move** - Physical movement and piloting\n• **Understand** - Knowledge and investigation',
  [CREATION_STEPS.FOCUSES]: '🎯 **Choose Skill Focuses**\n\nSelect specific areas of expertise within each skill you\'ve invested in. Each skill with points needs at least one focus.',
  [CREATION_STEPS.DRIVES]: '🔥 **Set Your Drives**\n\nChoose three drives that motivate your character. These represent your core beliefs and goals.',
  [CREATION_STEPS.DRIVE_STATEMENTS]: '📜 **Write Drive Statements**\n\nCreate specific statements for each of your drives that explain how they manifest in your character.',
  [CREATION_STEPS.TALENTS]: '✨ **Select Talents**\n\nChoose special abilities and talents that make your character unique.',
  [CREATION_STEPS.ASSETS]: '💼 **Choose Assets**\n\nSelect equipment, connections, and resources your character possesses.',
  [CREATION_STEPS.TRAITS]: '🎭 **Add Character Traits**\n\nDefine distinctive characteristics, flaws, and quirks that make your character memorable.',
  [CREATION_STEPS.STARTING_POOLS]: '📊 **Set Resource Pools**\n\nDetermine your starting Health, Resolve, and Momentum values.',
  [CREATION_STEPS.SUMMARY]: '📋 **Review Your Character**\n\nReview all your choices before finalizing your character.',
  [CREATION_STEPS.FINALIZE]: '✅ **Finalize Character**\n\nComplete the character creation process and save your character.'
} as const;

// Helper function to safely get resource pools with defaults
function getResourcePools(characterData: Partial<CharacterData>): ResourcePools {
  if (characterData.resourcePools) {
    const { health, resolve, momentum } = characterData.resourcePools;
    return {
      health: health || 5,
      resolve: resolve || 5,
      momentum: momentum || 2
    };
  } else {
    return DEFAULT_RESOURCE_POOLS;
  }
}

// Helper function to get the current step index
function getCurrentStepIndex(step: keyof typeof CREATION_STEPS): number {
  return Object.keys(CREATION_STEPS).indexOf(step);
}

// Helper function to get the total number of steps
function getTotalSteps(): number {
  return Object.keys(CREATION_STEPS).length;
}

// Helper function to build progress bar
function buildProgressBar(currentStep: keyof typeof CREATION_STEPS): string {
  const totalSteps = getTotalSteps();
  const currentStepIndex = getCurrentStepIndex(currentStep);
  const progress = Math.round(((currentStepIndex + 1) / totalSteps) * 10);
  return `[${'='.repeat(progress)}${' '.repeat(10 - progress)}] ${currentStepIndex + 1}/${totalSteps}`;
}

/**
 * Determines if the user can proceed to the next step in the character creation process
 */
function canProceedToNext(step: keyof typeof CREATION_STEPS, characterData: Partial<CharacterData>): boolean {
  switch (step) {
    case CREATION_STEPS.NAME:
      return !!(characterData.name && characterData.name.trim().length > 0);
    case CREATION_STEPS.CONCEPT:
      return !!(characterData.concepts && characterData.concepts.length > 0);
    case CREATION_STEPS.ARCHETYPE:
      return !!(characterData.archetypes && characterData.archetypes.length > 0);
    case CREATION_STEPS.SKILLS: {
      // Check if all required skills are assigned
      const skills = characterData.skills || {};
      return Object.values(skills).filter(v => v > 0).length >= 4; // At least 4 skills with points
    }
    case CREATION_STEPS.FOCUSES: {
      // Check if all skills with points have a focus
      const focuses = characterData.focuses || {};
      const skillsWithPoints = characterData.skills ? Object.entries(characterData.skills)
        .filter(([, value]) => value > 0)
        .map(([key]) => key) : [];
      return skillsWithPoints.every((skill: string) => focuses[skill]);
    }
    case CREATION_STEPS.DRIVES:
      // Require 3 drives
      return !!(characterData.drives && characterData.drives.length === 3);
    case CREATION_STEPS.TALENTS:
      // Talents are optional but recommended
      return true;
    case CREATION_STEPS.ASSETS:
      // Assets are optional
      return true;
    case CREATION_STEPS.TRAITS:
      // Traits are optional
      return true;
    case CREATION_STEPS.STARTING_POOLS: {
      // Check if all pools are set
      const pools = characterData.resourcePools;
      return !!(pools && 
               pools.health !== undefined &&
               pools.resolve !== undefined &&
               pools.momentum !== undefined);
    }
    case CREATION_STEPS.SUMMARY:
    case CREATION_STEPS.FINALIZE:
      return true;
    default:
      return false;
  }
}

async function buildStepEmbed(
  interaction: CommandInteraction | ButtonInteraction | ModalSubmitInteraction | StringSelectMenuInteraction,
  step: keyof typeof CREATION_STEPS,
  session: ExtendedCharacterCreationSession
): Promise<EmbedBuilder> {
  const { characterData } = session;
  const currentStepIndex = Object.values(CREATION_STEPS).indexOf(step) + 1;
  const totalSteps = Object.values(CREATION_STEPS).length;
  const progressBar = buildProgressBar(step);
  
  const embed = new EmbedBuilder()
    .setTitle('🎭 Character Creation')
    .setDescription(STEP_DESCRIPTIONS[step] || 'Complete this step to continue.')
    .setColor('#0099ff')
    .setFooter({ text: `${progressBar} • Step ${currentStepIndex} of ${totalSteps}` });

  // Handle different steps in character creation
  switch (step) {
    case CREATION_STEPS.NAME:
      embed.setDescription(STEP_DESCRIPTIONS[CREATION_STEPS.NAME]);
      break;
      
    case CREATION_STEPS.CONCEPT:
      embed.setDescription(STEP_DESCRIPTIONS[CREATION_STEPS.CONCEPT]);
      if (characterData.concepts && characterData.concepts.length > 0) {
        embed.addFields({
          name: 'Concept',
          value: characterData.concepts[0],
          inline: true
        });
      }
      break;
      
    case CREATION_STEPS.ARCHETYPE:
      embed.setDescription(STEP_DESCRIPTIONS[CREATION_STEPS.ARCHETYPE]);
      if (characterData.archetypes && characterData.archetypes.length > 0) {
        embed.addFields({
          name: 'Archetype',
          value: characterData.archetypes[0],
          inline: true
        });
      }
      break;
      
    case CREATION_STEPS.SKILLS:
      embed.setDescription(STEP_DESCRIPTIONS[CREATION_STEPS.SKILLS]);
      if (characterData.skills) {
        const skillsList = Object.entries(characterData.skills)
          .map(([skill, rank]) => `• ${skill}: ${rank}`)
          .join('\n');
        if (skillsList) {
          embed.addFields({
            name: 'Selected Skills',
            value: skillsList,
            inline: false
          });
        }
      }
      break;
      
    case CREATION_STEPS.FOCUSES:
      embed.setDescription(STEP_DESCRIPTIONS[CREATION_STEPS.FOCUSES]);
      if (characterData.focuses) {
        const focusesList = Object.entries(characterData.focuses)
          .map(([skill, focus]) => `• ${skill}: ${focus}`)
          .join('\n');
        if (focusesList) {
          embed.addFields({
            name: 'Selected Focuses',
            value: focusesList,
            inline: false
          });
        }
      }
      break;
      
    case CREATION_STEPS.DRIVES:
      embed.setDescription(STEP_DESCRIPTIONS[CREATION_STEPS.DRIVES]);
      if (characterData.drives && characterData.drives.length > 0) {
        embed.addFields({
          name: 'Selected Drives',
          value: characterData.drives.map(d => `• ${d}`).join('\n'),
          inline: false
        });
      }
      break;
      
    case CREATION_STEPS.DRIVE_STATEMENTS:
      embed.setDescription(STEP_DESCRIPTIONS[CREATION_STEPS.DRIVE_STATEMENTS]);
      if (characterData.statements && characterData.statements.length > 0) {
        embed.addFields({
          name: 'Drive Statements',
          value: characterData.statements.join('\n'),
          inline: false
        });
      }
      break;
      
    case CREATION_STEPS.TALENTS: {
      const talents = characterData.talents || [];
      embed.setTitle('Character Talents')
        .setDescription(STEP_DESCRIPTIONS[CREATION_STEPS.TALENTS])
        .setColor('#0099ff');
      
      if (talents.length > 0) {
        embed.addFields({
          name: 'Selected Talents',
          value: talents.map(t => `• ${t}`).join('\n'),
          inline: false
        });
      }
      break;
    }
    
    case CREATION_STEPS.ASSETS: {
      const assets = characterData.assets || [];
      embed.setTitle('Character Assets')
        .setDescription(STEP_DESCRIPTIONS[CREATION_STEPS.ASSETS])
        .setColor('#0099ff');
      
      if (assets.length > 0) {
        embed.addFields({
          name: 'Selected Assets',
          value: assets.map(a => `• ${a}`).join('\n'),
          inline: false
        });
      }
      break;
    }
    
    case CREATION_STEPS.TRAITS: {
      const traits = characterData.traits || [];
      embed.setTitle('Character Traits')
        .setDescription(STEP_DESCRIPTIONS[CREATION_STEPS.TRAITS])
        .setColor('#0099ff');
      
      if (traits.length > 0) {
        embed.addFields({
          name: 'Selected Traits',
          value: traits.map(t => `• ${t}`).join('\n'),
          inline: false
        });
      }
      break;
    }
    
    case CREATION_STEPS.STARTING_POOLS: {
      const resourcePools = getResourcePools(characterData);
      embed.setTitle('Starting Resource Pools')
        .setDescription(STEP_DESCRIPTIONS[CREATION_STEPS.STARTING_POOLS])
        .setColor('#0099ff')
        .addFields(
          { name: 'Health', value: resourcePools.health.toString(), inline: true },
          { name: 'Resolve', value: resourcePools.resolve.toString(), inline: true },
          { name: 'Momentum', value: resourcePools.momentum.toString(), inline: true }
        );
      break;
    }
    
    case CREATION_STEPS.SUMMARY: {
      const summary = [
        `**Name**: ${characterData.name || 'Not set'}`,
        `**Concept**: ${characterData.concepts?.length ? characterData.concepts[0] : 'Not set'}`,
        `**Archetype**: ${characterData.archetypes ? characterData.archetypes[0] : 'Not set'}`,
        `**Skills**: ${characterData.skills ? Object.entries(characterData.skills).map(([k, v]) => `${k} (${v})`).join(', ') : 'Not set'}`,
        `**Focuses**: ${characterData.focuses ? Object.entries(characterData.focuses).map(([k, v]) => `${k} (${v})`).join(', ') : 'Not set'}`,
        `**Drives**: ${characterData.drives ? characterData.drives.join(', ') : 'Not set'}`,
        `**Talents**: ${characterData.talents ? characterData.talents.join(', ') : 'Not set'}`,
        `**Assets**: ${characterData.assets ? characterData.assets.join(', ') : 'Not set'}`,
        `**Traits**: ${characterData.traits ? characterData.traits.join(', ') : 'Not set'}`
      ].join('\n');
      
      embed.setTitle('Character Summary')
        .setDescription(summary)
        .setColor('#00ff00');
      break;
    }
    
    case CREATION_STEPS.FINALIZE:
      embed.setDescription(STEP_DESCRIPTIONS[CREATION_STEPS.FINALIZE]);
      break;
      
    default:
      embed.setDescription(STEP_DESCRIPTIONS[step] || 'Complete this step to continue.');
  }
  
  return embed;
}

/**
 * Builds action row with step-specific buttons/menus
 */
function buildActionRow(
  step: keyof typeof CREATION_STEPS,
  session: ExtendedCharacterCreationSession
): ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder> | null {
  switch (step) {
    case CREATION_STEPS.NAME:
      return new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('name_edit')
            .setLabel('Edit Name')
            .setStyle(ButtonStyle.Secondary)
        );
    
    case CREATION_STEPS.CONCEPT:
      return new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('concept_set')
            .setLabel(session.characterData.concepts && session.characterData.concepts.length > 0 ? 'Edit Concept' : 'Set Concept')
            .setStyle(ButtonStyle.Primary)
        );
    
    case CREATION_STEPS.ARCHETYPE:
      return new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('archetype_select')
            .setLabel('Select Archetype')
            .setStyle(ButtonStyle.Primary)
        );
    
    case CREATION_STEPS.SKILLS:
      return new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('skills_assign')
            .setLabel('Assign Skills')
            .setStyle(ButtonStyle.Primary)
        );
    
    case CREATION_STEPS.FOCUSES:
      return new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('focuses_select')
            .setLabel('Select Focuses')
            .setStyle(ButtonStyle.Primary)
        );
    
    case CREATION_STEPS.DRIVES:
      return new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('drives_assign')
            .setLabel('Assign Drives')
            .setStyle(ButtonStyle.Primary)
        );
    
    case CREATION_STEPS.TALENTS:
      return new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('talents_select')
            .setLabel('Select Talents')
            .setStyle(ButtonStyle.Primary)
        );
    
    case CREATION_STEPS.ASSETS:
      return new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('assets_select')
            .setLabel('Select Assets')
            .setStyle(ButtonStyle.Primary)
        );
    
    case CREATION_STEPS.TRAITS:
      return new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('traits_select')
            .setLabel('Select Traits')
            .setStyle(ButtonStyle.Primary)
        );
    
    case CREATION_STEPS.STARTING_POOLS:
      return new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('pools_set')
            .setLabel('Set Resource Pools')
            .setStyle(ButtonStyle.Primary)
        );
    
    case CREATION_STEPS.SUMMARY:
      return new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('summary_review')
            .setLabel('Review Character')
            .setStyle(ButtonStyle.Secondary)
        );
    
    case CREATION_STEPS.FINALIZE:
      return new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('character_finalize')
            .setLabel('Finalize Character')
            .setStyle(ButtonStyle.Success)
        );
    
    default:
      return null;
  }
}

/**
 * Shows the character creation panel with the current step
 */
export async function showCreationPanel(
  interaction: CommandInteraction | ButtonInteraction | ModalSubmitInteraction | StringSelectMenuInteraction,
  member: GuildMember,
  step: CreationStep = CREATION_STEPS.NAME,
  successMessage?: string
): Promise<void> {
  if (!interaction.guildId) {
    await interaction.reply({
      content: 'This command can only be used in a server.',
      ephemeral: true
    });
    return;
  }

  const session = characterCreationSessions.get(interaction.user.id);
    
  if (!session) {
    await interaction.reply({
      content: 'No active character creation session found. Please start a new one with `/sheet create`',
      ephemeral: true
    });
    return;
  }
    
  // Ensure channelId is set
  if (!session.channelId && interaction.channelId) {
    session.channelId = interaction.channelId;
  }

  // Update the existing session with the current step
  const updatedSession: ExtendedCharacterCreationSession = {
    ...session,
    currentStep: step,
    lastUpdated: Date.now()
  };

  // Save the updated session
  characterCreationSessions.set(session.userId, updatedSession);

  try {
    // Build the embed for the current step
    const embed = await buildStepEmbed(interaction, step, updatedSession);
    
    // Build the navigation buttons
    const navigationRow = buildNavigationButtons(step, updatedSession);
    const actionRow = buildActionRow(step, updatedSession);
    
    // Prepare components array
    const components: (ActionRowBuilder<ButtonBuilder> | ActionRowBuilder<StringSelectMenuBuilder>)[] = [];
    
    // Try to combine navigation and action buttons in one row if both are buttons
    if (navigationRow && actionRow && actionRow.components[0] instanceof ButtonBuilder) {
      const combinedRow = new ActionRowBuilder<ButtonBuilder>();
      
      // Add navigation buttons first
      navigationRow.components.forEach(button => {
        combinedRow.addComponents(button);
      });
      
      // Add action button if there's space (max 5 buttons per row)
      if (navigationRow.components.length + actionRow.components.length <= 5) {
        actionRow.components.forEach(button => {
          combinedRow.addComponents(button as ButtonBuilder);
        });
        components.push(combinedRow);
      } else {
        // If too many buttons, use separate rows
        components.push(navigationRow);
        components.push(actionRow as ActionRowBuilder<ButtonBuilder>);
      }
    } else {
      // Add navigation row if it exists
      if (navigationRow) {
        components.push(navigationRow);
      }
      
      // Add action row if it exists
      if (actionRow) {
        if (actionRow.components[0] instanceof ButtonBuilder) {
          components.push(actionRow as ActionRowBuilder<ButtonBuilder>);
        } else {
          components.push(actionRow as ActionRowBuilder<StringSelectMenuBuilder>);
        }
      }
    }
    
    // Prepare the response
    const response: InteractionReplyOptions & InteractionUpdateOptions & MessageEditOptions = {
      embeds: [embed],
      components
    };
    
    // Add success message if provided
    if (successMessage) {
      response.content = successMessage;
    }
    
    // Send or update the message with the embed and components
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply(response);
    } else if (interaction.isModalSubmit()) {
      // For modal submissions, defer the update and then edit the reply
      await interaction.deferUpdate();
      await interaction.editReply(response);
    } else {
      await interaction.reply({
        ...response,
        ephemeral: true
      });
    }
    
    return;
  } catch (error) {
    logger.error('Error showing creation panel:', error);
    
    // Send an error message to the user
    const errorMessage = 'An error occurred while updating the character creation panel. Please try again.';
    
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply({
        content: errorMessage,
        components: []
      });
    } else {
      await interaction.reply({
        content: errorMessage,
        ephemeral: true
      });
    }
  }
}

/**
 * Handles navigation between character creation steps
 */
async function handleNavigation(
  interaction: MessageComponentInteraction,
  direction: 'prev' | 'next',
  session: ExtendedCharacterCreationSession
): Promise<void> {
  const currentStep = session.currentStep;
  const currentIndex = getCurrentStepIndex(currentStep);
  const totalSteps = getTotalSteps();

  // Calculate the new step index
  const newIndex = direction === 'next' 
    ? Math.min(currentIndex + 1, totalSteps - 1)
    : Math.max(currentIndex - 1, 0);

  // Get the new step key
  const newStep = Object.keys(CREATION_STEPS)[newIndex] as keyof typeof CREATION_STEPS;

  // Update the session with the new step
  const updatedSession: ExtendedCharacterCreationSession = {
    ...session,
    currentStep: newStep,
    lastUpdated: Date.now()
  };

  // Save the updated session
  characterCreationSessions.set(session.userId, updatedSession);

  // Show the updated panel
  if (interaction.isButton() || interaction.isStringSelectMenu()) {
    await showCreationPanel(interaction, interaction.member as GuildMember, newStep);
  }
}



// Export the handleNavigation function as handleNavigationButton, CREATION_STEPS, and characterCreationSessions
export { handleNavigation as handleNavigationButton, CREATION_STEPS, characterCreationSessions };

export type { CreationStep };
