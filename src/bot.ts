/**
 * Main Discord bot entry point
 */

import { 
  Client, 
  GatewayIntentBits, 
  Collection, 
  REST, 
  Routes, 
  TextInputBuilder, 
  GuildMember,
  ActivityType,
  CommandInteraction,
  ChatInputCommandInteraction,
  ButtonInteraction,
  StringSelectMenuInteraction,
  ModalSubmitInteraction,
  AutocompleteInteraction,
  Interaction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} from 'discord.js';
import { config } from 'dotenv';
import { logger } from './utils/logger';
import { DataManager } from './utils/database';
import { testDatabaseConnection } from './utils/prisma';
import { prismaCharacterManager } from './utils/prisma-character-manager';
import * as http from 'http';



// Command imports
import { 
  diceRollerCommands, 
  handleRollCommand, 
  handleRollHelpCommand 
} from './commands/dice-roller';
import { 
  duneSystemCommands, 
  handleDuneRollCommand, 
  handleMomentumCommand, 
  handleDuneHelpCommand
} from './commands/dune-system';
import * as duneReferenceCommand from './commands/dune-reference';

import * as sceneHostCommand from './commands/scene-host';
import * as characterSheetCommand from './commands/character-sheet';
import { handleButtonInteraction as handleCharacterSheetButton } from './commands/character-sheet-handlers';
import { handleFinalizeButton, handleCancelButton } from './commands/character-sheet-buttons';
import { serverSetupCommand, handleServerSetupCommand } from './commands/server-setup';

import * as referenceCommand from './commands/reference';
import * as npcManagerCommand from './commands/npc-manager';
import { handleSaveGeneratedNPC, handleSaveNPCNameModal } from './commands/npc-manager';
import { avatarCommand, handleAvatarCommand, handleAvatarAutocomplete } from './commands/avatar-manager';


class DuneBot {
  private client: Client;
  private commands: Collection<string, { name: string; [key: string]: any }>;

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
      ]
    });

    this.commands = new Collection();
    this.setupEventHandlers();
    this.registerCommands();
  }

  private setupEventHandlers(): void {
    this.client.once('ready', () => {
      logger.info(`Bot logged in as ${this.client.user?.tag}`);
      
      // Set bot presence
      this.client.user?.setPresence({
        activities: [{
          name: 'Dune: Adventures in the Imperium',
          type: ActivityType.Playing
        }],
        status: 'online'
      });


    });

    this.client.on('interactionCreate', async (interaction: Interaction) => {
      await this.handleInteraction(interaction);
    });

    this.client.on('error', (error: Error) => {
      logger.error('Discord client error:', error);
    });

    this.client.on('warn', (warning: string) => {
      logger.warn('Discord client warning:', warning);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      logger.info('Received SIGINT, shutting down gracefully...');
      this.client.destroy();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      logger.info('Received SIGTERM, shutting down gracefully...');
      this.client.destroy();
      process.exit(0);
    });
  }

  private registerCommands(): void {
    // Register all commands
    const allCommands = [
      ...diceRollerCommands,
      ...duneSystemCommands,
      sceneHostCommand.data,
      characterSheetCommand.data,
      referenceCommand.data,
      npcManagerCommand.data,
      avatarCommand,
      serverSetupCommand
    ];

    allCommands.forEach((command: { name: string; [key: string]: any }) => {
      this.commands.set(command.name, command);
    });

    logger.info(`Registered ${this.commands.size} slash commands`);
  }

  private async handleCommand(interaction: CommandInteraction): Promise<void> {
    if (!interaction.isCommand()) {
      return;
    }

    const { commandName } = interaction;

    try {
      switch (commandName) {
        case 'roll':
          await handleRollCommand(interaction as ChatInputCommandInteraction);
          break;
        case 'roll-help':
          await handleRollHelpCommand(interaction);
          break;
        case 'dune-roll':
          await handleDuneRollCommand(interaction as ChatInputCommandInteraction);
          break;
        case 'momentum':
          await handleMomentumCommand(interaction as ChatInputCommandInteraction);
          break;
        case 'dune-help':
          await handleDuneHelpCommand(interaction);
          break;
        case 'dune-reference':
          await duneReferenceCommand.execute(interaction as ChatInputCommandInteraction);
          break;
        case 'scene':
          await sceneHostCommand.execute(interaction as ChatInputCommandInteraction);
          break;
        case 'sheet':
          await characterSheetCommand.execute(interaction as ChatInputCommandInteraction);
          break;

        case 'lookup':
          await referenceCommand.execute(interaction as ChatInputCommandInteraction);
          break;
        case 'npc':
          await npcManagerCommand.execute(interaction as ChatInputCommandInteraction);
          break;
        case 'avatar':
          await handleAvatarCommand(interaction as ChatInputCommandInteraction);
          break;
        case 'setup-server':
          await handleServerSetupCommand(interaction);
          break;
        default:
          logger.warn(`Unknown command: ${commandName}`);
          await interaction.reply({
            content: '❌ Unknown command.',
            ephemeral: true
          });
      }
    } catch (error) {
      logger.error(`Error handling command ${commandName}:`, error);
      
      if (interaction.isRepliable()) {
        try {
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
              content: '❌ An error occurred while processing your command.',
              ephemeral: true
            });
          } else {
            await interaction.reply({
              content: '❌ An error occurred while processing your command.',
              ephemeral: true
            });
          }
        } catch (e) {
          logger.error('Failed to send error response:', e);
        }
      }
    }
  }

  private async handleAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
    if (!interaction.isAutocomplete()) {
      return;
    }

    const { commandName } = interaction;

    try {
      switch (commandName) {
        case 'npc':
          if ('autocomplete' in npcManagerCommand) {
            await npcManagerCommand.autocomplete(interaction);
          } else {
            await interaction.respond([]);
          }
          break;
        case 'dune-roll':
          const { autocomplete: duneAutocomplete } = await import('./commands/dune-system');
          await duneAutocomplete(interaction);
          break;
        case 'avatar':
          await handleAvatarAutocomplete(interaction);
          break;
        default:
          await interaction.respond([]);
      }
    } catch (error) {
      logger.error(`Error handling autocomplete for ${commandName}:`, error);
      
      try {
        await interaction.respond([]);
      } catch (e) {
        logger.error('Failed to send error response:', e);
      }
    }
  }


  private async handleInteraction(interaction: Interaction): Promise<void> {
    try {
      if (interaction.isCommand()) {
        await this.handleCommand(interaction);
      } else if (interaction.isAutocomplete()) {
        await this.handleAutocomplete(interaction as AutocompleteInteraction);
      } else if (interaction.isButton()) {
        await this.handleButton(interaction as ButtonInteraction);
      } else if (interaction.isStringSelectMenu()) {
        await this.handleSelectMenu(interaction as StringSelectMenuInteraction);
      } else if (interaction.isModalSubmit()) {
        await this.handleModalSubmit(interaction as ModalSubmitInteraction);
      } else {
        logger.warn(`Unknown interaction type: ${interaction.type}`);
      }
    } catch (error) {
      logger.error('Error in handleInteraction:', error);
      if (interaction.isRepliable()) {
        try {
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
              content: '❌ An error occurred while processing your request.',
              ephemeral: true
            });
          } else {
            await interaction.reply({
              content: '❌ An error occurred while processing your request.',
              ephemeral: true
            });
          }
        } catch (e) {
          logger.error('Failed to send error response:', e);
        }
      }
    }
  }

  private async handleSelectMenu(interaction: StringSelectMenuInteraction): Promise<void> {
    if (!interaction.isStringSelectMenu()) {
      return;
    }

    try {
      // Character creation select menus
      if (interaction.customId.startsWith('character_creation_') || interaction.customId.startsWith('canon_')) {
        const { CharacterCreator } = await import('./commands/character-creator.js');
        await CharacterCreator.handleSelectMenu(interaction);
        return;
      }
      
      // All legacy handlers removed - unified system handles all character creation
      // through CharacterCreator class with character_creation_ prefix
      {
        logger.warn(`Unhandled select menu interaction: ${interaction.customId}`);
        await interaction.reply({
          content: '❌ This select menu is not currently handled.',
          ephemeral: true
        });
      }
    } catch (error) {
      logger.error('Error handling interaction:', error);
      if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ An error occurred while processing your request.',
          ephemeral: true
        }).catch(e => logger.error('Failed to send error response:', e));
      }
    }
  }

  private async handleButton(interaction: ButtonInteraction): Promise<void> {
    if (!interaction.isButton()) {
      return;
    }

    try {
      // Handle navigation buttons
      if (interaction.customId.startsWith('nav_')) {
        if (interaction.customId.startsWith('nav_prev_') || interaction.customId.startsWith('nav_next_')) {
          const direction = interaction.customId.startsWith('nav_prev_') ? 'prev' : 'next';
          
          // Import the character creation flow to get the session and navigation handler
          const { characterCreationSessions, handleNavigationButton } = await import('./commands/character-creation-flow.js');
          
          const session = characterCreationSessions.get(interaction.user.id);
          if (!session) {
            await interaction.reply({
              content: '❌ No character creation in progress.',
              ephemeral: true
            });
            return;
          }

          // Use the unified navigation handler
          await handleNavigationButton(interaction, direction, session);
          return;
        }
      }

      // Handle dice roll buttons
      if (interaction.customId.startsWith('roll_')) {
        const rollType = interaction.customId.replace('roll_', '');
        await this.handleDiceRollButton(interaction, rollType);
        return;
      }

      // Handle other button types
      switch (interaction.customId) {
        case 'concept_set': {
          const member = interaction.member as GuildMember;
          if (member) {
            await this.handleConceptSetButton(interaction);
          }
          break;
        }
        case 'concept_clear': {
          const memberClear = interaction.member as GuildMember;
          if (memberClear) {
            await this.handleConceptClearButton(interaction, memberClear);
          }
          break;
        }
        case 'concept_continue': {
          const memberContinue = interaction.member as GuildMember;
          if (memberContinue) {
            await this.handleConceptContinueButton(interaction);
          }
          break;
        }
        case 'name_edit': {
          const memberNameEdit = interaction.member as GuildMember;
          if (memberNameEdit) {
            await this.handleNameEditButton(interaction);
          }
          break;
        }
        // Legacy button handlers removed - unified system handles all character creation
        // through CharacterCreator class with character_creation_ prefix
        // Character creator buttons
        case 'character_creation_set_name':
        case 'character_creation_set_concept':
        case 'character_creation_select_archetypes':
        case 'character_creation_assign_drives':
        case 'character_creation_write_statements':
        case 'character_creation_assign_skills':
        case 'character_creation_select_focuses':
        case 'character_creation_select_talents':
        case 'character_creation_select_assets':
        case 'character_creation_prev':
        case 'character_creation_next':
        case 'character_creation_finalize':
        case 'character_creation_cancel':
        case 'canon_prev':
        case 'canon_next':
        case 'canon_select_focuses':
        case 'canon_select_talents':
        case 'canon_select_assets':
        case 'canon_finalize': {
          const { CharacterCreator } = await import('./commands/character-creator.js');
          await CharacterCreator.handleButton(interaction);
          break;
        }

        // Focus system buttons
        case 'focus_back':
        case 'focus_continue': {
          const memberFocus = interaction.member as GuildMember;
          if (memberFocus) {
            await handleCharacterSheetButton(interaction);
          }
          break;
        }

        // Finalize and cancel buttons
        case 'finalize_character': {
          const memberFinalize = interaction.member as GuildMember;
          if (memberFinalize) {
            await handleFinalizeButton(interaction);
          }
          break;
        }

        case 'cancel_character': {
          const memberCancel = interaction.member as GuildMember;
          if (memberCancel) {
            await handleCancelButton(interaction);
          }
          break;
        }

        // Character deletion confirmation buttons
        case 'confirm_delete': {
          const memberConfirmDelete = interaction.member as GuildMember;
          if (memberConfirmDelete) {
            const { prismaCharacterManager } = await import('./utils/prisma-character-manager.js');
            await this.handleConfirmDeleteButton(interaction, memberConfirmDelete, prismaCharacterManager);
          }
          break;
        }

        case 'cancel_delete': {
          const memberCancelDelete = interaction.member as GuildMember;
          if (memberCancelDelete) {
            await this.handleCancelDeleteButton(interaction);
          }
          break;
        }

        // Character editing buttons
        case 'edit_name':
        case 'edit_concepts':
        case 'edit_drives':
        case 'edit_skills':
        case 'edit_statements':
        case 'save_character':
        case 'cancel_editing': {
          const memberEdit = interaction.member as GuildMember;
          if (memberEdit) {
            const { handleEditingButton } = await import('./commands/character-sheet.js');
            await handleEditingButton(interaction);
          }
          break;
        }

        default:
          // Handle dynamic focus remove buttons
          if (interaction.customId.startsWith('focus_remove_')) {
            const memberFocusRemove = interaction.member as GuildMember;
            if (memberFocusRemove) {
              await handleCharacterSheetButton(interaction);
            }
            break;
          }
          
          // Save generated NPC button
          if (interaction.customId.startsWith('save_generated_npc_')) {
            const memberSaveNPC = interaction.member as GuildMember;
            if (memberSaveNPC) {
              await handleSaveGeneratedNPC(interaction);
            }
            break;
          }
          
          // Generate Momentum button
          if (interaction.customId.startsWith('generate_momentum_')) {
            await this.handleGenerateMomentumButton(interaction);
            break;
          }
          
          // Spend Momentum button
          if (interaction.customId.startsWith('spend_momentum_')) {
            await this.handleSpendMomentumButton(interaction);
            break;
          }
          
          // Add Threat button
          if (interaction.customId.startsWith('add_threat_')) {
            await this.handleAddThreatButton(interaction);
            break;
          }
          
          // Confirm Spend Momentum button
          if (interaction.customId.startsWith('confirm_spend_momentum_')) {
            await this.handleConfirmSpendMomentumButton(interaction);
            break;
          }
          
          // Original default case
          logger.warn(`Unhandled button interaction: ${interaction.customId}`);
          await interaction.reply({
            content: '❌ This button is not currently handled.',
            ephemeral: true
          });
      }
    } catch (error) {
      logger.error('Error handling button interaction:', error);
      
      if (interaction.isRepliable()) {
        try {
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
              content: '❌ An error occurred while processing your button click.',
              ephemeral: true
            });
          } else {
            await interaction.reply({
              content: '❌ An error occurred while processing your button click.',
              ephemeral: true
            });
          }
        } catch (e) {
          logger.error('Failed to send error response:', e);
        }
      }
    }
  }

  private async handleModalSubmit(interaction: ModalSubmitInteraction): Promise<void> {
    if (!interaction.isModalSubmit()) {
      return;
    }

    try {
      const member = interaction.member as GuildMember;
      
      // New character creator modals
      if (interaction.customId === 'character_creation_name_modal' || 
          interaction.customId === 'character_creation_concept_modal' || 
          interaction.customId === 'character_creation_drives_modal' ||
          interaction.customId === 'character_creation_drive_statements_modal' ||
          interaction.customId === 'character_creation_skills_modal') {
        const { CharacterCreator } = await import('./commands/character-creator.js');
        await CharacterCreator.handleModal(interaction);
      }
      // Handle concept set modal (old system)
      else if (interaction.customId === 'concept_set_modal') {
        await this.handleConceptSetModal(interaction);
      }
      // Handle character editing modals
      else if (interaction.customId === 'edit_name_modal' || 
               interaction.customId === 'edit_concepts_modal' ||
               interaction.customId === 'edit_drives_modal' ||
               interaction.customId === 'edit_skills_modal' ||
               interaction.customId === 'edit_statements_modal') {
        const { handleEditingModal } = await import('./commands/character-sheet.js');
        await handleEditingModal(interaction);
      }
      // Handle NPC name modal
      else if (interaction.customId.startsWith('save_npc_name_')) {
        await handleSaveNPCNameModal(interaction, member);
      }
      // Handle name edit modal (old system) - not implemented
      else if (interaction.customId === 'name_edit_modal') {
        logger.warn('Name edit modal not implemented');
        await interaction.reply({
          content: '❌ Name edit modal not implemented.',
          ephemeral: true
        });
      }
      // Handle focus input modals
      else if (interaction.customId.startsWith('focus_input_') || interaction.customId.startsWith('statement_input_')) {
        // Focus input modals need to be handled directly
        logger.warn(`Focus input modal not implemented: ${interaction.customId}`);
        await interaction.reply({
          content: '❌ Focus input modal not implemented.',
          ephemeral: true
        });
      } else {
        logger.warn(`Unknown modal submit interaction: ${interaction.customId}`);
        await interaction.reply({
          content: '❌ Unknown modal submit interaction.',
          ephemeral: true
        });
      }
    } catch (error) {
      logger.error('Error handling modal submit:', error);
      
      if (interaction.isRepliable()) {
        try {
          await interaction.reply({
            content: '❌ An error occurred while processing the form.',
            ephemeral: true
          });
        } catch (e) {
          logger.error('Failed to send error response:', e);
        }
      }
    }
  }

  private async handleDiceRollButton(interaction: ButtonInteraction, rollType: string): Promise<void> {
    if (!interaction.isButton()) {
      return;
    }

    try {
      await interaction.reply({
        content: `Rolling ${rollType}...`,
        ephemeral: true
      });
    } catch (error) {
      logger.error('Error handling dice roll button:', error);
      
      if (interaction.isRepliable()) {
        try {
          await interaction.reply({
            content: '❌ Failed to process dice roll.',
            ephemeral: true
          });
        } catch (e) {
          logger.error('Failed to send error response:', e);
        }
      }
    }
  }



  private async handleSkillSelection(interaction: StringSelectMenuInteraction): Promise<void> {
    if (!interaction.isStringSelectMenu()) {
      return;
    }

    try {
      // Skill selection needs to be handled directly
      logger.warn(`Skill selection not implemented: ${interaction.customId}`);
      await interaction.reply({
        content: '❌ Skill selection not implemented.',
        ephemeral: true
      });
    } catch (error) {
      logger.error('Error handling skill selection:', error);
      if (interaction.isRepliable()) {
        await interaction.reply({
          content: '❌ An error occurred while processing your selection.',
          ephemeral: true
        }).catch(e => logger.error('Failed to send error response:', e));
      }
    }
  }

  // Character creation button handlers
  private async handleNameEditButton(interaction: ButtonInteraction): Promise<void> {
    try {
      const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = await import('discord.js');
      
      const modal = new ModalBuilder()
        .setCustomId('name_edit_modal')
        .setTitle('Set Character Name');

      const nameInput = new TextInputBuilder()
        .setCustomId('character_name')
        .setLabel('Character Name')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Enter your character name...')
        .setRequired(true)
        .setMaxLength(50);

      const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput);
      modal.addComponents(firstActionRow);

      await interaction.showModal(modal);
    } catch (error) {
      logger.error('Error showing name edit modal:', error);
      await interaction.reply({
        content: '❌ Failed to open name editor.',
        ephemeral: true
      });
    }
  }

  private async handleNameEditModal(interaction: ModalSubmitInteraction, member: GuildMember): Promise<void> {
    try {
      const characterName = interaction.fields.getTextInputValue('character_name');
      
      // Import the character creation flow to update the session
      const { characterCreationSessions, showCreationPanel } = await import('./commands/character-creation-flow.js');
      
      const session = characterCreationSessions.get(interaction.user.id);
      if (!session) {
        await interaction.reply({
          content: '❌ No character creation session found.',
          ephemeral: true
        });
        return;
      }

      // Update the character name in the session
      session.characterData.name = characterName;
      
      // Update the existing message instead of creating a new one
      // Use interaction.update() to modify the same message
      await showCreationPanel(interaction, member, session.currentStep, `✅ Character name set to "${characterName}". Click **Next** to continue to the Concept step.`);
    } catch (error) {
      logger.error('Error handling name edit modal:', error);
      await interaction.reply({
        content: '❌ Failed to update character name.',
        ephemeral: true
      });
    }
  }

  private async handleArchetypeSelectButton(interaction: ButtonInteraction): Promise<void> {
    try {
      // Import the character creation flow to check session
      const { characterCreationSessions } = await import('./commands/character-creation-flow.js');
      
      const session = characterCreationSessions.get(interaction.user.id);
      if (!session) {
        await interaction.reply({
          content: '❌ No character creation session found. Please start a new one with `/sheet create`',
          ephemeral: true
        });
        return;
      }

      // For now, provide a placeholder response until archetype system is fully integrated
      await interaction.reply({
        content: '⚙️ Archetype selection is being integrated with the new character creation system. This feature will be available soon!',
        ephemeral: true
      });
    } catch (error) {
      logger.error('Error handling archetype select:', error);
      await interaction.reply({
        content: '❌ Archetype selection is not available yet.',
        ephemeral: true
      });
    }
  }

  private async handleSkillsAssignButton(interaction: ButtonInteraction): Promise<void> {
    try {
      // Skills assignment needs to be handled directly
      logger.warn(`Skills assignment not implemented: ${interaction.customId}`);
      await interaction.reply({
        content: '❌ Skills assignment not implemented.',
        ephemeral: true
      });
    } catch (error) {
      logger.error('Error handling skills assign:', error);
      await interaction.reply({
        content: '❌ Skills assignment is not available yet.',
        ephemeral: true
      });
    }
  }

  private async handleFocusesSelectButton(interaction: ButtonInteraction): Promise<void> {
    try {
      // Skills assignment needs to be handled directly
      logger.warn(`Skills assignment not implemented: ${interaction.customId}`);
      await interaction.reply({
        content: '❌ Skills assignment not implemented.',
        ephemeral: true
      });
    } catch (error) {
      logger.error('Error handling focuses select:', error);
      await interaction.reply({
        content: '❌ Focus selection is not available yet.',
        ephemeral: true
      });
    }
  }

  private async handleDrivesAssignButton(interaction: ButtonInteraction): Promise<void> {
    try {
      // Skills assignment needs to be handled directly
      logger.warn(`Skills assignment not implemented: ${interaction.customId}`);
      await interaction.reply({
        content: '❌ Skills assignment not implemented.',
        ephemeral: true
      });
    } catch (error) {
      logger.error('Error handling drives assign:', error);
      await interaction.reply({
        content: '❌ Drives assignment is not available yet.',
        ephemeral: true
      });
    }
  }

  private async handleTalentsSelectButton(interaction: ButtonInteraction): Promise<void> {
    try {
      // Skills assignment needs to be handled directly
      logger.warn(`Skills assignment not implemented: ${interaction.customId}`);
      await interaction.reply({
        content: '❌ Skills assignment not implemented.',
        ephemeral: true
      });
    } catch (error) {
      logger.error('Error handling talents select:', error);
      await interaction.reply({
        content: '❌ Talents selection is not available yet.',
        ephemeral: true
      });
    }
  }

  private async handleConceptSetButton(interaction: ButtonInteraction): Promise<void> {
    try {
      // Import the character creation flow to check session
      const { characterCreationSessions } = await import('./commands/character-creation-flow.js');
      
      const session = characterCreationSessions.get(interaction.user.id);
      if (!session) {
        await interaction.reply({
          content: '❌ No character creation session found. Please start a new one with `/sheet create`',
          ephemeral: true
        });
        return;
      }

      // Create the concept modal directly instead of delegating to old handler
      const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = await import('discord.js');
      
      const currentConcept = session.characterData.concepts?.[0] || '';
      
      const modal = new ModalBuilder()
        .setCustomId('concept_set_modal')
        .setTitle(currentConcept ? 'Edit Character Concept' : 'Set Character Concept');

      const conceptInput = new TextInputBuilder()
        .setCustomId('concept_text')
        .setLabel('Character Concept')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('e.g., "Fremen desert warrior", "Noble house spy seeking revenge"')
        .setRequired(true)
        .setMaxLength(200);
        
      if (currentConcept) {
        conceptInput.setValue(currentConcept);
      }

      const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(conceptInput);
      modal.addComponents(actionRow);

      await interaction.showModal(modal);
    } catch (error) {
      logger.error('Error handling concept set:', error);
      await interaction.reply({
        content: '❌ Concept setting is not available yet.',
        ephemeral: true
      });
    }
  }

  private async handleConceptSetModal(interaction: ModalSubmitInteraction): Promise<void> {
    try {
      // Import the character creation flow to update the session
      const { characterCreationSessions } = await import('./commands/character-creation-flow.js');
      
      const session = characterCreationSessions.get(interaction.user.id);
      if (!session) {
        await interaction.reply({
          content: '❌ No character creation session found.',
          ephemeral: true
        });
        return;
      }

      // Get the concept from the modal
      const concept = interaction.fields.getTextInputValue('concept_text');
      
      // Update the character concept in the session
      if (!session.characterData.concepts) {
        session.characterData.concepts = [];
      }
      session.characterData.concepts = [concept]; // Replace with new concept
      
      // Find and edit the original character creation message directly
      const channel = interaction.channel;
      if (channel && 'messages' in channel) {
        const messages = await channel.messages.fetch({ limit: 10 });
        const botMessage = messages.find(msg => 
          msg.author.id === interaction.client.user?.id && 
          msg.embeds.length > 0 && 
          msg.embeds[0].title?.includes('Character Creation')
        );
        
        if (botMessage && botMessage.embeds[0]) {
          // Update the existing embed with success message
          const currentEmbed = botMessage.embeds[0];
          const { EmbedBuilder } = await import('discord.js');
          
          const updatedEmbed = new EmbedBuilder()
            .setColor(currentEmbed.color)
            .setTitle(currentEmbed.title)
            .setDescription(`✅ **Character concept set to "${concept}".**\n\nClick **Next** to continue to the Archetype step.`)
            .setFooter(currentEmbed.footer);
            
          // Copy any fields from the original embed
          if (currentEmbed.fields) {
            updatedEmbed.addFields(currentEmbed.fields);
          }
          
          await botMessage.edit({
            embeds: [updatedEmbed],
            components: botMessage.components // Keep the same buttons
          });
          
          // Acknowledge the modal silently
          await interaction.deferReply({ ephemeral: true });
          await interaction.deleteReply();
          return;
        }
      }
      
      // Fallback if we can't find the original message
      await interaction.reply({
        content: `✅ Character concept set to "${concept}".`,
        ephemeral: true
      });
    } catch (error) {
      logger.error('Error handling concept set modal:', error);
      await interaction.reply({
        content: '❌ Failed to update character concept.',
        ephemeral: true
      });
    }
  }

  private async handleConceptClearButton(interaction: ButtonInteraction, member: GuildMember): Promise<void> {
    try {
      // Import the character creation flow to update the session
      const { characterCreationSessions, showCreationPanel } = await import('./commands/character-creation-flow.js');
      
      const session = characterCreationSessions.get(interaction.user.id);
      if (!session) {
        await interaction.reply({
          content: '❌ No character creation session found.',
          ephemeral: true
        });
        return;
      }

      // Clear the character concept in the session
      session.characterData.concepts = [];
      
      // Update the existing message
      await showCreationPanel(interaction, member, session.currentStep, `✅ Character concept cleared.`);
    } catch (error) {
      logger.error('Error handling concept clear:', error);
      await interaction.reply({
        content: '❌ Failed to clear character concept.',
        ephemeral: true
      });
    }
  }

  private async handleConceptContinueButton(interaction: ButtonInteraction): Promise<void> {
    try {
      // Import the character creation flow to handle navigation
      const { characterCreationSessions, handleNavigationButton } = await import('./commands/character-creation-flow.js');
      
      const session = characterCreationSessions.get(interaction.user.id);
      if (!session) {
        await interaction.reply({
          content: '❌ No character creation session found.',
          ephemeral: true
        });
        return;
      }

      // Use the navigation handler to move to the next step
      await handleNavigationButton(interaction, 'next', session);
    } catch (error) {
      logger.error('Error handling concept continue:', error);
      await interaction.reply({
        content: '❌ Failed to continue from concept step.',
        ephemeral: true
      });
    }
  }

  private async handleConfirmDeleteButton(interaction: ButtonInteraction, member: GuildMember, characterManager: { deleteCharacter: Function; getUserCharacters: Function }): Promise<void> {
    try {
      // Get the character name from the original message content
      const messageContent = interaction.message.content;
      const nameMatch = messageContent.match(/delete "(.+?)"/);
      
      if (!nameMatch) {
        await interaction.reply({
          content: '❌ Could not determine which character to delete.',
          ephemeral: true
        });
        return;
      }
      
      const characterName = nameMatch[1];
      const userCharacters = characterManager.getUserCharacters(member.id, interaction.guild!.id);
      const character = userCharacters.find((char: { name: string }) => char.name.toLowerCase() === characterName.toLowerCase());
      
      if (!character) {
        await interaction.reply({
          content: '❌ Character not found.',
          ephemeral: true
        });
        return;
      }
      
      // Verify ownership
      if (character.userId !== member.id) {
        await interaction.reply({
          content: '❌ You can only delete your own characters.',
          ephemeral: true
        });
        return;
      }
      
      // Delete the character
      await characterManager.deleteCharacter(character.id, member.id);
      
      await interaction.update({
        content: `💀 Character **${character.name}** has been deleted. Farewell, ${character.concepts.join(', ')}.`,
        components: []
      });
    } catch (error) {
      logger.error('Error handling confirm delete:', error);
      await interaction.reply({
        content: '❌ Failed to delete character.',
        ephemeral: true
      });
    }
  }

  private async handleCancelDeleteButton(interaction: ButtonInteraction): Promise<void> {
    try {
      await interaction.update({
        content: '✅ Character deletion cancelled.',
        components: []
      });
    } catch (error) {
      logger.error('Error handling cancel delete:', error);
      await interaction.reply({
        content: '❌ Failed to cancel deletion.',
        ephemeral: true
      });
    }
  }

  public async deployCommands(): Promise<void> {
    config(); // Load environment variables
    const botConfig = {
      discordToken: process.env.DISCORD_TOKEN,
      clientId: process.env.CLIENT_ID,
      guildId: process.env.GUILD_ID
    };
    
    if (!botConfig.discordToken) {
      throw new Error('Discord token not found in configuration');
    }

    const rest = new REST({ version: '10' }).setToken(botConfig.discordToken);
    const commands = Array.from(this.commands.values()).map(command => command.toJSON());

    try {
      logger.info('Started refreshing application (/) commands...');

      if (botConfig.guildId) {
        // Deploy to specific guild (faster for development)
        await rest.put(
          Routes.applicationGuildCommands(botConfig.clientId!, botConfig.guildId),
          { body: commands }
        );
        logger.info(`Successfully reloaded ${commands.length} guild commands`);
      } else {
        // Deploy globally (takes up to 1 hour to propagate)
        await rest.put(
          Routes.applicationCommands(botConfig.clientId!),
          { body: commands }
        );
        logger.info(`Successfully reloaded ${commands.length} global commands`);
      }

    } catch (error) {
      logger.error('Error deploying commands:', error);
      throw error;
    }
  }

  public async start(): Promise<void> {
    config(); // Load environment variables
    const botConfig = {
      discordToken: process.env.DISCORD_TOKEN,
      clientId: process.env.CLIENT_ID,
      guildId: process.env.GUILD_ID
    };
    
    if (!botConfig.discordToken) {
      throw new Error('Discord token not found in configuration');
    }

    try {
      // Test database connection first
      logger.info('Testing database connection...');
      const dbConnected = await testDatabaseConnection();
      if (!dbConnected) {
        throw new Error('Failed to connect to database');
      }
      
      // Deploy commands
      await this.deployCommands();
      
      // Login to Discord
      await this.client.login(botConfig.discordToken);
      
      // Start HTTP server for Railway health checks
      this.startHealthServer();
      
    } catch (error) {
      logger.error('Failed to start bot:', error);
      throw error;
    }
  }

  /**
   * Start a simple HTTP server for Railway health checks
   */
  private startHealthServer(): void {
    const port = process.env.PORT || 3000;
    
    const server = http.createServer((req, res) => {
      if (req.url === '/' || req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'healthy',
          service: 'dune-discord-bot',
          timestamp: new Date().toISOString(),
          uptime: process.uptime()
        }));
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      }
    });

    server.listen(port, () => {
      logger.info(`Health server listening on port ${port}`);
    });

    server.on('error', (error) => {
      logger.error('Health server error:', error);
    });
  }

  public getClient(): Client {
    return this.client;
  }

  private async handleGenerateMomentumButton(interaction: ButtonInteraction): Promise<void> {
    try {
      // Parse the custom ID to extract guild, channel, and momentum amount
      // Format: generate_momentum_{guildId}_{channelId}_{amount}
      const parts = interaction.customId.split('_');
      if (parts.length < 5) {
        throw new Error('Invalid button ID format');
      }
      
      const guildId = parts[2];
      const channelId = parts[3];
      const momentumAmount = parseInt(parts[4]);
      
      if (isNaN(momentumAmount) || momentumAmount <= 0) {
        throw new Error('Invalid momentum amount');
      }
      
      // Update momentum pool
      const database = new DataManager();
      const updatedPool = await database.updateMomentum(guildId, channelId, momentumAmount);
      
      await interaction.reply({
        content: `✨ **Generated ${momentumAmount} Momentum!**\n\n🎯 **Current Pool:** ${updatedPool.momentum} Momentum | ${updatedPool.threat} Threat`,
        ephemeral: true
      });
      
    } catch (error) {
      logger.error('Error handling generate momentum button:', error);
      await interaction.reply({
        content: '❌ Failed to generate momentum.',
        ephemeral: true
      });
    }
  }

  private async handleSpendMomentumButton(interaction: ButtonInteraction): Promise<void> {
    try {
      // Parse the custom ID to extract guild and channel
      // Format: spend_momentum_{guildId}_{channelId}
      const parts = interaction.customId.split('_');
      if (parts.length < 4) {
        throw new Error('Invalid button ID format');
      }
      
      const guildId = parts[2];
      const channelId = parts[3];
      
      // Get current momentum pool
      const database = new DataManager();
      const currentPool = await database.getMomentumPool(guildId, channelId);
      
      if (currentPool.momentum <= 0) {
        await interaction.reply({
          content: '❌ No momentum available to spend.',
          ephemeral: true
        });
        return;
      }
      
      // Create buttons for spending different amounts
      const row = new ActionRowBuilder<ButtonBuilder>();
      const maxSpend = Math.min(currentPool.momentum, 5); // Cap at 5 for UI reasons
      
      for (let i = 1; i <= maxSpend; i++) {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`confirm_spend_momentum_${guildId}_${channelId}_${i}`)
            .setLabel(`Spend ${i}`)
            .setStyle(ButtonStyle.Primary)
            .setEmoji('💫')
        );
      }
      
      await interaction.reply({
        content: `💫 **Current Momentum:** ${currentPool.momentum}\n\nHow much momentum would you like to spend?`,
        components: [row],
        ephemeral: true
      });
      
    } catch (error) {
      logger.error('Error handling spend momentum button:', error);
      await interaction.reply({
        content: '❌ Failed to open momentum spending options.',
        ephemeral: true
      });
    }
  }

  private async handleAddThreatButton(interaction: ButtonInteraction): Promise<void> {
    try {
      // Parse the custom ID to extract guild, channel, and threat amount
      // Format: add_threat_{guildId}_{channelId}_{amount}
      const parts = interaction.customId.split('_');
      if (parts.length < 5) {
        throw new Error('Invalid button ID format');
      }
      
      const guildId = parts[2];
      const channelId = parts[3];
      const threatAmount = parseInt(parts[4]);
      
      if (isNaN(threatAmount) || threatAmount <= 0) {
        throw new Error('Invalid threat amount');
      }
      
      // Update threat pool
      const database = new DataManager();
      const updatedPool = await database.updateMomentum(guildId, channelId, 0, threatAmount);
      
      await interaction.reply({
        content: `⚠️ **Added ${threatAmount} Threat!**\n\n🎯 **Current Pool:** ${updatedPool.momentum} Momentum | ${updatedPool.threat} Threat`,
        ephemeral: true
      });
      
    } catch (error) {
      logger.error('Error handling add threat button:', error);
      await interaction.reply({
        content: '❌ Failed to add threat.',
        ephemeral: true
      });
    }
  }

  private async handleConfirmSpendMomentumButton(interaction: ButtonInteraction) {
    try {
      // Parse button custom ID: confirm_spend_momentum_{guildId}_{channelId}_{amount}
      const parts = interaction.customId.split('_');
      if (parts.length !== 6) {
        await interaction.reply({
          content: '❌ Invalid button format.',
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      const guildId = parts[3];
      const channelId = parts[4];
      const spendAmount = parseInt(parts[5]);

      if (isNaN(spendAmount) || spendAmount <= 0) {
        await interaction.reply({
          content: '❌ Invalid momentum amount.',
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      // Update momentum pool by spending the amount
      const database = new DataManager();
      const currentPool = await database.getMomentumPool(guildId, channelId);
      
      if (currentPool.momentum < spendAmount) {
        await interaction.reply({
          content: `❌ Not enough momentum! Current: ${currentPool.momentum}, Requested: ${spendAmount}`,
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      const updatedPool = await database.updateMomentum(guildId, channelId, -spendAmount);

      await interaction.reply({
        content: `✅ **Spent ${spendAmount} Momentum!**\n\n🎯 **Current Pool:** ${updatedPool.momentum} Momentum | ${updatedPool.threat} Threat`,
        flags: MessageFlags.Ephemeral
      });

    } catch (error) {
      logger.error('Error handling confirm spend momentum button:', error);
      await interaction.reply({
        content: '❌ Failed to spend momentum.',
        flags: MessageFlags.Ephemeral
      });
    }
  }
}

// Create and export bot instance
export const bot = new DuneBot();

// Start the bot if this file is run directly
if (require.main === module) {
  bot.start().catch(error => {
    logger.error('Failed to start bot:', error);
    process.exit(1);
  });
}
