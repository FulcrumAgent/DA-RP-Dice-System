/**
 * Dune Character Creation System
 * Based on official Dune: Adventures in the Imperium rules
 */

import { 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  CommandInteraction, 
  EmbedBuilder, 
  ButtonInteraction, 
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalSubmitInteraction,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  type GuildMember,
  MessageFlags
} from 'discord.js';
import { logger } from '../utils/logger';
import { 
  ARCHETYPES, 
  DRIVES, 
  SKILLS, 
  SKILL_FOCUSES, 
  GENERAL_TALENTS, 
  ARCHETYPE_TALENTS, 
  GENERAL_ASSETS, 
  ARCHETYPE_ASSETS, 
  POINT_BUY_RULES 
} from '../data/canonical-dune-data';
import { 
  CharacterCreationSession, 
  ValidationResult, 
  PointBuyValidation 
} from '../interfaces/canonical-character';
import { prismaCharacterManager, CharacterWithRelations } from '../utils/prisma-character-manager';

// In-memory storage for creation sessions (replace with database later)
const creationSessions = new Map<string, CharacterCreationSession>();

// Creation steps configuration
const CREATION_STEPS = [
  { id: 0, name: 'name', title: '📝 Character Name', description: 'Choose a name for your character', instructions: 'Click "Set Name" to enter your character\'s name.' },
  { id: 1, name: 'concept', title: '💭 Character Concept', description: 'Define your character\'s background and role', instructions: 'Click "Set Concept" to describe your character\'s background.' },
  { id: 2, name: 'archetypes', title: '🎭 Archetypes', description: 'Select 1-3 archetypes that define your character', instructions: 'Click "Select Archetypes" to choose from the available options.' },
  { id: 3, name: 'drives', title: '🎯 Drives', description: 'Assign values 4, 5, 6, 7, 8 to your character\'s drives (each used once)', instructions: 'Click "Assign Drives" to distribute values among your drives.' },
  { id: 4, name: 'drive_statements', title: '📝 Drive Statements', description: 'Write narrative statements for each drive', instructions: 'Click "Write Statements" to create personal statements for your drives.' },
  { id: 5, name: 'skills', title: '⚔️ Skills', description: 'Assign values 4, 5, 6, 7, 8 to your character\'s skills (each used once)', instructions: 'Click "Assign Skills" to distribute values among your skills.' },
  { id: 6, name: 'focuses', title: '🎯 Focuses', description: 'Select one focus for each skill', instructions: 'Click "Select Focuses" to choose specializations for your skills.' },
  { id: 7, name: 'talents', title: '🎪 Talents', description: 'Select up to 3 talents', instructions: 'Click "Select Talents" to choose your character\'s special abilities.' },
  { id: 8, name: 'assets', title: '💎 Assets', description: 'Select up to 3 assets', instructions: 'Click "Select Assets" to choose your character\'s equipment and resources.' },
  { id: 9, name: 'finalize', title: '✅ Finalize Character', description: 'Review and create your character', instructions: 'Click "Create Character" to finalize and save your character.' }
];

export class CharacterCreator {
  
  /**
   * Start character creation
   */
  static async startCreation(interaction: CommandInteraction, member: GuildMember): Promise<void> {
    try {
      const userId = member.id;
      const guildId = interaction.guild!.id;
      
      // Clear any existing session to ensure fresh start
      if (creationSessions.has(userId)) {
        logger.info(`Clearing existing character creation session for user ${userId}`);
        creationSessions.delete(userId);
      }
      
      // Create new character creation session
      const newSession: CharacterCreationSession = {
        userId,
        guildId,
        currentStep: 0,
        character: {
          userId,
          guildId,
          archetypes: [],
          drives: {
            duty: { value: 0, statement: '' },
            faith: { value: 0, statement: '' },
            justice: { value: 0, statement: '' },
            power: { value: 0, statement: '' },
            truth: { value: 0, statement: '' }
          },
          skills: { battle: 0, communicate: 0, discipline: 0, move: 0, understand: 0 },
          focuses: {},
          talents: [],
          assets: [],
          isComplete: false
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      creationSessions.set(userId, newSession);
      
      // Show first step
      await this.showStep(interaction, newSession);
      
    } catch (error) {
      logger.error('Error starting character creation:', error);
      await interaction.reply({
        content: '❌ An error occurred while starting character creation.',
        flags: MessageFlags.Ephemeral
      });
    }
  }
  
  /**
   * Build embed for current step
   */
  static buildStepEmbed(session: CharacterCreationSession): EmbedBuilder {
    const step = CREATION_STEPS[session.currentStep];
    if (!step) return new EmbedBuilder();
    
    const embed = new EmbedBuilder()
      .setColor('#4A90E2')
      .setTitle('🏜️ Dune Character Creation')
      .setDescription(step.description)
      .addFields({
        name: step.title,
        value: step.instructions,
        inline: false
      })
      .setFooter({ text: `Step ${session.currentStep + 1} of ${CREATION_STEPS.length}` });
    
    // Add current character info if available
    const char = session.character;
    if (char.name) {
      embed.addFields({ name: '📝 Name', value: char.name, inline: true });
    }
    if (char.concept) {
      embed.addFields({ name: '💭 Concept', value: char.concept, inline: true });
    }
    if (char.archetypes && char.archetypes.length > 0) {
      embed.addFields({ name: '🎭 Archetypes', value: char.archetypes.join(', '), inline: true });
    }
    if (char.drives && Object.values(char.drives).some(v => v.value > 0)) {
      const driveText = Object.entries(char.drives)
        .filter(([_, driveObj]) => driveObj.value > 0)
        .map(([drive, driveObj]) => `${drive}: ${driveObj.value}`)
        .join(', ');
      embed.addFields({ name: '🎯 Drives', value: driveText, inline: true });
    }
    if (char.skills && Object.values(char.skills).some(v => (v as number) > 0)) {
      const skillText = Object.entries(char.skills)
        .filter(([_, value]) => (value as number) > 0)
        .map(([skill, value]) => `${skill}: ${value}`)
        .join(', ');
      embed.addFields({ name: '⚔️ Skills', value: skillText, inline: true });
    }
    if (char.focuses && Object.keys(char.focuses).length > 0) {
      const focusText = Object.entries(char.focuses)
        .filter(([_, focus]) => focus && typeof focus === 'string')
        .map(([skill, focus]) => `${skill}: ${focus}`)
        .join(', ');
      embed.addFields({ name: '🎯 Focuses', value: focusText, inline: true });
    }
    
    // Add drive explanations for the drives step
    if (session.currentStep === 3) { // Drives step
      const driveExplanations = DRIVES.map(drive => 
        `**${drive.name}**: ${drive.description}`
      ).join('\n');
      embed.addFields({ 
        name: '📜 Drive Meanings', 
        value: driveExplanations, 
        inline: false 
      });
    }
    
    // Add skill explanations for the skills step
    if (session.currentStep === 5) { // Skills step
      const skillExplanations = SKILLS.map(skill => 
        `**${skill.name}**: ${skill.description}`
      ).join('\n');
      embed.addFields({ 
        name: '⚔️ Skill Meanings', 
        value: skillExplanations, 
        inline: false 
      });
    }
    
    return embed;
  }
  
  /**
   * Show current step
   */
  static async showStep(interaction: CommandInteraction | ButtonInteraction | ModalSubmitInteraction | StringSelectMenuInteraction, session: CharacterCreationSession): Promise<void> {
    const embed = this.buildStepEmbed(session);
    const buttons = this.buildButtons(session.currentStep, session);
    
    const response = {
      embeds: [embed],
      components: buttons,
      ephemeral: true
    };
    
    // Handle different interaction types
    if (interaction.isCommand()) {
      await interaction.reply(response);
    } else if (interaction.isButton()) {
      await interaction.update(response);
    } else if (interaction.isModalSubmit()) {
      await interaction.deferUpdate();
      await interaction.editReply(response);
    } else if (interaction.isStringSelectMenu()) {
      await interaction.update(response);
    }
  }
  
  /**
   * Build buttons for current step
   */
  static buildButtons(stepIndex: number, session: CharacterCreationSession): ActionRowBuilder<ButtonBuilder>[] {
    const rows: ActionRowBuilder<ButtonBuilder>[] = [];
    const mainRow = new ActionRowBuilder<ButtonBuilder>();
    
    switch (stepIndex) {
      case 0: // NAME
        mainRow.addComponents(
          new ButtonBuilder()
            .setCustomId('character_creation_set_name')
            .setLabel('Set Name')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📝')
        );
        if (session.character.name) {
          mainRow.addComponents(
            new ButtonBuilder()
              .setCustomId('character_creation_next')
              .setLabel('Next: Concept')
              .setStyle(ButtonStyle.Success)
              .setEmoji('▶️')
          );
        }
        break;
        
      case 1: // CONCEPT
        mainRow.addComponents(
          new ButtonBuilder()
            .setCustomId('character_creation_prev')
            .setLabel('Previous')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('◀️'),
          new ButtonBuilder()
            .setCustomId('character_creation_set_concept')
            .setLabel('Set Concept')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('💭')
        );
        if (session.character.concept) {
          mainRow.addComponents(
            new ButtonBuilder()
              .setCustomId('character_creation_next')
              .setLabel('Next: Archetypes')
              .setStyle(ButtonStyle.Success)
              .setEmoji('▶️')
          );
        }
        break;
        
      case 2: // ARCHETYPES
        mainRow.addComponents(
          new ButtonBuilder()
            .setCustomId('character_creation_prev')
            .setLabel('Previous')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('◀️'),
          new ButtonBuilder()
            .setCustomId('character_creation_select_archetypes')
            .setLabel('Select Archetypes')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🎭')
        );
        if (session.character.archetypes && session.character.archetypes.length > 0) {
          mainRow.addComponents(
            new ButtonBuilder()
              .setCustomId('character_creation_next')
              .setLabel('Next: Drives')
              .setStyle(ButtonStyle.Success)
              .setEmoji('▶️')
          );
        }
        break;
        
      case 3: // DRIVES
        mainRow.addComponents(
          new ButtonBuilder()
            .setCustomId('character_creation_prev')
            .setLabel('Previous')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('◀️'),
          new ButtonBuilder()
            .setCustomId('character_creation_assign_drives')
            .setLabel('Assign Drives')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🎯')
        );
        if (session.character.drives && this.validateDrives({
          duty: session.character.drives.duty?.value || 0,
          faith: session.character.drives.faith?.value || 0,
          justice: session.character.drives.justice?.value || 0,
          power: session.character.drives.power?.value || 0,
          truth: session.character.drives.truth?.value || 0
        }).isValid) {
          mainRow.addComponents(
            new ButtonBuilder()
              .setCustomId('character_creation_next')
              .setLabel('Next: Drive Statements')
              .setStyle(ButtonStyle.Success)
              .setEmoji('▶️')
          );
        }
        break;
        
      case 4: { // DRIVE_STATEMENTS
        mainRow.addComponents(
          new ButtonBuilder()
            .setCustomId('character_creation_prev')
            .setLabel('Previous')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('◀️'),
          new ButtonBuilder()
            .setCustomId('character_creation_write_statements')
            .setLabel('Write Statements')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📝')
        );
        // Check if all drives have statements
        const hasAllStatements = session.character.drives && 
          Object.values(session.character.drives).every(drive => 
            typeof drive === 'object' && drive.statement && drive.statement.trim().length > 0
          );
        if (hasAllStatements) {
          mainRow.addComponents(
            new ButtonBuilder()
              .setCustomId('character_creation_next')
              .setLabel('Next: Skills')
              .setStyle(ButtonStyle.Success)
              .setEmoji('▶️')
          );
        }
        break;
      }
        
      case 5: // SKILLS
        mainRow.addComponents(
          new ButtonBuilder()
            .setCustomId('character_creation_prev')
            .setLabel('Previous')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('◀️'),
          new ButtonBuilder()
            .setCustomId('character_creation_assign_skills')
            .setLabel('Assign Skills')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('⚔️')
        );
        if (session.character.skills && this.validateSkills(session.character.skills).isValid) {
          mainRow.addComponents(
            new ButtonBuilder()
              .setCustomId('character_creation_next')
              .setLabel('Next: Focuses')
              .setStyle(ButtonStyle.Success)
              .setEmoji('▶️')
          );
        }
        break;
        
      case 6: // FOCUSES
        mainRow.addComponents(
          new ButtonBuilder()
            .setCustomId('character_creation_prev')
            .setLabel('Previous')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('◀️'),
          new ButtonBuilder()
            .setCustomId('character_creation_select_focuses')
            .setLabel('Select Focuses')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🎯')
        );
        if (session.character.focuses && this.validateFocuses(session.character.focuses, session.character.skills).isValid) {
          mainRow.addComponents(
            new ButtonBuilder()
              .setCustomId('character_creation_next')
              .setLabel('Next: Talents')
              .setStyle(ButtonStyle.Success)
              .setEmoji('▶️')
          );
        }
        break;
        
      case 7: // TALENTS
        mainRow.addComponents(
          new ButtonBuilder()
            .setCustomId('character_creation_prev')
            .setLabel('Previous')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('◀️'),
          new ButtonBuilder()
            .setCustomId('character_creation_select_talents')
            .setLabel('Select Talents')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('⭐')
        );
        if (session.character.talents && session.character.talents.length === 3) {
          mainRow.addComponents(
            new ButtonBuilder()
              .setCustomId('character_creation_next')
              .setLabel('Next: Assets')
              .setStyle(ButtonStyle.Success)
              .setEmoji('▶️')
          );
        }
        break;
        
      case 8: // ASSETS
        mainRow.addComponents(
          new ButtonBuilder()
            .setCustomId('character_creation_prev')
            .setLabel('Previous')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('◀️'),
          new ButtonBuilder()
            .setCustomId('character_creation_select_assets')
            .setLabel('Select Assets')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('💎')
        );
        if (session.character.assets && session.character.assets.length === 3) {
          mainRow.addComponents(
            new ButtonBuilder()
              .setCustomId('character_creation_next')
              .setLabel('Next: Finalize')
              .setStyle(ButtonStyle.Success)
              .setEmoji('▶️')
          );
        }
        break;
        
      case 9: // FINALIZE
        mainRow.addComponents(
          new ButtonBuilder()
            .setCustomId('character_creation_prev')
            .setLabel('Previous')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('◀️'),
          new ButtonBuilder()
            .setCustomId('character_creation_finalize')
            .setLabel('Create Character')
            .setStyle(ButtonStyle.Success)
            .setEmoji('✅')
        );
        break;
    }
    
    // Add cancel button to the main row if there's space (Discord limit is 5 buttons per row)
    if (mainRow.components.length > 0 && mainRow.components.length < 5) {
      mainRow.addComponents(
        new ButtonBuilder()
          .setCustomId('character_creation_cancel')
          .setLabel('Cancel')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('❌')
      );
    }
    
    if (mainRow.components.length > 0) {
      rows.push(mainRow);
    }
    
    return rows;
  }
  
  /**
   * Validate drives point-buy allocation
   */
  static validateDrives(drives: { [key: string]: number }): PointBuyValidation {
    const allowedValues = [4, 5, 6, 7, 8];
    const driveValues = Object.values(drives);
    const errors: string[] = [];
    
    // Check if we have exactly 5 drives
    if (driveValues.length !== 5) {
      errors.push('Must assign values to all 5 drives');
    }
    
    // Check if all values are from the allowed set
    for (const [drive, value] of Object.entries(drives)) {
      if (!allowedValues.includes(value)) {
        errors.push(`${drive} must be one of: 4, 5, 6, 7, or 8`);
      }
    }
    
    // Check if each value is used exactly once
    const sortedValues = [...driveValues].sort((a, b) => b - a);
    const sortedAllowed = [...allowedValues].sort((a, b) => b - a);
    
    if (JSON.stringify(sortedValues) !== JSON.stringify(sortedAllowed)) {
      errors.push('Each value (4, 5, 6, 7, 8) must be used exactly once');
    }
    
    const totalPoints = driveValues.reduce((sum, val) => sum + val, 0);
    
    return {
      usedPoints: totalPoints,
      remainingPoints: 0,
      isValid: errors.length === 0,
      errors,
      totalPoints: 30 // Sum of 4+5+6+7+8
    };
  }
  
  /**
   * Validate skills point-buy allocation
   */
  static validateSkills(skills: { [key: string]: number }): PointBuyValidation {
    const allowedValues = [4, 5, 6, 7, 8];
    const skillValues = Object.values(skills);
    const errors: string[] = [];
    
    // Check if we have exactly 5 skills
    if (skillValues.length !== 5) {
      errors.push('Must assign values to all 5 skills');
    }
    
    // Check if all values are from the allowed set
    for (const [skill, value] of Object.entries(skills)) {
      if (!allowedValues.includes(value)) {
        errors.push(`${skill} must be one of: 4, 5, 6, 7, or 8`);
      }
    }
    
    // Check if each value is used exactly once
    const sortedValues = [...skillValues].sort((a, b) => b - a);
    const sortedAllowed = [...allowedValues].sort((a, b) => b - a);
    
    if (JSON.stringify(sortedValues) !== JSON.stringify(sortedAllowed)) {
      errors.push('Each value (4, 5, 6, 7, 8) must be used exactly once');
    }
    
    const totalPoints = skillValues.reduce((sum, val) => sum + val, 0);
    
    return {
      usedPoints: totalPoints,
      remainingPoints: 0,
      isValid: errors.length === 0,
      errors,
      totalPoints: 30 // Sum of 4+5+6+7+8
    };
  }
  
  /**
   * Validate focuses selection
   */
  static validateFocuses(focuses: { [skill: string]: string }, skills?: { [skill: string]: number }): ValidationResult {
    const errors: string[] = [];
    
    // If skills are provided, only check focuses for skills with values > 0
    // Otherwise, check all skills in the SKILLS array
    const requiredSkills = skills 
      ? Object.entries(skills).filter(([_, value]) => value > 0).map(([skill, _]) => skill)
      : SKILLS.map(skill => skill.name);
    
    // Check that each required skill has exactly one focus
    for (const skill of requiredSkills) {
      if (!focuses[skill]) {
        errors.push(`${skill} requires a focus selection`);
      } else {
        // Validate focus exists for this skill
        const validFocuses = SKILL_FOCUSES[skill] || [];
        if (!validFocuses.includes(focuses[skill])) {
          errors.push(`Invalid focus '${focuses[skill]}' for ${skill}`);
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Show name input modal
   */
  static async showNameModal(interaction: ButtonInteraction): Promise<void> {
    const modal = new ModalBuilder()
      .setCustomId('character_creation_name_modal')
      .setTitle('Set Character Name');
    
    const nameInput = new TextInputBuilder()
      .setCustomId('name')
      .setLabel('Character Name')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('e.g., Duncan Idaho, Chani, Gurney Halleck')
      .setRequired(true)
      .setMaxLength(50);
    
    modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput));
    await interaction.showModal(modal);
  }
  

  
  /**
   * Show drives assignment modal
   */
  static async showDrivesModal(interaction: ButtonInteraction): Promise<void> {
    const session = creationSessions.get(interaction.user.id);
    if (!session) return;
    
    const modal = new ModalBuilder()
      .setCustomId('character_creation_drives_modal')
      .setTitle('Assign Drive Values: 4, 5, 6, 7, 8');
    
    const driveNames = ['Duty', 'Faith', 'Justice', 'Power', 'Truth'];
    const inputs = driveNames.map(drive => {
      const driveObj = session.character.drives ? (session.character.drives as Record<string, any>)[drive.toLowerCase()] : null;
      const currentValue = driveObj && driveObj.value > 0 ? driveObj.value.toString() : '';
      return new TextInputBuilder()
        .setCustomId(drive)
        .setLabel(`${drive} (Enter: 4, 5, 6, 7, or 8)`)
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
  }
  
  /**
   * Show skills assignment modal
   */
  static async showSkillsModal(interaction: ButtonInteraction): Promise<void> {
    const session = creationSessions.get(interaction.user.id);
    if (!session) return;
    
    const modal = new ModalBuilder()
      .setCustomId('character_creation_skills_modal')
      .setTitle('Assign Skill Values: 4, 5, 6, 7, 8');
    
    const inputs = SKILLS.map(skill => {
      const currentValue: number = session.character.skills ? (session.character.skills as Record<string, number>)[skill.name] || 0 : 0;
      const displayValue = currentValue > 0 ? currentValue.toString() : '';
      return new TextInputBuilder()
        .setCustomId(skill.name)
        .setLabel(`${skill.name} (Enter: 4, 5, 6, 7, or 8)`)
        .setStyle(TextInputStyle.Short)
        .setValue(displayValue)
        .setPlaceholder(`${skill.description}`)
        .setRequired(true)
        .setMaxLength(1);
    });
    
    // Add all 5 skill inputs
    inputs.forEach(input => {
      modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
    });
    
    await interaction.showModal(modal);
  }
  
  /**
   * Show drive statements modal
   */
  static async showDriveStatementsModal(interaction: ButtonInteraction): Promise<void> {
    const session = creationSessions.get(interaction.user.id);
    if (!session) return;
    
    const modal = new ModalBuilder()
      .setCustomId('character_creation_drive_statements_modal')
      .setTitle('Write Drive Statements');
    
    const driveNames = ['Duty', 'Faith', 'Justice', 'Power', 'Truth'];
    const inputs = driveNames.map(driveName => {
      const driveKey = driveName.toLowerCase();
      const drive = session.character.drives ? (session.character.drives as any)[driveKey] : null;
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
  }
  
  /**
   * Show focuses selection
   */
  static async showFocusesSelect(interaction: ButtonInteraction | StringSelectMenuInteraction): Promise<void> {
    const session = creationSessions.get(interaction.user.id);
    if (!session) return;
    
    // Find first skill without a focus
    const skillNames = SKILLS.map(skill => skill.name);
    const skillWithoutFocus = skillNames.find(skillName => !session.character.focuses || !(session.character.focuses as Record<string, unknown>)[skillName]);
    
    if (!skillWithoutFocus) {
      // All skills have focuses, just refresh the step
      await this.showStep(interaction, session);
      return;
    }
    
    const focusOptions = SKILL_FOCUSES[skillWithoutFocus]?.map(focus => ({
      label: focus,
      value: focus,
      description: `Focus for ${skillWithoutFocus}`
    })) || [];
    
    if (focusOptions.length === 0) {
      await interaction.reply({
        content: `❌ No focuses available for ${skillWithoutFocus}`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }
    
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`character_creation_focus_select_${skillWithoutFocus}`)
      .setPlaceholder(`Select focus for ${skillWithoutFocus}`)
      .addOptions(focusOptions.slice(0, 25)); // Discord limit
    
    const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
    
    // Keep the main character creation embed and add the select menu
    const embed = this.buildStepEmbed(session);
    embed.addFields({
      name: '🎯 Select Focus',
      value: `Choose a focus for **${skillWithoutFocus}** skill:`,
      inline: false
    });
    
    // Add navigation buttons
    const buttonRow = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('character_creation_prev')
          .setLabel('Previous')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('◀️'),
        new ButtonBuilder()
          .setCustomId('character_creation_cancel')
          .setLabel('Cancel')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('❌')
      );
    
    await interaction.update({
      embeds: [embed],
      components: [selectRow, buttonRow]
    });
  }
  
  /**
   * Show talents selection
   */
  static async showTalentsSelect(interaction: ButtonInteraction): Promise<void> {
    const session = creationSessions.get(interaction.user.id);
    if (!session) return;
    
    // Get available talents (general + archetype-specific)
    const availableTalents = [...GENERAL_TALENTS];
    
    // Add archetype-specific talents
    session.character.archetypes?.forEach(archetype => {
      const archetypeTalents = ARCHETYPE_TALENTS[archetype] || [];
      availableTalents.push(...archetypeTalents);
    });
    
    // Filter out already selected talents
    const unselectedTalents = availableTalents.filter(talent => 
      !session.character.talents?.includes(talent.name)
    );
    
    if (unselectedTalents.length === 0) {
      await interaction.update({
        content: 'No more talents available to select!',
        components: []
      });
      return;
    }
    
    const options = unselectedTalents.slice(0, 25).map(talent => ({
      label: talent.name,
      value: talent.name,
      description: talent.description.substring(0, 100)
    }));
    
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('canon_talent_select')
      .setPlaceholder('Select talents')
      .setMinValues(1)
      .setMaxValues(Math.min(3 - (session.character.talents?.length || 0), options.length))
      .addOptions(options);
    
    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
    
    await interaction.update({
      content: `Select talents (${session.character.talents?.length || 0}/3 selected):`,
      components: [row]
    });
  }
  
  /**
   * Show assets selection
   */
  static async showAssetsSelect(interaction: ButtonInteraction): Promise<void> {
    const session = creationSessions.get(interaction.user.id);
    if (!session) return;
    
    // Get available assets (general + archetype-specific)
    const availableAssets = [...GENERAL_ASSETS];
    
    // Add archetype-specific assets
    session.character.archetypes?.forEach(archetype => {
      const archetypeAssets = ARCHETYPE_ASSETS[archetype] || [];
      availableAssets.push(...archetypeAssets);
    });
    
    // SECTION 4 COMPLIANCE: Filter out Fremen-only assets if user is not Fremen
    const isFremen = session.character.archetypes?.includes('Fremen') || false;
    const filteredAssets = availableAssets.filter(asset => {
      // Fremen-only assets: Crysknife and Water Rings
      if ((asset.name === 'Crysknife' || asset.name === 'Water Rings') && !isFremen) {
        return false;
      }
      return true;
    });
    
    // Filter out already selected assets
    const unselectedAssets = filteredAssets.filter(asset => 
      !session.character.assets?.includes(asset.name)
    );
    
    if (unselectedAssets.length === 0) {
      await interaction.update({
        content: 'No more assets available to select!',
        components: []
      });
      return;
    }
    
    const options = unselectedAssets.slice(0, 25).map(asset => ({
      label: asset.name,
      value: asset.name,
      description: asset.description.substring(0, 100)
    }));
    
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('canon_asset_select')
      .setPlaceholder('Select assets')
      .setMinValues(1)
      .setMaxValues(Math.min(3 - (session.character.assets?.length || 0), options.length))
      .addOptions(options);
    
    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
    
    await interaction.update({
      content: `Select assets (${session.character.assets?.length || 0}/3 selected):`,
      components: [row]
    });
  }
  
  /**
   * Show concept input modal
   */
  static async showConceptModal(interaction: ButtonInteraction): Promise<void> {
    const modal = new ModalBuilder()
      .setCustomId('character_creation_concept_modal')
      .setTitle('Set Character Concept');
    
    const conceptInput = new TextInputBuilder()
      .setCustomId('concept')
      .setLabel('Character Concept')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('e.g., "Fremen desert warrior", "Noble house spy seeking revenge"')
      .setRequired(true)
      .setMaxLength(200);
    
    modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(conceptInput));
    await interaction.showModal(modal);
  }
  
  /**
   * Show archetype selection (SECTION 4 COMPLIANCE: No freeform, only canonical archetypes)
   */
  static async showArchetypeSelect(interaction: ButtonInteraction): Promise<void> {
    const session = creationSessions.get(interaction.user.id);
    if (!session) return;
    
    // Map archetype names to emojis
    const archetypeEmojis: { [key: string]: string } = {
      'Noble': '👑',
      'Mentat': '🧠',
      'Bene Gesserit': '🔮',
      'Fremen': '🏜️',
      'Smuggler': '🚀',
      'Trooper': '⚔️',
      'Agent': '🕵️',
      'Planetologist': '🔬',
      'Swordmaster': '🗡️',
      'Guild Agent': '🌌',
      'Face Dancer': '🎭',
      'Courtier': '🎩',
      'Envoy': '📜',
      'Duellist': '⚡'
    };
  
    const options = ARCHETYPES.map(archetype => ({
      label: `${archetypeEmojis[archetype.name] || '🎭'} ${archetype.name}`,
      value: archetype.name,
      description: archetype.description.substring(0, 100)
    }));
    
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('canon_archetype_select')
      .setPlaceholder('Select your archetypes')
      .setMinValues(1)
      .setMaxValues(3)
      .addOptions(options);
    
    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
    
    await interaction.update({
      content: 'Select 1-3 archetypes to mix and match:',
      components: [row]
    });
  }
  
  /**
   * Finalize character creation
   */
  static async finalizeCharacter(interaction: ButtonInteraction, session: CharacterCreationSession): Promise<void> {
    try {
      logger.info('Starting character finalization...');
      
      // Validate character is complete
      const character = session.character;
      logger.info('Character data:', {
        name: character?.name,
        concept: character?.concept,
        archetypes: character?.archetypes,
        drives: character?.drives,
        skills: character?.skills,
        talents: character?.talents,
        assets: character?.assets
      });
      
      if (!character?.name || !character?.concept || !character?.archetypes?.length) {
        logger.warn('Character validation failed - missing required fields');
        await interaction.update({
          content: '❌ Character is incomplete. Please fill in all required fields.',
          embeds: [],
          components: []
        });
        return;
      }
      
      // Mark as complete
      character.isComplete = true;
      
      // Prepare data for character manager
      const skillsData = character.skills ? Object.entries(character.skills)
        .filter(([_, value]) => value > 0)
        .map(([name, value]) => ({
          name,
          value,
          focus: (character.focuses as Record<string, string>)?.[name] ? [(character.focuses as Record<string, string>)[name]] : []
        })) : [];
      
      const drivesData = character.drives ? Object.entries(character.drives)
        .filter(([_, driveObj]) => driveObj.value > 0)
        .map(([name, driveObj]) => ({
          name,
          statement: driveObj.statement,
          value: driveObj.value
        })) : [];
      
      const assetsData = character.assets?.map(assetName => ({ name: assetName, description: '', type: 'equipment' as const })) || [];
      
      logger.info('Prepared character data for creation:', {
        skills: skillsData,
        drives: drivesData,
        talents: character.talents || [],
        assets: assetsData
      });
      
      // Save to character manager
      logger.info('Calling prismaCharacterManager.createCharacter...');
      await prismaCharacterManager.createCharacter(
        interaction.user.id,
        interaction.guildId!,
        character.name,
        [character.concept || ''],
        {
          skills: skillsData,
          drives: drivesData,
          assets: assetsData
        }
      );
      
      logger.info('Character creation successful!');
      
      logger.info(`Canonical character created: ${character.name} (${character.concept})`);
      
      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ Character Created Successfully!')
        .setDescription('Your Dune character has been created and saved!')
        .addFields(
          { name: '📝 Name', value: character.name, inline: true },
          { name: '💭 Concept', value: character.concept || 'None', inline: true },
          { name: '🎭 Archetypes', value: character.archetypes?.join(', ') || 'None', inline: true },
          { name: '🎯 Drives', value: character.drives ? Object.entries(character.drives).map(([k, v]) => `${k}: ${v.value}`).join(', ') : 'None', inline: false },
          { name: '⚔️ Skills', value: character.skills ? Object.entries(character.skills).map(([k, v]) => `${k}: ${v}`).join(', ') : 'None', inline: false },
          { name: '🎪 Talents', value: character.talents?.join(', ') || 'None', inline: false },
          { name: '💎 Assets', value: character.assets && character.assets.length > 0 
            ? (typeof character.assets[0] === 'string' 
                ? (character.assets as any[]).join(', ') 
                : (character.assets as any[]).map((a: any) => a.name || a).join(', '))
            : 'None', inline: false }
        )
        .setFooter({ text: 'Your character is ready for adventure in the Imperium!' });
      
      // Update the existing message instead of creating a new one
      await interaction.update({
        embeds: [embed],
        components: []
      });
      
      // Clean up session
      creationSessions.delete(session.userId);
      
    } catch (error) {
      logger.error('Error finalizing character:', error);
      logger.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      try {
        // Try to update the existing message with error, fall back to followUp if needed
        await interaction.update({
          content: `❌ An error occurred while finalizing your character: ${error instanceof Error ? error.message : 'Unknown error'}`,
          embeds: [],
          components: []
        });
      } catch (updateError) {
        logger.error('Failed to update with error message, trying followUp:', updateError);
        try {
          await interaction.followUp({
            content: `❌ An error occurred while finalizing your character: ${error instanceof Error ? error.message : 'Unknown error'}`,
            ephemeral: true
          });
        } catch (followUpError) {
          logger.error('Failed to send error follow-up:', followUpError);
        }
      }
    }
  }

  /**
   * Handle modal submissions
   */
  static async handleModal(interaction: ModalSubmitInteraction): Promise<void> {
    const session = creationSessions.get(interaction.user.id);
    if (!session) {
      await interaction.reply({
        content: '❌ No character creation session found.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }
    
    try {
      switch (interaction.customId) {
        case 'character_creation_name_modal':
          await this.handleNameModal(interaction, session);
          break;
        case 'character_creation_concept_modal':
          await this.handleConceptModal(interaction, session);
          break;
        case 'character_creation_drives_modal':
          await this.handleDrivesModal(interaction, session);
          break;
        case 'character_creation_drive_statements_modal':
          await this.handleDriveStatementsModal(interaction, session);
          break;
        case 'character_creation_skills_modal':
          await this.handleSkillsModal(interaction, session);
          break;
        default:
          await interaction.reply({
            content: '❌ Unknown modal interaction.',
            flags: MessageFlags.Ephemeral
          });
      }
    } catch (error) {
      logger.error('Error handling modal:', error);
      await interaction.reply({
        content: '❌ An error occurred processing your input.',
        flags: MessageFlags.Ephemeral
      });
    }
  }
  
  /**
   * Handle select menu interactions
   */
  static async handleSelectMenu(interaction: StringSelectMenuInteraction): Promise<void> {
    const session = creationSessions.get(interaction.user.id);
    if (!session) {
      await interaction.reply({
        content: '❌ No character creation session found.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }
    
    try {
      if (interaction.customId === 'character_creation_archetype_select' || interaction.customId === 'canon_archetype_select') {
        await this.handleArchetypeSelect(interaction, session);
      } else if (interaction.customId.startsWith('character_creation_focus_select') || interaction.customId.startsWith('canon_focus_select_')) {
        await this.handleFocusSelect(interaction, session);
      } else if (interaction.customId === 'character_creation_talent_select' || interaction.customId === 'canon_talent_select') {
        await this.handleTalentSelect(interaction, session);
      } else if (interaction.customId === 'character_creation_asset_select' || interaction.customId === 'canon_asset_select') {
        await this.handleAssetSelect(interaction, session);
      } else {
        await interaction.reply({
          content: '❌ Unknown select menu interaction.',
          flags: MessageFlags.Ephemeral
        });
      }
    } catch (error) {
      logger.error('Error handling select menu:', error);
      await interaction.reply({
        content: '❌ An error occurred processing your selection.',
        flags: MessageFlags.Ephemeral
      });
    }
  }
  
  /**
   * Handle name modal submission
   */
  static async handleNameModal(interaction: ModalSubmitInteraction, session: CharacterCreationSession): Promise<void> {
    const name = interaction.fields.getTextInputValue('name').trim();
    
    if (!name || name.length < 2) {
      await interaction.reply({
        content: '❌ Name must be at least 2 characters long.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }
    
    session.character.name = name;
    session.updatedAt = new Date();
    
    await this.showStep(interaction, session);
  }
  
  /**
   * Handle concept modal submission
   */
  static async handleConceptModal(interaction: ModalSubmitInteraction, session: CharacterCreationSession): Promise<void> {
    const concept = interaction.fields.getTextInputValue('concept').trim();
    
    if (!concept || concept.length < 5) {
      await interaction.reply({
        content: '❌ Concept must be at least 5 characters long.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }
    
    session.character.concept = concept;
    session.updatedAt = new Date();
    
    await this.showStep(interaction, session);
  }
  
  /**
   * Handle drives modal submission
   */
  static async handleDrivesModal(interaction: ModalSubmitInteraction, session: CharacterCreationSession): Promise<void> {
    const drives: { [key: string]: number } = {};
    const driveNames = ['Duty', 'Faith', 'Justice', 'Power', 'Truth'];
    
    // Parse input values
    for (const drive of driveNames) {
      const value = parseInt(interaction.fields.getTextInputValue(drive));
      if (isNaN(value)) {
        await interaction.reply({
          content: `❌ Invalid value for ${drive}. Please enter a number (4, 5, 6, 7, or 8).`,
          flags: MessageFlags.Ephemeral
        });
        return;
      }
      drives[drive.toLowerCase()] = value;
    }
    
    // Validate drives
    const validation = this.validateDrives(drives);
    if (!validation.isValid) {
      await interaction.reply({
        content: `❌ Validation errors:\n${validation.errors.join('\n')}`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }
    
    // Update session with proper drive structure
    session.character.drives = {
      duty: { value: drives.duty, statement: '' },
      faith: { value: drives.faith, statement: '' },
      justice: { value: drives.justice, statement: '' },
      power: { value: drives.power, statement: '' },
      truth: { value: drives.truth, statement: '' }
    };
    session.updatedAt = new Date();
    
    await this.showStep(interaction, session);
  }
  
  /**
   * Handle drive statements modal submission
   */
  static async handleDriveStatementsModal(interaction: ModalSubmitInteraction, session: CharacterCreationSession): Promise<void> {
    const driveNames = ['Duty', 'Faith', 'Justice', 'Power', 'Truth'];
    
    // Parse drive statements from modal
    for (const driveName of driveNames) {
      const statement = interaction.fields.getTextInputValue(driveName).trim();
      
      if (!statement || statement.length === 0) {
        await interaction.reply({
          content: `❌ ${driveName} statement cannot be empty.`,
          flags: MessageFlags.Ephemeral
        });
        return;
      }
      
      // Update the drive statement
      const driveKey = driveName.toLowerCase();
      if (session.character.drives) {
        const drive = (session.character.drives as any)[driveKey];
        if (drive) {
          drive.statement = statement;
        }
      }
    }
    
    session.updatedAt = new Date();
    await this.showStep(interaction, session);
  }
  
  /**
   * Handle skills modal submission
   */
  static async handleSkillsModal(interaction: ModalSubmitInteraction, session: CharacterCreationSession): Promise<void> {
    const skills: { [key: string]: number } = {};
    
    // Parse input values
    for (const skill of SKILLS) {
      const value = parseInt(interaction.fields.getTextInputValue(skill.name));
      if (isNaN(value)) {
        await interaction.reply({
          content: `❌ Invalid value for ${skill.name}. Please enter a number.`,
          flags: MessageFlags.Ephemeral
        });
        return;
      }
      skills[skill.name] = value;
    }
    
    // Validate skills
    const validation = this.validateSkills(skills);
    if (!validation.isValid) {
      await interaction.reply({
        content: `❌ Validation errors:\n${validation.errors.join('\n')}`,
        flags: MessageFlags.Ephemeral
      });
      return;
    }
    
    session.character.skills = skills as any;
    session.updatedAt = new Date();
    
    await this.showStep(interaction, session);
  }
  
  /**
   * Handle archetype selection
   */
  static async handleArchetypeSelect(interaction: StringSelectMenuInteraction, session: CharacterCreationSession): Promise<void> {
    const selectedArchetypes = interaction.values;
    
    if (selectedArchetypes.length < 1 || selectedArchetypes.length > 3) {
      await interaction.update({
        content: '❌ You must select 1-3 archetypes.',
        components: []
      });
      return;
    }
    
    session.character.archetypes = selectedArchetypes;
    session.updatedAt = new Date();
    
    await interaction.update({
      embeds: [this.buildStepEmbed(session)],
      components: this.buildButtons(session.currentStep, session)
    });
  }
  
  /**
   * Handle focus selection
   */
  static async handleFocusSelect(interaction: StringSelectMenuInteraction, session: CharacterCreationSession): Promise<void> {
    const selectedFocus = interaction.values[0];
    
    // Extract skill name from customId (format: character_creation_focus_select_${skillName})
    const skillName = interaction.customId.replace('character_creation_focus_select_', '');
    
    if (!session.character.focuses) {
      session.character.focuses = {};
    }
    
    // Store the selected focus for the skill
    (session.character.focuses as Record<string, unknown>)[skillName] = selectedFocus;
    session.updatedAt = new Date();
    
    // Check if all skills with values have focuses assigned
    const skillsWithValues = Object.entries(session.character.skills || {}).filter(([, value]) => (value as number) > 0);
    const focusesAssigned = Object.keys(session.character.focuses || {}).length;
    
    // If all skills have focuses, move to next step, otherwise show the next skill that needs a focus
    if (focusesAssigned >= skillsWithValues.length) {
      // All focuses assigned, move to next step (talents)
      session.currentStep = 7; // Move to talents step (index 7)
      await this.showStep(interaction, session);
    } else {
      // Show the next skill that needs a focus
      await this.showFocusesSelect(interaction);
    }
  }
  
  /**
   * Handle talent selection
   */
  static async handleTalentSelect(interaction: StringSelectMenuInteraction, session: CharacterCreationSession): Promise<void> {
    const selectedTalents = interaction.values;
    const currentTalents = session.character.talents || [];
    
    if (currentTalents.length + selectedTalents.length > 3) {
      await interaction.update({
        content: '❌ You can only have 3 talents total.',
        components: []
      });
      return;
    }
    
    // Add new talents (avoid duplicates)
    for (const talent of selectedTalents) {
      if (!currentTalents.includes(talent)) {
        currentTalents.push(talent);
      }
    }
    
    session.character.talents = currentTalents;
    session.updatedAt = new Date();
    
    await interaction.update({
      embeds: [this.buildStepEmbed(session)],
      components: this.buildButtons(session.currentStep, session)
    });
  }
  
  /**
   * Handle asset selection
   */
  static async handleAssetSelect(interaction: StringSelectMenuInteraction, session: CharacterCreationSession): Promise<void> {
    const selectedAssets = interaction.values;
    const currentAssets = session.character.assets || [];
    
    if (currentAssets.length + selectedAssets.length > 3) {
      await interaction.update({
        content: '❌ You can only have 3 assets total.',
        components: []
      });
      return;
    }
    
    // SECTION 4 COMPLIANCE: Validate Fremen-only assets
    const isFremen = session.character.archetypes?.includes('Fremen') || false;
    for (const asset of selectedAssets) {
      if ((asset === 'Crysknife' || asset === 'Water Rings') && !isFremen) {
        await interaction.update({
          content: `❌ Only Fremen characters can select ${asset}. Please choose a different asset.`,
          components: []
        });
        return;
      }
    }
    
    // Add new assets (avoid duplicates)
    for (const asset of selectedAssets) {
      if (!currentAssets.includes(asset)) {
        currentAssets.push(asset);
      }
    }
    
    session.character.assets = currentAssets;
    session.updatedAt = new Date();
    
    await interaction.update({
      embeds: [this.buildStepEmbed(session)],
      components: this.buildButtons(session.currentStep, session)
    });
  }
  
  /**
   * Handle button interactions
   */
  static async handleButton(interaction: ButtonInteraction): Promise<void> {
    logger.info('CharacterCreator.handleButton called with:', {
      customId: interaction.customId,
      userId: interaction.user.id,
      guildId: interaction.guildId
    });
    
    const session = creationSessions.get(interaction.user.id);
    
    if (!session) {
      logger.warn('No session found for user:', interaction.user.id);
      await interaction.reply({
        content: '❌ No character creation in progress. Use `/sheet create` to start.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }
    
    logger.info('Session found, current step:', session.currentStep);
    
    try {
      switch (interaction.customId) {
        case 'character_creation_set_name':
          await this.showNameModal(interaction);
          break;
        case 'character_creation_set_concept':
          await this.showConceptModal(interaction);
          break;
        case 'character_creation_select_archetypes':
          await this.showArchetypeSelect(interaction);
          break;
        case 'character_creation_assign_drives':
          await this.showDrivesModal(interaction);
          break;
        case 'character_creation_write_statements':
          await this.showDriveStatementsModal(interaction);
          break;
        case 'character_creation_assign_skills':
          await this.showSkillsModal(interaction);
          break;
        case 'character_creation_select_focuses':
          await this.showFocusesSelect(interaction);
          break;
        case 'character_creation_select_talents':
          await this.showTalentsSelect(interaction);
          break;
        case 'character_creation_select_assets':
          await this.showAssetsSelect(interaction);
          break;
        case 'character_creation_prev':
          session.currentStep = Math.max(0, session.currentStep - 1);
          await this.showStep(interaction, session);
          break;
        case 'character_creation_next':
          session.currentStep = Math.min(CREATION_STEPS.length - 1, session.currentStep + 1);
          await this.showStep(interaction, session);
          break;
        case 'character_creation_finalize':
          logger.info('FINALIZE BUTTON CLICKED - Handler reached!');
          await this.finalizeCharacter(interaction, session);
          break;
        case 'character_creation_cancel':
          await this.cancelCreation(interaction, session);
          break;
        case 'canon_prev':
          session.currentStep = Math.max(0, session.currentStep - 1);
          await this.showStep(interaction, session);
          break;
        case 'canon_next':
          session.currentStep = Math.min(CREATION_STEPS.length - 1, session.currentStep + 1);
          await this.showStep(interaction, session);
          break;
        case 'canon_select_focuses':
          await this.showFocusesSelect(interaction);
          break;
        case 'canon_select_talents':
          await this.showTalentsSelect(interaction);
          break;
        case 'canon_select_assets':
          await this.showAssetsSelect(interaction);
          break;
        case 'canon_finalize':
          await this.finalizeCharacter(interaction, session);
          break;
        default:
          await interaction.reply({
            content: '❌ Unknown button interaction.',
            flags: MessageFlags.Ephemeral
          });
      }
    } catch (error) {
      logger.error('Error handling button interaction:', error);
      await interaction.reply({
        content: '❌ An error occurred processing your button click.',
        flags: MessageFlags.Ephemeral
      });
    }
  }
  
  /**
   * Cancel character creation
   */
  static async cancelCreation(interaction: ButtonInteraction, session: CharacterCreationSession): Promise<void> {
    try {
      // Remove the session from memory
      creationSessions.delete(session.userId);
      
      // Send confirmation message
      await interaction.update({
        embeds: [new EmbedBuilder()
          .setTitle('❌ Character Creation Cancelled')
          .setDescription('Your character creation has been cancelled. All progress has been lost.\n\nYou can start a new character creation anytime with `/sheet create`.')
          .setColor(0xff0000)
          .setTimestamp()
        ],
        components: []
      });
      
      logger.info(`Character creation cancelled for user ${session.userId}`);
    } catch (error) {
      logger.error('Error cancelling character creation:', error);
      await interaction.reply({
        content: '❌ An error occurred while cancelling character creation.',
        flags: MessageFlags.Ephemeral
      });
    }
  }
  
  /**
   * Get character creation session
   */
  static getSession(userId: string): CharacterCreationSession | undefined {
    return creationSessions.get(userId);
  }
}
