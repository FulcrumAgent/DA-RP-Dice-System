"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleInteraction = handleInteraction;
exports.handleButtonInteraction = handleButtonInteraction;
const character_manager_1 = require("../utils/character-manager");
const character_sheet_1 = require("./character-sheet");
async function handleInteraction(interaction) {
    const member = interaction.member;
    if (interaction.customId === 'delete_character_select') {
        await handleDeleteCharacterSelect(interaction, member);
    }
    else {
        await (0, character_sheet_1.handleInteraction)(interaction);
    }
}
async function handleButtonInteraction(interaction) {
    const member = interaction.member;
    if (interaction.customId === 'delete_character_cancel') {
        await handleDeleteCharacterCancel(interaction, member);
    }
    else {
        await (0, character_sheet_1.handleButtonInteraction)(interaction);
    }
}
async function handleDeleteCharacterSelect(interaction, member) {
    const characterId = interaction.values[0];
    const character = character_manager_1.characterManager.getCharacter(characterId);
    if (!character) {
        await interaction.update({
            content: '❌ Character not found.',
            components: []
        });
        return;
    }
    if (character.userId !== member.id) {
        await interaction.update({
            content: '❌ You can only delete your own characters.',
            components: []
        });
        return;
    }
    await interaction.deferUpdate();
    try {
        await character_manager_1.characterManager.deleteCharacter(characterId, member.id);
        await interaction.editReply({
            content: `💀 Character **${character.name}** has been deleted. Farewell, ${character.concepts.join(', ')}.`,
            components: []
        });
    }
    catch (error) {
        await interaction.editReply({
            content: `❌ Failed to delete character: ${error}`,
            components: []
        });
    }
}
async function handleDeleteCharacterCancel(interaction, member) {
    await interaction.update({
        content: '✅ Character deletion cancelled.',
        components: []
    });
}
