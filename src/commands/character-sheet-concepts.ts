/**
 * Free-form Concept Selection Functions for Character Sheet
 */

import { 
  CommandInteraction, 
  ButtonInteraction,
  EmbedBuilder,
  GuildMember,
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalSubmitInteraction
} from 'discord.js';
import { characterCreationState } from '../utils/character-creation-state';
import { logger } from '../utils/logger';

// Main concept selection handler
export async function handleSelectConcept(interaction: CommandInteraction, member: GuildMember) {
  await interaction.deferReply();

  try {
    const state = characterCreationState.getState(member.id, interaction.guild!.id);
    if (!state || !state.data.name) {
      await interaction.editReply({
        content: '❌ No character creation in progress. Use `/sheet create` first!'
      });
      return;
    }

    // Initialize concepts array if not exists
    if (!state.data.concepts) {
      await characterCreationState.updateState(member.id, interaction.guild!.id, { 
        data: { concepts: [] } 
      });
    }

    const currentConcepts = state.data.concepts || [];
    const hasConcept = currentConcepts.length > 0;

    // Create concept management embed
    const embed = new EmbedBuilder()
      .setColor(0xD4AF37)
      .setTitle('🎭 Character Concept')
      .setDescription(`Your character concept is a single, descriptive phrase or sentence that captures their essence, background, or role.\n\n**Examples:** "Fremen desert warrior", "Noble house spy seeking revenge", "Smuggler with a code of honor"\n\n**Current Concept:**\n${hasConcept ? `**${currentConcepts[0]}**` : '*None selected*'}\n\n${hasConcept ? '✅ **Ready to continue!** Use the "Next Step" button to proceed to Archetype selection (where you can choose multiple traits).' : 'Use the "Set Concept" button to define your character.'}`);

    // Create action buttons
    const buttonRow = new ActionRowBuilder<ButtonBuilder>();
    
    // Set/Edit concept button
    buttonRow.addComponents(
      new ButtonBuilder()
        .setCustomId('concept_set')
        .setLabel(hasConcept ? 'Edit Concept' : 'Set Concept')
        .setStyle(ButtonStyle.Primary)
    );
    
    // Remove concept button (if has concept)
    if (hasConcept) {
      buttonRow.addComponents(
        new ButtonBuilder()
          .setCustomId('concept_remove')
          .setLabel('Clear Concept')
          .setStyle(ButtonStyle.Danger)
      );
    }
    
    // Continue button (if has concept)
    if (hasConcept) {
      buttonRow.addComponents(
        new ButtonBuilder()
          .setCustomId('concept_continue')
          .setLabel('Next Step: Archetype')
          .setStyle(ButtonStyle.Success)
      );
    }

    const components = buttonRow.components.length > 0 ? [buttonRow] : [];

    await interaction.editReply({
      embeds: [embed],
      components: components
    });

  } catch (error) {
    logger.error('Error in handleSelectConcept:', error);
    await interaction.editReply({
      content: '❌ An error occurred while loading concept selection.'
    });
  }
}

// Handle set concept button - shows modal for text input
export async function handleConceptSetButton(interaction: ButtonInteraction, member: GuildMember) {
  try {
    const state = characterCreationState.getState(member.id, interaction.guild!.id);
    const currentConcept = state?.data.concepts?.[0] || '';
    
    const modal = new ModalBuilder()
      .setCustomId('concept_set_modal')
      .setTitle(currentConcept ? 'Edit Character Concept' : 'Set Character Concept');

    const conceptInput = new TextInputBuilder()
      .setCustomId('concept_text')
      .setLabel('Character Concept')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('e.g., "Fremen desert warrior", "Noble house spy seeking revenge"')
      .setRequired(true)
      .setMaxLength(200)
      .setValue(currentConcept);

    const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(conceptInput);
    modal.addComponents(actionRow);

    await interaction.showModal(modal);
  } catch (error) {
    logger.error('Error in handleConceptAddButton:', error);
    await interaction.reply({
      content: '❌ An error occurred while opening the concept input.',
      ephemeral: true
    });
  }
}

// Handle modal submission for setting concept
export async function handleConceptSetModal(interaction: ModalSubmitInteraction, member: GuildMember) {
  try {
    const conceptText = interaction.fields.getTextInputValue('concept_text').trim();
    
    if (!conceptText) {
      await interaction.reply({
        content: '❌ Concept cannot be empty.',
        ephemeral: true
      });
      return;
    }

    const state = characterCreationState.getState(member.id, interaction.guild!.id);
    if (!state || !state.data.name) {
      await interaction.reply({
        content: '❌ No character creation in progress.',
        ephemeral: true
      });
      return;
    }
    
    // Set the single concept (replaces any existing one)
    await characterCreationState.updateState(member.id, interaction.guild!.id, { 
      data: { concepts: [conceptText] } 
    });

    // Acknowledge the modal submission without sending a new message
    await interaction.deferUpdate();

    // Find and update the original character creation message
    try {
      const channel = interaction.channel;
      if (channel && 'messages' in channel) {
        // Look for recent messages from the bot with character creation content
        const messages = await channel.messages.fetch({ limit: 20 });
        const characterCreationMessage = messages.find(msg => 
          msg.author.id === interaction.client.user?.id &&
          msg.embeds.length > 0 &&
          (msg.embeds[0].title?.includes('Character Creation') || 
           msg.embeds[0].title?.includes('Character Concept') ||
           msg.embeds[0].title?.includes('Character Name'))
        );

        if (characterCreationMessage) {
          // Update the original message with the new concept
          const guildId = interaction.guild?.id;
          if (!guildId) {
            await interaction.followUp({ content: 'This command must be used in a server.', ephemeral: true });
            return;
          }
          
          const state = characterCreationState.getState(member.id, guildId);
          if (!state) {
            await interaction.followUp({ content: 'No character creation in progress.', ephemeral: true });
            return;
          }
          
          const creationFlow = await import('./character-creation-flow');
          
          // Create a proper ExtendedCharacterCreationSession object
          const session = {
            ...state,
            guildId,
            userId: member.id,
            channelId: interaction.channelId || undefined, // Ensure it's undefined instead of null
            characterData: state.tempData || {},
            currentStep: 'CONCEPT',
            lastUpdated: Date.now(),
            createdAt: state.createdAt || Date.now(),
            step: 'CONCEPT',
            data: state.data || {},
            tempData: state.tempData || {}
          };
          
          // @ts-ignore - buildStepEmbed is dynamically added
          const embed = await creationFlow.buildStepEmbed(interaction, 'CONCEPT', session);
          // @ts-ignore - buildNavigationButtons is dynamically added
          const buttons = creationFlow.buildNavigationButtons('CONCEPT', session);
          
          await characterCreationMessage.edit({
            embeds: [embed],
            components: buttons.components.length > 0 ? [buttons] : []
          });
        }
      }
    } catch (updateError) {
      logger.warn('Could not update original character creation message:', updateError);
      // If we can't update the original message, at least acknowledge the interaction
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '✅ Concept updated successfully!',
          ephemeral: true
        });
      } else {
        await interaction.followUp({
          content: '✅ Concept updated successfully!',
          ephemeral: true
        });
      }
    }

  } catch (error) {
    logger.error('Error in handleConceptSetModal:', error);
    await interaction.reply({
      content: '❌ An error occurred while setting the concept.',
      ephemeral: true
    });
  }
}

// Handle remove concept button - clears the single concept
export async function handleConceptRemoveButton(interaction: ButtonInteraction, member: GuildMember) {
  try {
    const state = characterCreationState.getState(member.id, interaction.guild!.id);
    if (!state || !state.data.name) {
      await interaction.reply({
        content: '❌ No character creation in progress.',
        ephemeral: true
      });
      return;
    }

    const currentConcept = state.data.concepts?.[0];
    
    if (!currentConcept) {
      await interaction.reply({
        content: '❌ No concept to remove.',
        ephemeral: true
      });
      return;
    }

    // Clear the concept
    await characterCreationState.updateState(member.id, interaction.guild!.id, { 
      data: { concepts: [] } 
    });

    // Update the unified navigation panel to show the cleared concept
    const { showCreationPanel, CREATION_STEPS } = await import('./character-creation-flow');
    await showCreationPanel(interaction, member, CREATION_STEPS.CONCEPT);

  } catch (error) {
    logger.error('Error in handleConceptRemoveButton:', error);
    await interaction.reply({
      content: '❌ An error occurred while clearing the concept.',
      ephemeral: true
    });
  }
}

// Handle continue button - moves to archetype selection
export async function handleConceptContinueButton(interaction: ButtonInteraction, member: GuildMember) {
  // Move to the archetype step in the unified navigation
  const { showCreationPanel, CREATION_STEPS } = await import('./character-creation-flow');
  await showCreationPanel(interaction, member, CREATION_STEPS.ARCHETYPE);
}

// Handle back button (for ButtonInteraction)
export async function handleConceptBackButton(interaction: ButtonInteraction, member: GuildMember) {
  await handleSelectConcept(interaction as unknown as CommandInteraction, member);
}
