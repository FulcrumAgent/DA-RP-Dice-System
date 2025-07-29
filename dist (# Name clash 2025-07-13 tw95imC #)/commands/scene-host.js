"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const scene_manager_1 = require("../utils/scene-manager");
const logger_1 = require("../utils/logger");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('scene')
    .setDescription('Scene hosting and management commands')
    .addSubcommand(subcommand => subcommand
    .setName('host')
    .setDescription('Start hosting a new scene')
    .addStringOption(option => option
    .setName('title')
    .setDescription('Title of the scene')
    .setRequired(true))
    .addStringOption(option => option
    .setName('description')
    .setDescription('Brief description of the scene')
    .setRequired(false))
    .addUserOption(option => option
    .setName('participant1')
    .setDescription('First participant to invite')
    .setRequired(false))
    .addUserOption(option => option
    .setName('participant2')
    .setDescription('Second participant to invite')
    .setRequired(false))
    .addUserOption(option => option
    .setName('participant3')
    .setDescription('Third participant to invite')
    .setRequired(false))
    .addUserOption(option => option
    .setName('participant4')
    .setDescription('Fourth participant to invite')
    .setRequired(false)))
    .addSubcommand(subcommand => subcommand
    .setName('end')
    .setDescription('End the current scene (host only)')
    .addStringOption(option => option
    .setName('summary')
    .setDescription('Brief summary of what happened in the scene')
    .setRequired(false)))
    .addSubcommand(subcommand => subcommand
    .setName('pass')
    .setDescription('Pass hosting duties to another participant')
    .addUserOption(option => option
    .setName('newhost')
    .setDescription('User to transfer hosting duties to')
    .setRequired(true)))
    .addSubcommand(subcommand => subcommand
    .setName('join')
    .setDescription('Join the current scene as a participant'))
    .addSubcommand(subcommand => subcommand
    .setName('status')
    .setDescription('Show current scene status and resources'))
    .addSubcommand(subcommand => subcommand
    .setName('list')
    .setDescription('List all active scenes in this server'))
    .addSubcommand(subcommand => subcommand
    .setName('resources')
    .setDescription('Update scene resources (host only)')
    .addIntegerOption(option => option
    .setName('momentum')
    .setDescription('Set momentum value')
    .setRequired(false))
    .addIntegerOption(option => option
    .setName('threat')
    .setDescription('Set threat value')
    .setRequired(false)));
async function execute(interaction) {
    if (!interaction.guild || !interaction.member) {
        await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
        return;
    }
    const subcommand = interaction.options.getSubcommand();
    const member = interaction.member;
    try {
        switch (subcommand) {
            case 'host':
                await handleHostScene(interaction, member);
                break;
            case 'end':
                await handleEndScene(interaction, member);
                break;
            case 'pass':
                await handlePassHost(interaction, member);
                break;
            case 'join':
                await handleJoinScene(interaction, member);
                break;
            case 'status':
                await handleSceneStatus(interaction);
                break;
            case 'list':
                await handleListScenes(interaction);
                break;
            case 'resources':
                await handleUpdateResources(interaction, member);
                break;
            default:
                await interaction.reply({ content: 'Unknown subcommand.', ephemeral: true });
        }
    }
    catch (error) {
        logger_1.logger.error('Scene command error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: `❌ ${errorMessage}`, ephemeral: true });
        }
        else {
            await interaction.reply({ content: `❌ ${errorMessage}`, ephemeral: true });
        }
    }
}
async function handleHostScene(interaction, member) {
    const title = interaction.options.getString('title');
    const description = interaction.options.getString('description');
    const participants = [];
    for (let i = 1; i <= 4; i++) {
        const participant = interaction.options.getMember(`participant${i}`);
        if (participant) {
            participants.push(participant);
        }
    }
    const channel = interaction.channel;
    if (!channel || !channel.isTextBased() || channel.isDMBased()) {
        await interaction.reply({ content: 'Scenes can only be hosted in text channels.', ephemeral: true });
        return;
    }
    if (!channel.permissionsFor(interaction.guild.members.me)?.has(discord_js_1.PermissionFlagsBits.CreatePublicThreads)) {
        await interaction.reply({
            content: 'I need permission to create threads in this channel.',
            ephemeral: true
        });
        return;
    }
    await interaction.deferReply();
    try {
        const { scene, thread } = await scene_manager_1.sceneManager.createScene(channel, member, title, description, participants);
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0xD4AF37)
            .setTitle('🎭 Scene Created!')
            .setDescription(`**${scene.title}** has been created and is ready for play.`)
            .addFields({ name: '🧵 Thread', value: `<#${thread.id}>`, inline: true }, { name: '🎪 Host', value: `<@${member.id}>`, inline: true }, { name: '👥 Participants', value: participants.length > 0 ? participants.map(p => `<@${p.id}>`).join(' ') : 'None yet', inline: true })
            .setFooter({ text: 'Head to the thread to begin the scene!' })
            .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
    }
    catch (error) {
        await interaction.editReply({ content: `Failed to create scene: ${error}` });
    }
}
async function handleEndScene(interaction, member) {
    const summary = interaction.options.getString('summary');
    if (!interaction.channel?.isThread()) {
        await interaction.reply({ content: 'This command can only be used in a scene thread.', ephemeral: true });
        return;
    }
    await interaction.deferReply();
    try {
        const scene = await scene_manager_1.sceneManager.endScene(interaction.channel.id, member.id, summary);
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0x8B4513)
            .setTitle('🎬 Scene Ended')
            .setDescription(`**${scene.title}** has been completed.`)
            .addFields({ name: '📝 Summary', value: summary || 'No summary provided.', inline: false }, { name: '⚡ Final Resources', value: `Momentum: ${scene.resources.momentum}\nThreat: ${scene.resources.threat}`, inline: true }, { name: '⏱️ Duration', value: `Started: <t:${Math.floor(new Date(scene.createdAt).getTime() / 1000)}:R>`, inline: true })
            .setFooter({ text: 'Thank you for playing!' })
            .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
        setTimeout(async () => {
            try {
                if (interaction.channel && interaction.channel.isThread()) {
                    await interaction.channel.edit({ locked: true, archived: true });
                }
            }
            catch (error) {
                logger_1.logger.error('Failed to lock thread:', error);
            }
        }, 30000);
    }
    catch (error) {
        await interaction.editReply({ content: `Failed to end scene: ${error}` });
    }
}
async function handlePassHost(interaction, member) {
    const newHost = interaction.options.getMember('newhost');
    if (!interaction.channel?.isThread()) {
        await interaction.reply({ content: 'This command can only be used in a scene thread.', ephemeral: true });
        return;
    }
    await interaction.deferReply();
    try {
        const scene = await scene_manager_1.sceneManager.transferHost(interaction.channel.id, member.id, newHost.id);
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('🎪 Host Transfer')
            .setDescription(`Hosting duties for **${scene.title}** have been transferred.`)
            .addFields({ name: '👤 Previous Host', value: `<@${member.id}>`, inline: true }, { name: '🎭 New Host', value: `<@${newHost.id}>`, inline: true })
            .setFooter({ text: 'The scene continues under new leadership!' })
            .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
    }
    catch (error) {
        await interaction.editReply({ content: `Failed to transfer host: ${error}` });
    }
}
async function handleJoinScene(interaction, member) {
    if (!interaction.channel?.isThread()) {
        await interaction.reply({ content: 'This command can only be used in a scene thread.', ephemeral: true });
        return;
    }
    await interaction.deferReply({ ephemeral: true });
    try {
        const scene = await scene_manager_1.sceneManager.addParticipant(interaction.channel.id, member.id);
        await interaction.editReply({ content: `✅ You've joined **${scene.title}**! Welcome to the scene.` });
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0x90EE90)
            .setDescription(`🎭 <@${member.id}> has joined the scene!`)
            .setTimestamp();
        await interaction.channel.send({ embeds: [embed] });
    }
    catch (error) {
        await interaction.editReply({ content: `Failed to join scene: ${error}` });
    }
}
async function handleSceneStatus(interaction) {
    if (!interaction.channel?.isThread()) {
        await interaction.reply({ content: 'This command can only be used in a scene thread.', ephemeral: true });
        return;
    }
    const scene = scene_manager_1.sceneManager.getSceneByThread(interaction.channel.id);
    if (!scene) {
        await interaction.reply({ content: 'Scene data not found.', ephemeral: true });
        return;
    }
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(0x4169E1)
        .setTitle(`🎭 ${scene.title}`)
        .setDescription(scene.description || 'No description provided.')
        .addFields({ name: '🎪 Host', value: `<@${scene.hostId}>`, inline: true }, { name: '📊 Status', value: scene.status.charAt(0).toUpperCase() + scene.status.slice(1), inline: true }, { name: '👥 Participants', value: scene.participants.map(id => `<@${id}>`).join('\n') || 'None', inline: true }, { name: '⚡ Momentum', value: scene.resources.momentum.toString(), inline: true }, { name: '🔥 Threat', value: scene.resources.threat.toString(), inline: true }, { name: '💪 Determination', value: Object.entries(scene.resources.determination).map(([id, det]) => `<@${id}>: ${det}`).join('\n') || 'None', inline: true })
        .setFooter({ text: `Created: ${new Date(scene.createdAt).toLocaleDateString()}` })
        .setTimestamp();
    await interaction.reply({ embeds: [embed] });
}
async function handleListScenes(interaction) {
    const activeScenes = scene_manager_1.sceneManager.getActiveScenes(interaction.guild.id);
    if (activeScenes.length === 0) {
        await interaction.reply({ content: 'No active scenes in this server.', ephemeral: true });
        return;
    }
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(0x9370DB)
        .setTitle('🎭 Active Scenes')
        .setDescription(`Found ${activeScenes.length} active scene(s):`)
        .setTimestamp();
    activeScenes.forEach((scene, index) => {
        embed.addFields({
            name: `${index + 1}. ${scene.title}`,
            value: `Host: <@${scene.hostId}>\nThread: <#${scene.threadId}>\nParticipants: ${scene.participants.length}`,
            inline: true
        });
    });
    await interaction.reply({ embeds: [embed] });
}
async function handleUpdateResources(interaction, member) {
    if (!interaction.channel?.isThread()) {
        await interaction.reply({ content: 'This command can only be used in a scene thread.', ephemeral: true });
        return;
    }
    const scene = scene_manager_1.sceneManager.getSceneByThread(interaction.channel.id);
    if (!scene) {
        await interaction.reply({ content: 'Scene data not found.', ephemeral: true });
        return;
    }
    if (scene.hostId !== member.id) {
        await interaction.reply({ content: 'Only the scene host can update resources.', ephemeral: true });
        return;
    }
    const momentum = interaction.options.getInteger('momentum');
    const threat = interaction.options.getInteger('threat');
    if (momentum === null && threat === null) {
        await interaction.reply({ content: 'Please specify at least one resource to update.', ephemeral: true });
        return;
    }
    await interaction.deferReply();
    try {
        const updates = {};
        if (momentum !== null)
            updates.momentum = momentum;
        if (threat !== null)
            updates.threat = threat;
        const updatedScene = await scene_manager_1.sceneManager.updateResources(interaction.channel.id, updates);
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0xFF6347)
            .setTitle('⚡ Resources Updated')
            .addFields({ name: 'Momentum', value: updatedScene.resources.momentum.toString(), inline: true }, { name: 'Threat', value: updatedScene.resources.threat.toString(), inline: true })
            .setFooter({ text: `Updated by ${member.displayName}` })
            .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
    }
    catch (error) {
        await interaction.editReply({ content: `Failed to update resources: ${error}` });
    }
}
