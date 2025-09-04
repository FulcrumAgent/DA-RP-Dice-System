"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleFinalizeButton = handleFinalizeButton;
exports.handleCancelButton = handleCancelButton;
const discord_js_1 = require("discord.js");
const character_creation_state_1 = require("../utils/character-creation-state");
const character_manager_1 = require("../utils/character-manager");
const logger_1 = require("../utils/logger");
async function handleFinalizeButton(interaction) {
    if (!interaction.guild || !interaction.member) {
        await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
        return;
    }
    const member = interaction.member;
    await interaction.deferReply();
    try {
        const state = character_creation_state_1.characterCreationState.getState(member.id, interaction.guild.id);
        if (!state) {
            await interaction.editReply({ content: '❌ No character creation in progress.' });
            return;
        }
        await character_manager_1.characterManager.createCharacter(member.id, interaction.guild.id, state.data.name || 'Unnamed Character', state.data.concepts || [], {
            house: state.data.house,
            homeworld: state.data.homeworld
        });
        await character_creation_state_1.characterCreationState.completeCreation(member.id, interaction.guild.id);
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('✅ Character Finalized!')
            .setDescription(`**${state.data.name}** has been saved successfully!\n\nYou can now use \`/sheet view\` to see your character or \`/sheet edit\` to make changes.`)
            .setColor(0x00FF00);
        await interaction.editReply({ embeds: [embed], components: [] });
    }
    catch (error) {
        logger_1.logger.error('Finalize character error:', error);
        await interaction.editReply({ content: '❌ Failed to finalize character. Please try again.' });
    }
}
async function handleCancelButton(interaction) {
    if (!interaction.guild || !interaction.member) {
        await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
        return;
    }
    const member = interaction.member;
    await interaction.deferReply();
    try {
        const state = character_creation_state_1.characterCreationState.getState(member.id, interaction.guild.id);
        if (!state) {
            await interaction.editReply({ content: '❌ No character creation in progress.' });
            return;
        }
        await character_creation_state_1.characterCreationState.cancelCreation(member.id, interaction.guild.id);
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('❌ Character Creation Cancelled')
            .setDescription('Your character creation has been cancelled. Use `/sheet create` to start over.')
            .setColor(0xFF0000);
        await interaction.editReply({ embeds: [embed], components: [] });
    }
    catch (error) {
        logger_1.logger.error('Cancel character error:', error);
        await interaction.editReply({ content: '❌ Failed to cancel character creation.' });
    }
}
