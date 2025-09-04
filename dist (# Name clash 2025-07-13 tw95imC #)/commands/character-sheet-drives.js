"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DUNE_DRIVES = void 0;
exports.handleDrivesSelect = handleDrivesSelect;
exports.handleDriveSelect = handleDriveSelect;
exports.handleDriveValueSelect = handleDriveValueSelect;
exports.showDrivesOverview = showDrivesOverview;
const discord_js_1 = require("discord.js");
const character_creation_state_1 = require("../utils/character-creation-state");
exports.DUNE_DRIVES = ['Duty', 'Faith', 'Justice', 'Power', 'Truth'];
const DRIVE_VALUES = [8, 7, 6, 5, 4];
async function handleDrivesSelect(interaction, member) {
    const state = character_creation_state_1.characterCreationState.getState(member.id, interaction.guild.id);
    if (!state) {
        await interaction.reply({ content: 'No character creation in progress.', ephemeral: true });
        return;
    }
    const currentDrives = state.data.drives || {};
    const assignedValues = Object.values(currentDrives);
    const remainingValues = DRIVE_VALUES.filter(v => !assignedValues.includes(v));
    if (Object.keys(currentDrives).length === exports.DUNE_DRIVES.length) {
        if (!interaction.guild || !interaction.guildId) {
            await interaction.reply({ content: 'This command must be used in a server.', ephemeral: true });
            return;
        }
        await showDrivesOverview(interaction, member, interaction.guild, interaction.guildId, currentDrives);
        return;
    }
    const driveSelect = new discord_js_1.StringSelectMenuBuilder()
        .setCustomId('select_drive')
        .setPlaceholder('Select a drive to assign a value to')
        .addOptions(exports.DUNE_DRIVES
        .filter(drive => !(drive in currentDrives))
        .map(drive => ({
        label: drive,
        description: `Assign a value to ${drive}`,
        value: drive
    })));
    const row = new discord_js_1.ActionRowBuilder().addComponents(driveSelect);
    await interaction.reply({
        content: 'Select a drive to assign a value to:',
        components: [row],
        ephemeral: true
    });
}
async function handleDriveSelect(interaction, member) {
    const drive = interaction.values[0];
    const state = character_creation_state_1.characterCreationState.getState(member.id, interaction.guild.id);
    if (!state) {
        await interaction.reply({ content: 'No character creation in progress.', ephemeral: true });
        return;
    }
    const currentDrives = state.data.drives || {};
    const assignedValues = Object.values(currentDrives);
    const remainingValues = DRIVE_VALUES.filter(v => !assignedValues.includes(v));
    const valueSelect = new discord_js_1.StringSelectMenuBuilder()
        .setCustomId(`select_drive_value:${drive}`)
        .setPlaceholder(`Select a value for ${drive}`)
        .addOptions(remainingValues.map(value => ({
        label: value.toString(),
        description: `Assign ${value} to ${drive}`,
        value: value.toString()
    })));
    const row = new discord_js_1.ActionRowBuilder().addComponents(valueSelect);
    await interaction.update({
        content: `Select a value to assign to ${drive}:`,
        components: [row]
    });
}
async function handleDriveValueSelect(interaction, member) {
    const [_, drive] = interaction.customId.split(':');
    const value = parseInt(interaction.values[0]);
    const state = character_creation_state_1.characterCreationState.getState(member.id, interaction.guild.id);
    if (!state) {
        await interaction.reply({ content: 'No character creation in progress.', ephemeral: true });
        return;
    }
    const updatedDrives = { ...(state.data.drives || {}), [drive]: value };
    await character_creation_state_1.characterCreationState.updateState(member.id, interaction.guild.id, {
        data: { ...state.data, drives: updatedDrives },
        lastUpdated: Date.now()
    });
    if (!interaction.guild || !interaction.guildId) {
        await interaction.reply({ content: 'This command must be used in a server.', ephemeral: true });
        return;
    }
    await showDrivesOverview(interaction, member, interaction.guild, interaction.guildId, updatedDrives);
}
async function showDrivesOverview(interaction, member, guild, guildId, drives) {
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('Character Drives')
        .setDescription('Your character\'s core motivations and beliefs')
        .setColor(0xD4AF37);
    const drivesArray = Array.isArray(drives) ? drives : [];
    const driveFields = exports.DUNE_DRIVES.map((drive, index) => {
        const driveValue = drivesArray[index] || 'Not assigned';
        return {
            name: `🔹 ${drive}`,
            value: `**${driveValue}**`,
            inline: true
        };
    });
    embed.addFields(driveFields);
    const row = new discord_js_1.ActionRowBuilder()
        .addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId('drives_select')
        .setLabel('Edit Drives')
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
    return embed;
}
