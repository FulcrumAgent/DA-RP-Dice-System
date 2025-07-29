"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
exports.handleInteraction = handleInteraction;
exports.handleButtonInteraction = handleButtonInteraction;
const discord_js_1 = require("discord.js");
const character_manager_1 = require("../utils/character-manager");
const logger_1 = require("../utils/logger");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('sheet')
    .setDescription('Character sheet management commands')
    .addSubcommand(subcommand => subcommand
    .setName('create')
    .setDescription('Start creating a new character (unified ephemeral process)'))
    .addSubcommand(subcommand => subcommand
    .setName('view')
    .setDescription('View a character sheet')
    .addStringOption(option => option
    .setName('character')
    .setDescription('Character name to view')
    .setRequired(false)))
    .addSubcommand(subcommand => subcommand
    .setName('edit')
    .setDescription('Edit an existing character (unified ephemeral process)')
    .addStringOption(option => option
    .setName('character')
    .setDescription('Character name to edit')
    .setRequired(true)))
    .addSubcommand(subcommand => subcommand
    .setName('delete')
    .setDescription('Delete a character')
    .addStringOption(option => option
    .setName('character')
    .setDescription('Character name to delete')
    .setRequired(true)));
async function execute(interaction) {
    if (!interaction.isChatInputCommand())
        return;
    if (!interaction.guild) {
        await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
        return;
    }
    const member = interaction.member;
    const subcommand = interaction.options.getSubcommand();
    try {
        switch (subcommand) {
            case 'create':
                await handleCreateCharacter(interaction, member);
                break;
            case 'view':
                await handleViewCharacter(interaction, member);
                break;
            case 'edit':
                await handleEditCharacter(interaction, member);
                break;
            case 'delete':
                await handleDeleteCharacter(interaction, member);
                break;
            default:
                await interaction.reply({ content: 'Unknown subcommand.', ephemeral: true });
        }
    }
    catch (error) {
        logger_1.logger.error('Character sheet command error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: `❌ ${errorMessage}`, ephemeral: true });
        }
        else {
            await interaction.reply({ content: `❌ ${errorMessage}`, ephemeral: true });
        }
    }
}
async function handleCreateCharacter(interaction, member) {
    try {
        const existingCharacter = await character_manager_1.characterManager.getCharacter(member.id);
        if (existingCharacter) {
            await interaction.reply({
                content: '⚠️ You already have a character. Use `/sheet edit` to modify it or `/sheet delete` to remove it first.',
                ephemeral: true
            });
            return;
        }
        const { CharacterCreator } = await Promise.resolve().then(() => __importStar(require('./character-creator')));
        await CharacterCreator.startCreation(interaction, member);
        logger_1.logger.info(`Started character creation for user ${member.id} in guild ${interaction.guild.id}`);
    }
    catch (error) {
        logger_1.logger.error('Character creation start error:', error);
        throw error;
    }
}
async function handleViewCharacter(interaction, member) {
    try {
        const characterName = interaction.options.getString('character');
        let targetCharacter = null;
        let isOwner = false;
        if (characterName) {
            const userCharacter = await character_manager_1.characterManager.getCharacter(member.id);
            if (userCharacter && userCharacter.name.toLowerCase() === characterName.toLowerCase()) {
                targetCharacter = userCharacter;
                isOwner = true;
            }
        }
        else {
            targetCharacter = await character_manager_1.characterManager.getCharacter(member.id) || null;
            isOwner = true;
        }
        if (!targetCharacter) {
            await interaction.reply({
                content: characterName ? `❌ Character "${characterName}" not found.` : '❌ You don\'t have a character yet. Use `/sheet create` to make one.',
                ephemeral: true
            });
            return;
        }
        const embed = createCharacterViewEmbed(targetCharacter, isOwner);
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
    catch (error) {
        logger_1.logger.error('Character view error:', error);
        throw error;
    }
}
async function handleEditCharacter(interaction, member) {
    try {
        const characterName = interaction.options.getString('character', true);
        const character = await character_manager_1.characterManager.getCharacter(member.id);
        if (!character) {
            await interaction.reply({
                content: '❌ You don\'t have a character to edit. Use `/sheet create` to make one first.',
                ephemeral: true
            });
            return;
        }
        if (character.name.toLowerCase() !== characterName.toLowerCase()) {
            await interaction.reply({
                content: `❌ Character "${characterName}" not found or you don't own it.`,
                ephemeral: true
            });
            return;
        }
        await interaction.reply({
            content: `🔧 Character editing for "${character.name}" will be implemented in the unified ephemeral system.`,
            ephemeral: true
        });
    }
    catch (error) {
        logger_1.logger.error('Character edit error:', error);
        throw error;
    }
}
async function handleDeleteCharacter(interaction, member) {
    try {
        const characterName = interaction.options.getString('character', true);
        const character = await character_manager_1.characterManager.getCharacter(member.id);
        if (!character) {
            await interaction.reply({
                content: '❌ You don\'t have a character to delete.',
                ephemeral: true
            });
            return;
        }
        if (character.name.toLowerCase() !== characterName.toLowerCase()) {
            await interaction.reply({
                content: `❌ Character "${characterName}" not found or you don't own it.`,
                ephemeral: true
            });
            return;
        }
        const confirmButton = new discord_js_1.ButtonBuilder()
            .setCustomId('confirm_delete')
            .setLabel('Delete Character')
            .setStyle(discord_js_1.ButtonStyle.Danger);
        const cancelButton = new discord_js_1.ButtonBuilder()
            .setCustomId('cancel_delete')
            .setLabel('Cancel')
            .setStyle(discord_js_1.ButtonStyle.Secondary);
        const row = new discord_js_1.ActionRowBuilder()
            .addComponents(confirmButton, cancelButton);
        await interaction.reply({
            content: `⚠️ **Are you sure you want to delete "${character.name}"?**\n\nThis action cannot be undone!`,
            components: [row],
            ephemeral: true
        });
    }
    catch (error) {
        logger_1.logger.error('Character delete error:', error);
        throw error;
    }
}
function createCharacterViewEmbed(character, isOwner) {
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(0xD4AF37)
        .setTitle(`📜 ${character.name}`)
        .setDescription(character.concepts.join(', ') || 'No concept set');
    const getSkillValue = (skillName) => {
        const skill = character.skills.find(s => s.name === skillName);
        return skill?.value || 0;
    };
    const getDriveValue = (driveName) => {
        const drive = character.drives.find(d => d.name === driveName);
        return drive?.value || 0;
    };
    embed.addFields({
        name: '🎯 Drive Scores',
        value: `**Duty:** ${getDriveValue('Duty')}\n**Faith:** ${getDriveValue('Faith')}\n**Justice:** ${getDriveValue('Justice')}\n**Power:** ${getDriveValue('Power')}\n**Truth:** ${getDriveValue('Truth')}`,
        inline: true
    }, {
        name: '⚔️ Skill Scores',
        value: `**Battle:** ${getSkillValue('Battle')}\n**Communicate:** ${getSkillValue('Communicate')}\n**Discipline:** ${getSkillValue('Discipline')}\n**Move:** ${getSkillValue('Move')}\n**Understand:** ${getSkillValue('Understand')}`,
        inline: true
    });
    if (isOwner) {
        const focusText = character.skills
            .filter(skill => skill.focus && skill.focus.length > 0)
            .map(skill => `**${skill.name}:** ${skill.focus.join(', ')}`)
            .join('\n');
        if (focusText) {
            embed.addFields({ name: '🎯 Focuses', value: focusText, inline: false });
        }
        if (character.assets && character.assets.length > 0) {
            const assetText = character.assets.map(asset => `**${asset.name}** (${asset.type})`).join('\n');
            embed.addFields({ name: '🎒 Assets', value: assetText, inline: false });
        }
        if (character.traits && character.traits.length > 0) {
            const traitText = character.traits.map(trait => `**${trait.name}** (${trait.type})`).join('\n');
            embed.addFields({ name: '✨ Traits', value: traitText, inline: false });
        }
        const statementText = character.drives
            .filter(drive => drive.statement && drive.statement.trim().length > 0)
            .map(drive => `**${drive.name}:** "${drive.statement}"`)
            .join('\n');
        if (statementText) {
            embed.addFields({ name: '📝 Drive Statements', value: statementText, inline: false });
        }
    }
    else {
        embed.setFooter({ text: 'Limited view - only owner can see full details' });
    }
    return embed;
}
async function handleInteraction() {
    throw new Error('handleInteraction should not be called directly - use the execute function instead');
}
async function handleButtonInteraction() {
    throw new Error('handleButtonInteraction should not be called directly - use the execute function instead');
}
