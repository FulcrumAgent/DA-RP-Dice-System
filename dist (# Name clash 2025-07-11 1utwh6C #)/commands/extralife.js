"use strict";
/**
 * Extra-Life charity integration commands
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extraLifeCommands = void 0;
exports.handleExtraLifeCommand = handleExtraLifeCommand;
exports.handleExtraLifeHelpCommand = handleExtraLifeHelpCommand;
exports.startExtraLifeUpdates = startExtraLifeUpdates;
const discord_js_1 = require("discord.js");
const axios_1 = __importDefault(require("axios"));
const node_cron_1 = __importDefault(require("node-cron"));
const config_1 = require("../config");
const database_1 = require("../utils/database");
const logger_1 = require("../utils/logger");
const dataManager = new database_1.DataManager();
let announcementChannels = new Map();
let pinnedMessages = new Map();
exports.extraLifeCommands = [
    new discord_js_1.SlashCommandBuilder()
        .setName('extralife')
        .setDescription('Extra-Life charity integration commands')
        .addStringOption(option => option.setName('action')
        .setDescription('Action to perform')
        .setRequired(true)
        .addChoices({ name: 'Show Stats', value: 'stats' }, { name: 'Setup Channel', value: 'setup' }, { name: 'Post Announcement', value: 'announce' }, { name: 'Refresh Data', value: 'refresh' }))
        .addChannelOption(option => option.setName('channel')
        .setDescription('Channel for announcements (admin only)')
        .setRequired(false)),
    new discord_js_1.SlashCommandBuilder()
        .setName('extralife-help')
        .setDescription('Show Extra-Life integration help')
];
async function handleExtraLifeCommand(interaction) {
    try {
        const options = interaction.options;
        const action = options.get('action')?.value;
        const channel = options.get('channel')?.channel;
        switch (action) {
            case 'stats':
                await showStats(interaction);
                break;
            case 'setup':
                await setupAnnouncements(interaction, channel);
                break;
            case 'announce':
                await postAnnouncement(interaction);
                break;
            case 'refresh':
                await refreshStats(interaction);
                break;
            default:
                await interaction.reply({
                    content: '❌ Invalid action. Use: `stats`, `setup`, `announce`, or `refresh`',
                    ephemeral: true
                });
        }
    }
    catch (error) {
        logger_1.logger.error('Error in extralife command:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        if (!interaction.replied) {
            await interaction.reply({
                content: `❌ Error: ${errorMessage}`,
                ephemeral: true
            });
        }
    }
}
async function handleExtraLifeHelpCommand(interaction) {
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('🎮 Extra-Life Integration Help')
        .setDescription('Commands for charity event support')
        .setColor('#0099ff')
        .addFields({
        name: '📊 `/extralife action:stats`',
        value: 'Show current fundraising statistics',
        inline: false
    }, {
        name: '⚙️ `/extralife action:setup`',
        value: 'Setup announcement channel (admin only)',
        inline: false
    }, {
        name: '📢 `/extralife action:announce`',
        value: 'Post event announcement with current stats',
        inline: false
    }, {
        name: '🔄 `/extralife action:refresh`',
        value: 'Manually refresh statistics from API',
        inline: false
    }, {
        name: '🔧 Configuration',
        value: [
            'Set these in your `.env` file:',
            '• `EXTRALIFE_TEAM_ID`',
            '• `EXTRALIFE_PARTICIPANT_ID`',
            'Stats auto-update every 5 minutes'
        ].join('\n'),
        inline: false
    });
    await interaction.reply({ embeds: [embed], ephemeral: true });
}
async function showStats(interaction) {
    await interaction.deferReply();
    try {
        // Try to get cached data first
        let data = await dataManager.loadExtraLifeCache();
        if (!data) {
            data = await fetchExtraLifeData();
            if (data) {
                await dataManager.saveExtraLifeCache(data);
            }
        }
        if (!data) {
            await interaction.followUp({
                content: '❌ Unable to fetch Extra-Life data. Check configuration.',
                ephemeral: true
            });
            return;
        }
        const embed = createStatsEmbed(data);
        await interaction.followUp({ embeds: [embed] });
    }
    catch (error) {
        logger_1.logger.error('Error showing stats:', error);
        await interaction.followUp({
            content: `❌ Error fetching stats: ${error}`,
            ephemeral: true
        });
    }
}
async function setupAnnouncements(interaction, channel) {
    // Check permissions
    if (!interaction.memberPermissions?.has(discord_js_1.PermissionFlagsBits.Administrator)) {
        await interaction.reply({
            content: '❌ Administrator permissions required.',
            ephemeral: true
        });
        return;
    }
    const targetChannel = channel || interaction.channel;
    const guildId = interaction.guildId;
    announcementChannels.set(guildId, targetChannel);
    // Save to database
    const settings = await dataManager.loadBotSettings(guildId);
    settings.extraLifeChannelId = targetChannel.id;
    await dataManager.saveBotSettings(guildId, settings);
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('🎮 Extra-Life Setup Complete')
        .setDescription(`Announcements will be posted in ${targetChannel}`)
        .setColor('#00ff00');
    await interaction.reply({ embeds: [embed] });
}
async function postAnnouncement(interaction) {
    const guildId = interaction.guildId;
    let targetChannel = announcementChannels.get(guildId);
    if (!targetChannel) {
        // Try to load from database
        const settings = await dataManager.loadBotSettings(guildId);
        if (settings.extraLifeChannelId) {
            const channel = interaction.guild?.channels.cache.get(settings.extraLifeChannelId);
            if (channel) {
                targetChannel = channel;
                announcementChannels.set(guildId, channel);
            }
        }
    }
    if (!targetChannel) {
        await interaction.reply({
            content: '❌ No announcement channel set. Use `/extralife action:setup` first.',
            ephemeral: true
        });
        return;
    }
    await interaction.deferReply();
    try {
        const data = await fetchExtraLifeData();
        if (!data) {
            await interaction.followUp({
                content: '❌ Unable to fetch Extra-Life data.',
                ephemeral: true
            });
            return;
        }
        const embed = createAnnouncementEmbed(data);
        // Post to announcement channel
        const message = await targetChannel.send({ embeds: [embed] });
        // Try to pin the message
        try {
            await message.pin();
            pinnedMessages.set(guildId, message);
        }
        catch (error) {
            logger_1.logger.warn('Could not pin announcement message:', error);
        }
        await interaction.followUp({
            content: `✅ Announcement posted in ${targetChannel}`
        });
    }
    catch (error) {
        logger_1.logger.error('Error posting announcement:', error);
        await interaction.followUp({
            content: `❌ Error posting announcement: ${error}`,
            ephemeral: true
        });
    }
}
async function refreshStats(interaction) {
    await interaction.deferReply();
    try {
        const data = await fetchExtraLifeData();
        if (data) {
            await dataManager.saveExtraLifeCache(data);
            const embed = createStatsEmbed(data);
            await interaction.followUp({
                content: '✅ Stats refreshed!',
                embeds: [embed]
            });
        }
        else {
            await interaction.followUp({
                content: '❌ Unable to fetch fresh data.',
                ephemeral: true
            });
        }
    }
    catch (error) {
        logger_1.logger.error('Error refreshing stats:', error);
        await interaction.followUp({
            content: `❌ Error refreshing: ${error}`,
            ephemeral: true
        });
    }
}
async function fetchExtraLifeData() {
    if (!config_1.config.hasExtraLifeConfig) {
        logger_1.logger.warn('No Extra-Life configuration found');
        return null;
    }
    const data = {};
    try {
        // Fetch team data
        if (config_1.config.extraLifeTeamUrl) {
            const teamResponse = await axios_1.default.get(config_1.config.extraLifeTeamUrl, {
                timeout: 10000,
                headers: { 'User-Agent': 'Dune-Discord-Bot/1.0' }
            });
            if (teamResponse.status === 200) {
                data.team = teamResponse.data;
            }
        }
        // Fetch participant data
        if (config_1.config.extraLifeParticipantUrl) {
            const participantResponse = await axios_1.default.get(config_1.config.extraLifeParticipantUrl, {
                timeout: 10000,
                headers: { 'User-Agent': 'Dune-Discord-Bot/1.0' }
            });
            if (participantResponse.status === 200) {
                data.participant = participantResponse.data;
            }
        }
        return Object.keys(data).length > 0 ? data : null;
    }
    catch (error) {
        logger_1.logger.error('Error fetching Extra-Life data:', error);
        return null;
    }
}
function createStatsEmbed(data) {
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('🎮 Extra-Life Statistics')
        .setColor('#0099ff')
        .setTimestamp();
    // Team stats
    if (data.team) {
        const team = data.team;
        embed.addFields({
            name: '👥 Team Stats',
            value: [
                `**Name:** ${team.name || 'Unknown'}`,
                `**Goal:** $${(team.fundraisingGoal || 0).toLocaleString()}`,
                `**Raised:** $${(team.sumDonations || 0).toLocaleString()}`,
                `**Members:** ${team.numMembers || 0}`
            ].join('\n'),
            inline: true
        });
    }
    // Participant stats
    if (data.participant) {
        const participant = data.participant;
        embed.addFields({
            name: '🎯 Participant Stats',
            value: [
                `**Name:** ${participant.displayName || 'Unknown'}`,
                `**Goal:** $${(participant.fundraisingGoal || 0).toLocaleString()}`,
                `**Raised:** $${(participant.sumDonations || 0).toLocaleString()}`,
                `**Donors:** ${participant.numDonations || 0}`
            ].join('\n'),
            inline: true
        });
    }
    // Progress calculation
    if (data.team) {
        const team = data.team;
        const goal = team.fundraisingGoal || 1;
        const raised = team.sumDonations || 0;
        const progress = Math.min(100, (raised / goal) * 100);
        embed.addFields({
            name: '📊 Progress',
            value: `**${progress.toFixed(1)}%** of goal reached`,
            inline: false
        });
    }
    embed.setFooter({ text: 'Data from Extra-Life API • Updates every 5 minutes' });
    return embed;
}
function createAnnouncementEmbed(data) {
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('🎮 Extra-Life Charity Event!')
        .setDescription([
        'Join us in supporting Children\'s Miracle Network Hospitals!',
        'Every donation helps kids in our local hospitals.'
    ].join(' '))
        .setColor('#ffd700');
    if (data.team) {
        const team = data.team;
        embed.addFields({ name: '🎯 Our Goal', value: `$${(team.fundraisingGoal || 0).toLocaleString()}`, inline: true }, { name: '💰 Raised So Far', value: `$${(team.sumDonations || 0).toLocaleString()}`, inline: true }, { name: '👥 Team Members', value: `${team.numMembers || 0} heroes`, inline: true });
    }
    embed.addFields({
        name: '🎮 How to Help',
        value: [
            '• Donate directly to our team',
            '• Share our fundraising page',
            '• Join our gaming events',
            '• Spread the word!'
        ].join('\n'),
        inline: false
    });
    const teamId = config_1.config.getConfig().extraLifeTeamId;
    if (teamId) {
        const teamPage = `https://www.extra-life.org/team/${teamId}`;
        embed.addFields({
            name: '🔗 Donation Link',
            value: `[Visit Our Team Page](${teamPage})`,
            inline: false
        });
    }
    embed.setFooter({ text: 'Thank you for supporting children\'s hospitals! 💙' });
    return embed;
}
// Background task to update statistics
function startExtraLifeUpdates() {
    if (!config_1.config.hasExtraLifeConfig) {
        logger_1.logger.info('Extra-Life configuration not found, skipping background updates');
        return;
    }
    // Update every 5 minutes
    node_cron_1.default.schedule('*/5 * * * *', async () => {
        try {
            logger_1.logger.debug('Running Extra-Life background update');
            const data = await fetchExtraLifeData();
            if (data) {
                await dataManager.saveExtraLifeCache(data);
                // Update pinned messages
                for (const [guildId, message] of pinnedMessages) {
                    try {
                        const embed = createAnnouncementEmbed(data);
                        await message.edit({ embeds: [embed] });
                    }
                    catch (error) {
                        logger_1.logger.warn(`Failed to update pinned message for guild ${guildId}:`, error);
                        pinnedMessages.delete(guildId);
                    }
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Error in Extra-Life background update:', error);
        }
    });
    logger_1.logger.info('Extra-Life background updates started (every 5 minutes)');
}
