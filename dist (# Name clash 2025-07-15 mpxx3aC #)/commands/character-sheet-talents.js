"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleTalentsSelect = handleTalentsSelect;
exports.handleTalentSelect = handleTalentSelect;
exports.showTalentsOverview = showTalentsOverview;
const discord_js_1 = require("discord.js");
const character_creation_state_1 = require("../utils/character-creation-state");
const AVAILABLE_TALENTS = [
    { id: 'mentat', name: 'Mentat', description: 'Advanced mental calculation and data processing' },
    { id: 'weirding_way', name: 'Weirding Way', description: 'Bene Gesserit martial arts and voice control' },
    { id: 'swordmaster', name: 'Swordmaster', description: 'Mastery of bladed weapons' },
    { id: 'desert_survival', name: 'Desert Survival', description: 'Expertise in surviving in desert environments' },
    { id: 'mentat_memory', name: 'Mentat Memory', description: 'Perfect recall of information' },
    { id: 'voice', name: 'The Voice', description: 'Power to control others with vocal patterns' },
    { id: 'prescience', name: 'Prescience', description: 'Limited ability to see possible futures' },
    { id: 'shield_fighter', name: 'Shield Fighter', description: 'Specialized in shield combat techniques' },
    { id: 'diplomat', name: 'Diplomat', description: 'Skilled in negotiation and politics' },
    { id: 'smuggler', name: 'Smuggler', description: 'Expertise in moving goods undetected' },
    { id: 'mechanic', name: 'Mechanic', description: 'Skill with machinery and technology' },
    { id: 'healer', name: 'Healer', description: 'Medical knowledge and first aid skills' }
];
async function handleTalentsSelect(interaction, member) {
    const state = character_creation_state_1.characterCreationState.getState(member.id, interaction.guild.id);
    if (!state) {
        await interaction.reply({ content: 'No character creation in progress.', ephemeral: true });
        return;
    }
    const selectedTalents = state.data.talents || [];
    const availableTalents = AVAILABLE_TALENTS.filter(t => !selectedTalents.includes(t.id));
    if (availableTalents.length === 0) {
        await showTalentsOverview(interaction, member, selectedTalents);
        return;
    }
    const talentSelect = new discord_js_1.StringSelectMenuBuilder()
        .setCustomId('select_talent')
        .setPlaceholder('Select a talent to add')
        .setMinValues(1)
        .setMaxValues(1)
        .addOptions(availableTalents.map(talent => ({
        label: talent.name,
        description: talent.description,
        value: talent.id
    })));
    const row = new discord_js_1.ActionRowBuilder().addComponents(talentSelect);
    await interaction.reply({
        content: 'Select a talent to add to your character:',
        components: [row],
        ephemeral: true
    });
}
async function handleTalentSelect(interaction, member) {
    const talentId = interaction.values[0];
    const talent = AVAILABLE_TALENTS.find(t => t.id === talentId);
    if (!talent) {
        await interaction.reply({ content: 'Invalid talent selected.', ephemeral: true });
        return;
    }
    const state = character_creation_state_1.characterCreationState.getState(member.id, interaction.guild.id);
    if (!state) {
        await interaction.reply({ content: 'No character creation in progress.', ephemeral: true });
        return;
    }
    const updatedTalents = [...(state.data.talents || []), talentId];
    await character_creation_state_1.characterCreationState.updateState(member.id, interaction.guild.id, {
        data: { ...state.data, talents: updatedTalents },
        lastUpdated: Date.now()
    });
    await showTalentsOverview(interaction, member, updatedTalents);
}
async function showTalentsOverview(interaction, member, talentIds = []) {
    const selectedTalents = talentIds.map(id => AVAILABLE_TALENTS.find(t => t.id === id)).filter(Boolean);
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('Character Talents')
        .setDescription('Special abilities and training for your character')
        .setColor(0xD4AF37);
    if (selectedTalents.length > 0) {
        embed.addFields(selectedTalents.map((talent, index) => ({
            name: `🎯 ${talent?.name || `Talent ${index + 1}`}`,
            value: talent?.description || 'No description available',
            inline: true
        })));
    }
    else {
        embed.setDescription('No talents selected yet. Click the button below to add talents.');
    }
    const row = new discord_js_1.ActionRowBuilder()
        .addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId('talents_select')
        .setLabel(selectedTalents.length > 0 ? 'Add Another Talent' : 'Select Talents')
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
