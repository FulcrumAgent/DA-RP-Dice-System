"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleStatementsCreate = handleStatementsCreate;
exports.handleStatementModal = handleStatementModal;
exports.showStatementsOverview = showStatementsOverview;
const discord_js_1 = require("discord.js");
const character_creation_state_1 = require("../utils/character-creation-state");
async function handleStatementsCreate(interaction, member) {
    const state = character_creation_state_1.characterCreationState.getState(member.id, interaction.guild.id);
    if (!state) {
        await interaction.reply({ content: 'No character creation in progress.', ephemeral: true });
        return;
    }
    const modal = new discord_js_1.ModalBuilder()
        .setCustomId('statement_modal')
        .setTitle('Create a Personal Statement');
    const statementInput = new discord_js_1.TextInputBuilder()
        .setCustomId('statement_text')
        .setLabel('Your personal statement (max 200 characters)')
        .setStyle(discord_js_1.TextInputStyle.Paragraph)
        .setMaxLength(200)
        .setRequired(true);
    const firstActionRow = new discord_js_1.ActionRowBuilder().addComponents(statementInput);
    modal.addComponents(firstActionRow);
    await interaction.showModal(modal);
}
async function handleStatementModal(interaction, member) {
    const statement = interaction.fields.getTextInputValue('statement_text');
    const state = character_creation_state_1.characterCreationState.getState(member.id, interaction.guild.id);
    if (!state) {
        await interaction.reply({ content: 'No character creation in progress.', ephemeral: true });
        return;
    }
    const [drive, ...textParts] = statement.split(':');
    const statementText = textParts.join(':').trim();
    const updatedStatements = {
        ...(state.data.statements || {}),
        [drive]: statementText
    };
    await character_creation_state_1.characterCreationState.updateState(member.id, interaction.guild.id, {
        data: { ...state.data, statements: updatedStatements },
        lastUpdated: Date.now()
    });
    await showStatementsOverview(interaction, member, updatedStatements);
}
async function showStatementsOverview(interaction, member, statements = {}) {
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('Personal Statements')
        .setDescription('These statements define your character\'s beliefs, goals, or personal mottos')
        .addFields(Object.entries(statements).map(([drive, text]) => ({
        name: drive,
        value: text || '*No statement provided*',
        inline: false
    })))
        .setColor(0xD4AF37);
    if (Object.keys(statements).length === 0) {
        embed.setDescription('No statements added yet. Use the button below to add one.');
    }
    const row = new discord_js_1.ActionRowBuilder()
        .addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId('statements_create')
        .setLabel(Object.keys(statements).length > 0 ? 'Add Another Statement' : 'Create Statement')
        .setStyle(1));
    if (interaction.deferred || interaction.replied) {
        await interaction.editReply({
            embeds: [embed],
            components: [row],
            content: ''
        });
    }
    else {
        await interaction.reply({
            embeds: [embed],
            components: [row],
            ephemeral: true
        });
    }
}
