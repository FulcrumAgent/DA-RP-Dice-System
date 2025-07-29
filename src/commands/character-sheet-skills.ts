import { 
  ButtonInteraction, 
  GuildMember, 
  ActionRowBuilder, 
  StringSelectMenuBuilder, 
  StringSelectMenuOptionBuilder,
  StringSelectMenuInteraction,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';
import { characterCreationState } from '../utils/character-creation-state';
import { logger } from '../utils/logger';
import { SKILLS, type Skill, type SkillsState, getInitialSkillsState } from '../data/skills';
import { showCreationPanel, CREATION_STEPS } from './character-creation-flow';

export async function handleSkillsReset(interaction: ButtonInteraction, member: GuildMember) {
  try {
    // Get current state
    const state = characterCreationState.getState(member.id, interaction.guild!.id);
    if (!state) {
      await interaction.reply({
        content: '❌ No character creation in progress.',
        ephemeral: true
      });
      return;
    }

    // Reset skills state to initial values
    await characterCreationState.updateState(member.id, member.guild.id, {
      tempData: { 
        ...(state.tempData || {}), 
        skillsState: getInitialSkillsState()
      }
    });

    // Update the panel
    await showCreationPanel(interaction, member, CREATION_STEPS.SKILLS, '✅ Skills reset successfully!');

  } catch (error) {
    logger.error('Error in handleSkillsReset:', error);
    await interaction.reply({
      content: '❌ Error resetting skills.',
      ephemeral: true
    });
  }
}

function buildSkillsEmbed(state: SkillsState) {
  const embed = new EmbedBuilder()
    .setTitle('🎯 Skills & Focuses')
    .setColor('#0099ff');

  let description = 'Assign skill values to your character. ';
  
  // Add remaining values information
  if (state.remainingValues.length > 0) {
    description += `\n\n**Remaining values to assign:** ${state.remainingValues.join(', ')}`;
  } else {
    description += '\n\n✅ All skill values have been assigned!';
  }
  
  // Add assigned skills
  const assignedSkills = Object.entries(state.assignedSkills);
  if (assignedSkills.length > 0) {
    description += '\n\n**Assigned Skills:**\n';
    description += assignedSkills
      .map(([skillId, value]) => {
        const skill = SKILLS.find(s => s.id === skillId);
        return `• **${skill?.name || skillId}**: ${value}`;
      })
      .join('\n');
  } else {
    description += '\n\nNo skills have been assigned yet.';
  }
  
  // Add instructions
  description += '\n\n**How to assign skills:**\n';
  description += '1. Click the "Assign Skills" button\n';
  description += '2. Select a skill from the dropdown\n';
  description += '3. Choose a value to assign to that skill\n';
  
  // Add current focus if applicable
  if (state.currentFocus) {
    description += `\n**Currently assigning a value to:** ${state.currentFocus}`;
  }
  
  embed.setDescription(description);
  
  return embed;
}

function buildSkillSelectMenu(state: SkillsState) {
  // Filter out already assigned skills and sort them alphabetically
  const availableSkills = SKILLS
    .filter(skill => !state.assignedSkills[skill.id])
    .sort((a, b) => a.name.localeCompare(b.name));
  
  if (availableSkills.length === 0) {
    return null;
  }

  const select = new StringSelectMenuBuilder()
    .setCustomId('select_skill')
    .setPlaceholder('Select a skill to assign a value')
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(
      availableSkills.map(skill => 
        new StringSelectMenuOptionBuilder()
          .setLabel(skill.name)
          .setDescription(skill.description.substring(0, 50) + (skill.description.length > 50 ? '...' : ''))
          .setValue(skill.name) // Use skill name as value instead of ID
      )
    );

  return select;
}

function buildValueSelectMenu(state: SkillsState, skillName: string) {
  if (!skillName) {
    logger.warn('No skill name provided to buildValueSelectMenu');
    return null;
  }

  // Get the skill details
  const skill = SKILLS.find(s => s.name === skillName);
  if (!skill) {
    logger.warn(`Skill with name ${skillName} not found`);
    return null;
  }

  // Sort remaining values in descending order (highest first)
  const sortedValues = [...new Set(state.remainingValues)]
    .map(v => v.toString())
    .sort((a, b) => parseInt(b) - parseInt(a));

  if (sortedValues.length === 0) {
    logger.warn(`No available values to assign to skill ${skill.name}`);
    return null;
  }

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('select_skill_value')
    .setPlaceholder(`Select a value for ${skill.name}`)
    .setMinValues(1)
    .setMaxValues(1);
  
  // Add options with descriptions for the highest values
  selectMenu.addOptions(
    sortedValues.map((value, index) => {
      const option = new StringSelectMenuOptionBuilder()
        .setLabel(`Value: ${value}`)
        .setValue(value.toString());
      
      // Add description for the highest and lowest values
      if (index === 0) {
        option.setDescription('Recommended: Highest available value');
      } else if (index === sortedValues.length - 1) {
        option.setDescription('Lowest available value');
      }
      
      return option;
    })
  );

  return selectMenu;
}

export async function handleSkillsAssign(interaction: ButtonInteraction, member: GuildMember) {
  try {
    // Get current state
    const state = characterCreationState.getState(member.id, interaction.guild!.id);
    if (!state) {
      await interaction.reply({
        content: '❌ No character creation in progress.',
        ephemeral: true
      });
      return;
    }

    // Initialize or get skills state
    let skillsState: SkillsState;
    if (!state.tempData?.skillsState) {
      skillsState = getInitialSkillsState();
      // Update the state with new tempData
      await characterCreationState.updateState(member.id, member.guild.id, {
        tempData: { 
          ...(state.tempData || {}), 
          skillsState: {
            ...skillsState,
            remainingSkills: skillsState.remainingSkills
          }
        }
      });
    } else {
      skillsState = { ...state.tempData.skillsState };
    }

    // Build the embed
    const embed = buildSkillsEmbed(skillsState);
    const rows: (ActionRowBuilder<StringSelectMenuBuilder> | ActionRowBuilder<ButtonBuilder>)[] = [];

    // Add skill select menu if we're not in the middle of assigning a value
    if (!skillsState.currentFocus) {
      const skillSelect = buildSkillSelectMenu(skillsState);
      if (skillSelect) {
        rows.push(
          new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(skillSelect)
        );
      }
    } else {
      // If we're in the middle of assigning a value, show the value selection
      const skill = SKILLS.find(s => s.name === skillsState.currentFocus);
      if (skill) {
        const valueSelect = buildValueSelectMenu(skillsState, skill.id);
        if (valueSelect) {
          rows.push(
            new ActionRowBuilder<StringSelectMenuBuilder>()
              .addComponents(valueSelect)
          );
          
          // Add cancel button
          rows.push(
            new ActionRowBuilder<ButtonBuilder>()
              .addComponents(
                new ButtonBuilder()
                  .setCustomId('cancel_skill_assignment')
                  .setLabel('Cancel Assignment')
                  .setStyle(ButtonStyle.Danger)
              )
          );
        }
      }
    }

    // Add navigation buttons
    const navRow = new ActionRowBuilder<ButtonBuilder>();
    
    // Previous button
    navRow.addComponents(
      new ButtonBuilder()
        .setCustomId('nav_prev_SKILLS')
        .setLabel('← Previous')
        .setStyle(ButtonStyle.Secondary)
    );
    
    // Next button (disabled if not all skills are assigned)
    const nextButton = new ButtonBuilder()
      .setCustomId('nav_next_SKILLS')
      .setLabel('Next →')
      .setStyle(ButtonStyle.Primary);
      
    if (skillsState.remainingValues.length > 0) {
      nextButton.setDisabled(true);
    }
    
    navRow.addComponents(nextButton);
    rows.push(navRow);

    // Update the interaction
    const response = {
      embeds: [embed],
      components: rows,
      content: ''
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.editReply(response);
    } else {
      await interaction.update(response);
    }

  } catch (error) {
    logger.error('Error in handleSkillsAssign:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: '❌ An error occurred while assigning skills.',
        ephemeral: true
      });
    } else {
      await interaction.followUp({
        content: '❌ An error occurred while assigning skills.',
        ephemeral: true
      });
    }
  }
}

export async function handleSkillSelect(interaction: StringSelectMenuInteraction, member: GuildMember) {
  try {
    const skillName = interaction.values[0];
    const state = characterCreationState.getState(member.id, interaction.guild!.id);
    
    if (!state?.tempData?.skillsState) {
      await interaction.reply({
        content: '❌ No skills assignment in progress.',
        ephemeral: true
      });
      return;
    }

    // Update state with selected skill
    const skill = SKILLS.find(s => s.name === skillName);
    if (!skill) {
      await interaction.reply({
        content: '❌ Invalid skill selected.',
        ephemeral: true
      });
      return;
    }
    
    const skillsState = { ...state.tempData.skillsState };
    skillsState.currentFocus = skillName;
    
    await characterCreationState.updateState(member.id, member.guild.id, {
      tempData: {
        ...state.tempData,
        skillsState
      }
    });

    // Show the value selection menu
    const embed = new EmbedBuilder()
      .setTitle(`Assign Value to ${skillName}`)
      .setDescription(`Select a value to assign to **${skillName}**`)
      .setColor('#0099ff');

    const valueSelect = buildValueSelectMenu(skillsState, skillName);
    
    if (!valueSelect) {
      await interaction.reply({
        content: '❌ No valid values available to assign.',
        ephemeral: true
      });
      return;
    }
    
    const row = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(valueSelect);
    
    const cancelButton = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('cancel_skill_assignment')
          .setLabel('Cancel')
          .setStyle(ButtonStyle.Danger)
      );
    
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply({
        embeds: [embed],
        components: [row, cancelButton]
      });
    } else {
      await interaction.update({
        embeds: [embed],
        components: [row, cancelButton],
        content: ''
      });
    }
  } catch (error) {
    logger.error('Error in handleSkillSelect:', error);
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: '❌ An error occurred while selecting a skill.',
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: '❌ An error occurred while selecting a skill.',
        ephemeral: true
      });
    }
  }
}

export async function handleSkillValueSelect(interaction: StringSelectMenuInteraction, member: GuildMember) {
  try {
    // Parse the selected value
    const value = parseInt(interaction.values[0]);
    if (isNaN(value)) {
      await interaction.reply({
        content: '❌ Invalid value selected.',
        ephemeral: true
      });
      return;
    }
    
    // Get current character creation state
    const state = characterCreationState.getState(member.id, interaction.guild!.id);
    if (!state?.tempData?.skillsState?.currentFocus) {
      await interaction.reply({
        content: '❌ No skill selected for assignment.',
        ephemeral: true
      });
      return;
    }

    // Create a properly typed copy of the skills state with explicit types
    const currentSkillsState = state.tempData.skillsState;
    const skillsState: SkillsState = { 
      remainingSkills: [...currentSkillsState.remainingSkills],
      remainingValues: [...currentSkillsState.remainingValues],
      assignedSkills: { ...currentSkillsState.assignedSkills },
      currentFocus: currentSkillsState.currentFocus
    };
    
    // Find the skill being updated
    const skillName = skillsState.currentFocus!;
    const skill = SKILLS.find((s: Skill) => s.name === skillName);
    
    if (!skill) {
      await interaction.reply({
        content: '❌ Invalid skill selected.',
        ephemeral: true
      });
      return;
    }

    // Handle case where skill already has a value assigned
    if (skillsState.assignedSkills[skillName] !== undefined) {
      // Return the old value to the pool if it's different from the new one
      const oldValue = skillsState.assignedSkills[skillName];
      if (oldValue !== value) {
        skillsState.remainingValues.push(oldValue);
      }
    }

    // Update assigned skills with the new value
    skillsState.assignedSkills[skillName] = value;
    
    // Remove the assigned value from remaining values
    const valueIndex = skillsState.remainingValues.indexOf(value);
    if (valueIndex > -1) {
      skillsState.remainingValues.splice(valueIndex, 1);
    } else {
      // If value wasn't found in remaining values, log a warning but continue
      logger.warn(`Value ${value} not found in remaining values for skill ${skill.name}`);
    }
    
    // Clear current focus after assignment
    skillsState.currentFocus = undefined;
    
    // Update state with new skills and tempData
    await characterCreationState.updateState(member.id, member.guild.id, {
      data: {
        ...state.data,
        skills: { ...(state.data?.skills || {}), ...skillsState.assignedSkills }
      },
      tempData: {
        ...state.tempData,
        skillsState
      }
    });

    // Show success message and return to main panel
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply({
        content: `✅ Assigned **${skill.name}** with value **${value}**`,
        components: [],
        embeds: []
      });
    } else {
      await interaction.update({
        content: `✅ Assigned **${skill.name}** with value **${value}**`,
        components: [],
        embeds: []
      });
    }
    
    // Show the main panel again
    await showCreationPanel(interaction, member, CREATION_STEPS.SKILLS, `✅ Assigned **${skill.name}** with value **${value}**`);
  } catch (error) {
    logger.error('Error in handleSkillValueSelect:', error);
    await interaction.reply({
      content: '❌ An error occurred while assigning the skill value.',
      ephemeral: true
    });
  }
}

export async function handleCancelSkillAssignment(interaction: ButtonInteraction, member: GuildMember) {
  try {
    const state = characterCreationState.getState(member.id, interaction.guild!.id);
    
    if (!state?.tempData?.skillsState) {
      await interaction.reply({
        content: '❌ No skills assignment in progress.',
        ephemeral: true
      });
      return;
    }
    
    // Clear the current focus
    const skillsState = { ...state.tempData.skillsState };
    const wasAssigning = !!skillsState.currentFocus;
    skillsState.currentFocus = undefined;
    
    // Update state
    await characterCreationState.updateState(member.id, member.guild.id, {
      tempData: {
        ...state.tempData,
        skillsState
      }
    });
    
    // Show cancellation message and return to main panel
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply({
        content: wasAssigning ? '❌ Skill assignment cancelled.' : '',
        components: [],
        embeds: []
      });
    } else {
      await interaction.update({
        content: wasAssigning ? '❌ Skill assignment cancelled.' : '',
        components: [],
        embeds: []
      });
    }
    
    // Show the main panel again
    await showCreationPanel(interaction, member, CREATION_STEPS.SKILLS);
  } catch (error) {
    logger.error('Error in handleCancelSkillAssignment:', error);
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: '❌ An error occurred while canceling skill assignment.',
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: '❌ An error occurred while canceling skill assignment.',
        ephemeral: true
      });
    }
  }
}
