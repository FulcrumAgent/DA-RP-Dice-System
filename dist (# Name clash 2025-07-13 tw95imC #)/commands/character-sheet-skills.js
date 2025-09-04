"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSkillsReset = handleSkillsReset;
exports.handleSkillsAssign = handleSkillsAssign;
exports.handleSkillSelect = handleSkillSelect;
exports.handleSkillValueSelect = handleSkillValueSelect;
exports.handleCancelSkillAssignment = handleCancelSkillAssignment;
const discord_js_1 = require("discord.js");
const character_creation_state_1 = require("../utils/character-creation-state");
const logger_1 = require("../utils/logger");
const skills_1 = require("../data/skills");
const character_creation_flow_1 = require("./character-creation-flow");
async function handleSkillsReset(interaction, member) {
    try {
        const state = character_creation_state_1.characterCreationState.getState(member.id, interaction.guild.id);
        if (!state) {
            await interaction.reply({
                content: '❌ No character creation in progress.',
                ephemeral: true
            });
            return;
        }
        await character_creation_state_1.characterCreationState.updateState(member.id, member.guild.id, {
            tempData: {
                ...(state.tempData || {}),
                skillsState: (0, skills_1.getInitialSkillsState)()
            }
        });
        await (0, character_creation_flow_1.showCreationPanel)(interaction, member, character_creation_flow_1.CREATION_STEPS.SKILLS, '✅ Skills reset successfully!');
    }
    catch (error) {
        logger_1.logger.error('Error in handleSkillsReset:', error);
        await interaction.reply({
            content: '❌ Error resetting skills.',
            ephemeral: true
        });
    }
}
function buildSkillsEmbed(state) {
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('🎯 Skills & Focuses')
        .setColor('#0099ff');
    let description = 'Assign skill values to your character. ';
    if (state.remainingValues.length > 0) {
        description += `\n\n**Remaining values to assign:** ${state.remainingValues.join(', ')}`;
    }
    else {
        description += '\n\n✅ All skill values have been assigned!';
    }
    const assignedSkills = Object.entries(state.assignedSkills);
    if (assignedSkills.length > 0) {
        description += '\n\n**Assigned Skills:**\n';
        description += assignedSkills
            .map(([skillId, value]) => {
            const skill = skills_1.SKILLS.find(s => s.id === skillId);
            return `• **${skill?.name || skillId}**: ${value}`;
        })
            .join('\n');
    }
    else {
        description += '\n\nNo skills have been assigned yet.';
    }
    description += '\n\n**How to assign skills:**\n';
    description += '1. Click the "Assign Skills" button\n';
    description += '2. Select a skill from the dropdown\n';
    description += '3. Choose a value to assign to that skill\n';
    if (state.currentFocus) {
        description += `\n**Currently assigning a value to:** ${state.currentFocus}`;
    }
    embed.setDescription(description);
    return embed;
}
function buildSkillSelectMenu(state) {
    const availableSkills = skills_1.SKILLS
        .filter(skill => !state.assignedSkills[skill.id])
        .sort((a, b) => a.name.localeCompare(b.name));
    if (availableSkills.length === 0) {
        return null;
    }
    const select = new discord_js_1.StringSelectMenuBuilder()
        .setCustomId('select_skill')
        .setPlaceholder('Select a skill to assign a value')
        .setMinValues(1)
        .setMaxValues(1)
        .addOptions(availableSkills.map(skill => new discord_js_1.StringSelectMenuOptionBuilder()
        .setLabel(skill.name)
        .setDescription(skill.description.substring(0, 50) + (skill.description.length > 50 ? '...' : ''))
        .setValue(skill.name)));
    return select;
}
function buildValueSelectMenu(state, skillName) {
    if (!skillName) {
        logger_1.logger.warn('No skill name provided to buildValueSelectMenu');
        return null;
    }
    const skill = skills_1.SKILLS.find(s => s.name === skillName);
    if (!skill) {
        logger_1.logger.warn(`Skill with name ${skillName} not found`);
        return null;
    }
    const sortedValues = [...new Set(state.remainingValues)]
        .map(v => v.toString())
        .sort((a, b) => parseInt(b) - parseInt(a));
    if (sortedValues.length === 0) {
        logger_1.logger.warn(`No available values to assign to skill ${skill.name}`);
        return null;
    }
    const selectMenu = new discord_js_1.StringSelectMenuBuilder()
        .setCustomId('select_skill_value')
        .setPlaceholder(`Select a value for ${skill.name}`)
        .setMinValues(1)
        .setMaxValues(1);
    selectMenu.addOptions(sortedValues.map((value, index) => {
        const option = new discord_js_1.StringSelectMenuOptionBuilder()
            .setLabel(`Value: ${value}`)
            .setValue(value.toString());
        if (index === 0) {
            option.setDescription('Recommended: Highest available value');
        }
        else if (index === sortedValues.length - 1) {
            option.setDescription('Lowest available value');
        }
        return option;
    }));
    return selectMenu;
}
async function handleSkillsAssign(interaction, member) {
    try {
        const state = character_creation_state_1.characterCreationState.getState(member.id, interaction.guild.id);
        if (!state) {
            await interaction.reply({
                content: '❌ No character creation in progress.',
                ephemeral: true
            });
            return;
        }
        let skillsState;
        if (!state.tempData?.skillsState) {
            skillsState = (0, skills_1.getInitialSkillsState)();
            await character_creation_state_1.characterCreationState.updateState(member.id, member.guild.id, {
                tempData: {
                    ...(state.tempData || {}),
                    skillsState: {
                        ...skillsState,
                        remainingSkills: skillsState.remainingSkills
                    }
                }
            });
        }
        else {
            skillsState = { ...state.tempData.skillsState };
        }
        const embed = buildSkillsEmbed(skillsState);
        const rows = [];
        if (!skillsState.currentFocus) {
            const skillSelect = buildSkillSelectMenu(skillsState);
            if (skillSelect) {
                rows.push(new discord_js_1.ActionRowBuilder()
                    .addComponents(skillSelect));
            }
        }
        else {
            const skill = skills_1.SKILLS.find(s => s.name === skillsState.currentFocus);
            if (skill) {
                const valueSelect = buildValueSelectMenu(skillsState, skill.id);
                if (valueSelect) {
                    rows.push(new discord_js_1.ActionRowBuilder()
                        .addComponents(valueSelect));
                    rows.push(new discord_js_1.ActionRowBuilder()
                        .addComponents(new discord_js_1.ButtonBuilder()
                        .setCustomId('cancel_skill_assignment')
                        .setLabel('Cancel Assignment')
                        .setStyle(discord_js_1.ButtonStyle.Danger)));
                }
            }
        }
        const navRow = new discord_js_1.ActionRowBuilder();
        navRow.addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId('nav_prev_SKILLS')
            .setLabel('← Previous')
            .setStyle(discord_js_1.ButtonStyle.Secondary));
        const nextButton = new discord_js_1.ButtonBuilder()
            .setCustomId('nav_next_SKILLS')
            .setLabel('Next →')
            .setStyle(discord_js_1.ButtonStyle.Primary);
        if (skillsState.remainingValues.length > 0) {
            nextButton.setDisabled(true);
        }
        navRow.addComponents(nextButton);
        rows.push(navRow);
        const response = {
            embeds: [embed],
            components: rows,
            content: ''
        };
        if (interaction.replied || interaction.deferred) {
            await interaction.editReply(response);
        }
        else {
            await interaction.update(response);
        }
    }
    catch (error) {
        logger_1.logger.error('Error in handleSkillsAssign:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '❌ An error occurred while assigning skills.',
                ephemeral: true
            });
        }
        else {
            await interaction.followUp({
                content: '❌ An error occurred while assigning skills.',
                ephemeral: true
            });
        }
    }
}
async function handleSkillSelect(interaction, member) {
    try {
        const skillName = interaction.values[0];
        const state = character_creation_state_1.characterCreationState.getState(member.id, interaction.guild.id);
        if (!state?.tempData?.skillsState) {
            await interaction.reply({
                content: '❌ No skills assignment in progress.',
                ephemeral: true
            });
            return;
        }
        const skill = skills_1.SKILLS.find(s => s.name === skillName);
        if (!skill) {
            await interaction.reply({
                content: '❌ Invalid skill selected.',
                ephemeral: true
            });
            return;
        }
        const skillsState = { ...state.tempData.skillsState };
        skillsState.currentFocus = skillName;
        await character_creation_state_1.characterCreationState.updateState(member.id, member.guild.id, {
            tempData: {
                ...state.tempData,
                skillsState
            }
        });
        const embed = new discord_js_1.EmbedBuilder()
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
        const row = new discord_js_1.ActionRowBuilder()
            .addComponents(valueSelect);
        const cancelButton = new discord_js_1.ActionRowBuilder()
            .addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId('cancel_skill_assignment')
            .setLabel('Cancel')
            .setStyle(discord_js_1.ButtonStyle.Danger));
        if (interaction.replied || interaction.deferred) {
            await interaction.editReply({
                embeds: [embed],
                components: [row, cancelButton]
            });
        }
        else {
            await interaction.update({
                embeds: [embed],
                components: [row, cancelButton],
                content: ''
            });
        }
    }
    catch (error) {
        logger_1.logger.error('Error in handleSkillSelect:', error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: '❌ An error occurred while selecting a skill.',
                ephemeral: true
            });
        }
        else {
            await interaction.reply({
                content: '❌ An error occurred while selecting a skill.',
                ephemeral: true
            });
        }
    }
}
async function handleSkillValueSelect(interaction, member) {
    try {
        const value = parseInt(interaction.values[0]);
        if (isNaN(value)) {
            await interaction.reply({
                content: '❌ Invalid value selected.',
                ephemeral: true
            });
            return;
        }
        const state = character_creation_state_1.characterCreationState.getState(member.id, interaction.guild.id);
        if (!state?.tempData?.skillsState?.currentFocus) {
            await interaction.reply({
                content: '❌ No skill selected for assignment.',
                ephemeral: true
            });
            return;
        }
        const currentSkillsState = state.tempData.skillsState;
        const skillsState = {
            remainingSkills: [...currentSkillsState.remainingSkills],
            remainingValues: [...currentSkillsState.remainingValues],
            assignedSkills: { ...currentSkillsState.assignedSkills },
            currentFocus: currentSkillsState.currentFocus
        };
        const skillName = skillsState.currentFocus;
        const skill = skills_1.SKILLS.find((s) => s.name === skillName);
        if (!skill) {
            await interaction.reply({
                content: '❌ Invalid skill selected.',
                ephemeral: true
            });
            return;
        }
        if (skillsState.assignedSkills[skillName] !== undefined) {
            const oldValue = skillsState.assignedSkills[skillName];
            if (oldValue !== value) {
                skillsState.remainingValues.push(oldValue);
            }
        }
        skillsState.assignedSkills[skillName] = value;
        const valueIndex = skillsState.remainingValues.indexOf(value);
        if (valueIndex > -1) {
            skillsState.remainingValues.splice(valueIndex, 1);
        }
        else {
            logger_1.logger.warn(`Value ${value} not found in remaining values for skill ${skill.name}`);
        }
        skillsState.currentFocus = undefined;
        await character_creation_state_1.characterCreationState.updateState(member.id, member.guild.id, {
            data: {
                ...state.data,
                skills: { ...(state.data?.skills || {}), ...skillsState.assignedSkills }
            },
            tempData: {
                ...state.tempData,
                skillsState
            }
        });
        if (interaction.replied || interaction.deferred) {
            await interaction.editReply({
                content: `✅ Assigned **${skill.name}** with value **${value}**`,
                components: [],
                embeds: []
            });
        }
        else {
            await interaction.update({
                content: `✅ Assigned **${skill.name}** with value **${value}**`,
                components: [],
                embeds: []
            });
        }
        await (0, character_creation_flow_1.showCreationPanel)(interaction, member, character_creation_flow_1.CREATION_STEPS.SKILLS, `✅ Assigned **${skill.name}** with value **${value}**`);
    }
    catch (error) {
        logger_1.logger.error('Error in handleSkillValueSelect:', error);
        await interaction.reply({
            content: '❌ An error occurred while assigning the skill value.',
            ephemeral: true
        });
    }
}
async function handleCancelSkillAssignment(interaction, member) {
    try {
        const state = character_creation_state_1.characterCreationState.getState(member.id, interaction.guild.id);
        if (!state?.tempData?.skillsState) {
            await interaction.reply({
                content: '❌ No skills assignment in progress.',
                ephemeral: true
            });
            return;
        }
        const skillsState = { ...state.tempData.skillsState };
        const wasAssigning = !!skillsState.currentFocus;
        skillsState.currentFocus = undefined;
        await character_creation_state_1.characterCreationState.updateState(member.id, member.guild.id, {
            tempData: {
                ...state.tempData,
                skillsState
            }
        });
        if (interaction.replied || interaction.deferred) {
            await interaction.editReply({
                content: wasAssigning ? '❌ Skill assignment cancelled.' : '',
                components: [],
                embeds: []
            });
        }
        else {
            await interaction.update({
                content: wasAssigning ? '❌ Skill assignment cancelled.' : '',
                components: [],
                embeds: []
            });
        }
        await (0, character_creation_flow_1.showCreationPanel)(interaction, member, character_creation_flow_1.CREATION_STEPS.SKILLS);
    }
    catch (error) {
        logger_1.logger.error('Error in handleCancelSkillAssignment:', error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: '❌ An error occurred while canceling skill assignment.',
                ephemeral: true
            });
        }
        else {
            await interaction.reply({
                content: '❌ An error occurred while canceling skill assignment.',
                ephemeral: true
            });
        }
    }
}
