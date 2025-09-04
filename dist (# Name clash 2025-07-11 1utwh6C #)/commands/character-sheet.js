"use strict";
/**
 * Character Sheet Management Commands
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const character_manager_1 = require("../utils/character-manager");
const logger_1 = require("../utils/logger");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('sheet')
    .setDescription('Character sheet management commands')
    .addSubcommand(subcommand => subcommand
    .setName('create')
    .setDescription('Create a new character')
    .addStringOption(option => option
    .setName('name')
    .setDescription('Character name')
    .setRequired(true))
    .addStringOption(option => option
    .setName('concept')
    .setDescription('Character concept (e.g., "Noble Swordmaster", "Fremen Scout")')
    .setRequired(true))
    .addStringOption(option => option
    .setName('house')
    .setDescription('Great House or faction')
    .setRequired(false))
    .addStringOption(option => option
    .setName('homeworld')
    .setDescription('Character\'s homeworld')
    .setRequired(false)))
    .addSubcommand(subcommand => subcommand
    .setName('view')
    .setDescription('View a character sheet')
    .addUserOption(option => option
    .setName('user')
    .setDescription('User whose character to view (defaults to yourself)')
    .setRequired(false)))
    .addSubcommand(subcommand => subcommand
    .setName('edit')
    .setDescription('Edit your character')
    .addStringOption(option => option
    .setName('field')
    .setDescription('Field to edit')
    .setRequired(true)
    .addChoices({ name: 'Name', value: 'name' }, { name: 'Concept', value: 'concept' }, { name: 'House', value: 'house' }, { name: 'Homeworld', value: 'homeworld' }))
    .addStringOption(option => option
    .setName('value')
    .setDescription('New value')
    .setRequired(true)))
    .addSubcommand(subcommand => subcommand
    .setName('skill')
    .setDescription('Add or update a skill')
    .addStringOption(option => option
    .setName('name')
    .setDescription('Skill name')
    .setRequired(true)
    .addChoices({ name: 'Battle', value: 'Battle' }, { name: 'Command', value: 'Command' }, { name: 'Discipline', value: 'Discipline' }, { name: 'Drive', value: 'Drive' }, { name: 'Infiltrate', value: 'Infiltrate' }, { name: 'Investigate', value: 'Investigate' }, { name: 'Lore', value: 'Lore' }, { name: 'Medicine', value: 'Medicine' }, { name: 'Mentat', value: 'Mentat' }, { name: 'Persuade', value: 'Persuade' }, { name: 'Pilot', value: 'Pilot' }, { name: 'Spice', value: 'Spice' }, { name: 'Stealth', value: 'Stealth' }, { name: 'Survival', value: 'Survival' }, { name: 'Tech', value: 'Tech' }, { name: 'Understand', value: 'Understand' }))
    .addIntegerOption(option => option
    .setName('value')
    .setDescription('Skill value (0-5)')
    .setRequired(true)
    .setMinValue(0)
    .setMaxValue(5))
    .addStringOption(option => option
    .setName('focus')
    .setDescription('Skill focus (comma-separated if multiple)')
    .setRequired(false)))
    .addSubcommand(subcommand => subcommand
    .setName('drive')
    .setDescription('Add a drive to your character')
    .addStringOption(option => option
    .setName('name')
    .setDescription('Drive name (e.g., "Duty", "Faith", "Justice")')
    .setRequired(true))
    .addStringOption(option => option
    .setName('statement')
    .setDescription('Drive statement describing your motivation')
    .setRequired(true))
    .addIntegerOption(option => option
    .setName('value')
    .setDescription('Drive value (1-3)')
    .setRequired(true)
    .setMinValue(1)
    .setMaxValue(3)))
    .addSubcommand(subcommand => subcommand
    .setName('asset')
    .setDescription('Add an asset to your character')
    .addStringOption(option => option
    .setName('name')
    .setDescription('Asset name')
    .setRequired(true))
    .addStringOption(option => option
    .setName('type')
    .setDescription('Asset type')
    .setRequired(true)
    .addChoices({ name: 'Talent', value: 'talent' }, { name: 'Equipment', value: 'equipment' }, { name: 'Contact', value: 'contact' }, { name: 'Reputation', value: 'reputation' }))
    .addStringOption(option => option
    .setName('description')
    .setDescription('Asset description')
    .setRequired(true)))
    .addSubcommand(subcommand => subcommand
    .setName('determination')
    .setDescription('Update your determination')
    .addIntegerOption(option => option
    .setName('change')
    .setDescription('Change in determination (+/- value)')
    .setRequired(true)
    .setMinValue(-10)
    .setMaxValue(10)))
    .addSubcommand(subcommand => subcommand
    .setName('delete')
    .setDescription('Delete your character (cannot be undone!)'));
async function execute(interaction) {
    if (!interaction.guild || !interaction.member) {
        await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
        return;
    }
    const subcommand = interaction.options.getSubcommand();
    const member = interaction.member;
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
            case 'skill':
                await handleAddSkill(interaction, member);
                break;
            case 'drive':
                await handleAddDrive(interaction, member);
                break;
            case 'asset':
                await handleAddAsset(interaction, member);
                break;
            case 'determination':
                await handleUpdateDetermination(interaction, member);
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
    const name = interaction.options.getString('name');
    const concept = interaction.options.getString('concept');
    const house = interaction.options.getString('house');
    const homeworld = interaction.options.getString('homeworld');
    await interaction.deferReply({ ephemeral: true });
    try {
        const character = await character_manager_1.characterManager.createCharacter(member.id, interaction.guild.id, name, concept, { house, homeworld });
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0xD4AF37)
            .setTitle('🎭 Character Created!')
            .setDescription(`**${character.name}** has been created and is ready for adventure.`)
            .addFields({ name: '🎯 Concept', value: character.concept, inline: true }, { name: '🏛️ House', value: character.house || 'None', inline: true }, { name: '🌍 Homeworld', value: character.homeworld || 'Unknown', inline: true }, { name: '💪 Determination', value: `${character.determination}/${character.maxDetermination}`, inline: true }, { name: '📚 Next Steps', value: 'Use `/sheet skill` to set your skills and `/sheet drive` to add drives!', inline: false })
            .setFooter({ text: 'Use /sheet view to see your full character sheet' })
            .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
    }
    catch (error) {
        await interaction.editReply({ content: `Failed to create character: ${error}` });
    }
}
async function handleViewCharacter(interaction, member) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const targetMember = interaction.guild.members.cache.get(targetUser.id);
    if (!targetMember) {
        await interaction.reply({ content: 'User not found in this server.', ephemeral: true });
        return;
    }
    const character = character_manager_1.characterManager.getUserActiveCharacter(targetUser.id, interaction.guild.id);
    if (!character) {
        const message = targetUser.id === member.id
            ? 'You don\'t have a character yet. Use `/sheet create` to make one!'
            : `${targetUser.displayName} doesn't have a character in this server.`;
        await interaction.reply({ content: message, ephemeral: true });
        return;
    }
    const embed = createCharacterEmbed(character, targetMember);
    await interaction.reply({ embeds: [embed] });
}
async function handleEditCharacter(interaction, member) {
    const field = interaction.options.getString('field');
    const value = interaction.options.getString('value');
    const character = character_manager_1.characterManager.getUserActiveCharacter(member.id, interaction.guild.id);
    if (!character) {
        await interaction.reply({ content: 'You don\'t have a character yet. Use `/sheet create` to make one!', ephemeral: true });
        return;
    }
    await interaction.deferReply({ ephemeral: true });
    try {
        const updates = {};
        updates[field] = value;
        await character_manager_1.characterManager.updateCharacter(character.id, updates);
        await interaction.editReply({ content: `✅ Updated ${field} to "${value}"` });
    }
    catch (error) {
        await interaction.editReply({ content: `Failed to update character: ${error}` });
    }
}
async function handleAddSkill(interaction, member) {
    const skillName = interaction.options.getString('name');
    const skillValue = interaction.options.getInteger('value');
    const focusString = interaction.options.getString('focus');
    const character = character_manager_1.characterManager.getUserActiveCharacter(member.id, interaction.guild.id);
    if (!character) {
        await interaction.reply({ content: 'You don\'t have a character yet. Use `/sheet create` to make one!', ephemeral: true });
        return;
    }
    await interaction.deferReply({ ephemeral: true });
    try {
        const focus = focusString ? focusString.split(',').map(f => f.trim()) : undefined;
        await character_manager_1.characterManager.addSkill(character.id, skillName, skillValue, focus);
        const focusText = focus ? ` (Focus: ${focus.join(', ')})` : '';
        await interaction.editReply({ content: `✅ Set ${skillName} to ${skillValue}${focusText}` });
    }
    catch (error) {
        await interaction.editReply({ content: `Failed to add skill: ${error}` });
    }
}
async function handleAddDrive(interaction, member) {
    const driveName = interaction.options.getString('name');
    const driveStatement = interaction.options.getString('statement');
    const driveValue = interaction.options.getInteger('value');
    const character = character_manager_1.characterManager.getUserActiveCharacter(member.id, interaction.guild.id);
    if (!character) {
        await interaction.reply({ content: 'You don\'t have a character yet. Use `/sheet create` to make one!', ephemeral: true });
        return;
    }
    await interaction.deferReply({ ephemeral: true });
    try {
        await character_manager_1.characterManager.addDrive(character.id, driveName, driveStatement, driveValue);
        await interaction.editReply({
            content: `✅ Added drive: **${driveName}** (${driveValue})\n"${driveStatement}"`
        });
    }
    catch (error) {
        await interaction.editReply({ content: `Failed to add drive: ${error}` });
    }
}
async function handleAddAsset(interaction, member) {
    const assetName = interaction.options.getString('name');
    const assetType = interaction.options.getString('type');
    const assetDescription = interaction.options.getString('description');
    const character = character_manager_1.characterManager.getUserActiveCharacter(member.id, interaction.guild.id);
    if (!character) {
        await interaction.reply({ content: 'You don\'t have a character yet. Use `/sheet create` to make one!', ephemeral: true });
        return;
    }
    await interaction.deferReply({ ephemeral: true });
    try {
        const asset = {
            name: assetName,
            type: assetType,
            description: assetDescription
        };
        await character_manager_1.characterManager.addAsset(character.id, asset);
        await interaction.editReply({
            content: `✅ Added ${assetType}: **${assetName}**\n${assetDescription}`
        });
    }
    catch (error) {
        await interaction.editReply({ content: `Failed to add asset: ${error}` });
    }
}
async function handleUpdateDetermination(interaction, member) {
    const change = interaction.options.getInteger('change');
    const character = character_manager_1.characterManager.getUserActiveCharacter(member.id, interaction.guild.id);
    if (!character) {
        await interaction.reply({ content: 'You don\'t have a character yet. Use `/sheet create` to make one!', ephemeral: true });
        return;
    }
    await interaction.deferReply({ ephemeral: true });
    try {
        const updatedCharacter = await character_manager_1.characterManager.updateDetermination(character.id, change);
        const changeText = change > 0 ? `+${change}` : change.toString();
        await interaction.editReply({
            content: `✅ Determination ${changeText}: ${updatedCharacter.determination}/${updatedCharacter.maxDetermination}`
        });
    }
    catch (error) {
        await interaction.editReply({ content: `Failed to update determination: ${error}` });
    }
}
async function handleDeleteCharacter(interaction, member) {
    const character = character_manager_1.characterManager.getUserActiveCharacter(member.id, interaction.guild.id);
    if (!character) {
        await interaction.reply({ content: 'You don\'t have a character to delete.', ephemeral: true });
        return;
    }
    await interaction.deferReply({ ephemeral: true });
    try {
        await character_manager_1.characterManager.deleteCharacter(character.id, member.id);
        await interaction.editReply({
            content: `💀 Character **${character.name}** has been deleted. Farewell, ${character.concept}.`
        });
    }
    catch (error) {
        await interaction.editReply({ content: `Failed to delete character: ${error}` });
    }
}
function createCharacterEmbed(character, member) {
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(0xD4AF37)
        .setTitle(`🎭 ${character.name}`)
        .setDescription(`*${character.concept}*`)
        .setThumbnail(member.displayAvatarURL())
        .addFields({
        name: '🏛️ Background',
        value: `**House:** ${character.house || 'None'}\n**Homeworld:** ${character.homeworld || 'Unknown'}`,
        inline: true
    }, {
        name: '💪 Determination',
        value: `${character.determination}/${character.maxDetermination}`,
        inline: true
    }, {
        name: '📊 Experience',
        value: `Available: ${character.experience.available}\nTotal: ${character.experience.total}`,
        inline: true
    });
    // Attributes
    const attributes = Object.entries(character.attributes)
        .map(([name, value]) => `**${name.charAt(0).toUpperCase() + name.slice(1)}:** ${value}`)
        .join('\n');
    embed.addFields({ name: '⚡ Attributes', value: attributes, inline: true });
    // Skills (only non-zero)
    const skills = character.skills
        .filter(skill => skill.value > 0)
        .map(skill => {
        const focusText = skill.focus && skill.focus.length > 0 ? ` (${skill.focus.join(', ')})` : '';
        return `**${skill.name}:** ${skill.value}${focusText}`;
    })
        .join('\n');
    if (skills) {
        embed.addFields({ name: '🎯 Skills', value: skills, inline: true });
    }
    // Drives
    if (character.drives.length > 0) {
        const drives = character.drives
            .map(drive => `**${drive.name}** (${drive.value}): ${drive.statement}`)
            .join('\n');
        embed.addFields({ name: '🔥 Drives', value: drives, inline: false });
    }
    // Assets
    if (character.assets.length > 0) {
        const assets = character.assets
            .map(asset => `**${asset.name}** (${asset.type}): ${asset.description}`)
            .join('\n');
        embed.addFields({ name: '🎒 Assets', value: assets.length > 1024 ? assets.substring(0, 1020) + '...' : assets, inline: false });
    }
    // Traits
    if (character.traits.length > 0) {
        const traits = character.traits
            .map(trait => `**${trait.name}** (${trait.type}): ${trait.description}`)
            .join('\n');
        embed.addFields({ name: '✨ Traits', value: traits.length > 1024 ? traits.substring(0, 1020) + '...' : traits, inline: false });
    }
    embed.setFooter({ text: `Created: ${new Date(character.createdAt).toLocaleDateString()}` })
        .setTimestamp();
    return embed;
}
