"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.duneSystemCommands = void 0;
exports.handleDuneRollCommand = handleDuneRollCommand;
exports.handleMomentumCommand = handleMomentumCommand;
exports.handleDuneHelpCommand = handleDuneHelpCommand;
exports.handleDuneMomentumButton = handleDuneMomentumButton;
const discord_js_1 = require("discord.js");
const dice_engines_1 = require("../utils/dice-engines");
const database_1 = require("../utils/database");
const logger_1 = require("../utils/logger");
const dataManager = new database_1.DataManager();
exports.duneSystemCommands = [
    new discord_js_1.SlashCommandBuilder()
        .setName('dune-roll')
        .setDescription('Roll dice using Dune 2d20 system')
        .addStringOption(option => option.setName('skill')
        .setDescription('Skill name (e.g., Battle, Communicate)')
        .setRequired(true))
        .addStringOption(option => option.setName('drive')
        .setDescription('Drive name (e.g., Justice, Faith, Duty)')
        .setRequired(true))
        .addIntegerOption(option => option.setName('target')
        .setDescription('Target number for the roll')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(20))
        .addIntegerOption(option => option.setName('bonus')
        .setDescription('Bonus dice from momentum/assets')
        .setRequired(false)
        .setMinValue(0)
        .setMaxValue(5))
        .addStringOption(option => option.setName('description')
        .setDescription('Description of the action')
        .setRequired(false)),
    new discord_js_1.SlashCommandBuilder()
        .setName('momentum')
        .setDescription('Manage momentum and threat pools')
        .addStringOption(option => option.setName('action')
        .setDescription('Action to perform')
        .setRequired(false)
        .addChoices({ name: 'Show', value: 'show' }, { name: 'Reset', value: 'reset' })),
    new discord_js_1.SlashCommandBuilder()
        .setName('dune-help')
        .setDescription('Show help for Dune 2d20 system')
];
async function handleDuneRollCommand(interaction) {
    try {
        const options = interaction.options;
        const skill = options.get('skill')?.value;
        const drive = options.get('drive')?.value;
        const target = options.get('target')?.value;
        const bonus = options.get('bonus')?.value || 0;
        const description = options.get('description')?.value;
        if (target < 1 || target > 20) {
            await interaction.reply({
                content: '❌ Target must be between 1 and 20.',
                ephemeral: true
            });
            return;
        }
        if (bonus < 0 || bonus > 5) {
            await interaction.reply({
                content: '❌ Bonus dice must be between 0 and 5.',
                ephemeral: true
            });
            return;
        }
        const result = dice_engines_1.DiceEngine.dune2d20Roll(target, bonus);
        const guildId = interaction.guildId || '0';
        const channelId = interaction.channelId;
        const momentumPool = await dataManager.getMomentumPool(guildId, channelId);
        const embed = createDuneEmbed(result, skill, drive, target, bonus, description, interaction.user);
        embed.addFields({
            name: '💫 Current Pools',
            value: `Momentum: ${momentumPool.momentum} | Threat: ${momentumPool.threat}`,
            inline: false
        });
        let components = [];
        if (result.successes > 0 || result.complications > 0) {
            const row = new discord_js_1.ActionRowBuilder();
            if (result.successes > 1) {
                row.addComponents(new discord_js_1.ButtonBuilder()
                    .setCustomId(`generate_momentum_${guildId}_${channelId}_${result.successes - 1}`)
                    .setLabel('Generate Momentum')
                    .setStyle(discord_js_1.ButtonStyle.Success)
                    .setEmoji('✨'));
            }
            if (momentumPool.momentum > 0) {
                row.addComponents(new discord_js_1.ButtonBuilder()
                    .setCustomId(`spend_momentum_${guildId}_${channelId}`)
                    .setLabel('Spend Momentum')
                    .setStyle(discord_js_1.ButtonStyle.Primary)
                    .setEmoji('💫'));
            }
            if (result.complications > 0) {
                row.addComponents(new discord_js_1.ButtonBuilder()
                    .setCustomId(`add_threat_${guildId}_${channelId}_${result.complications}`)
                    .setLabel('Add Threat')
                    .setStyle(discord_js_1.ButtonStyle.Danger)
                    .setEmoji('⚠️'));
            }
            if (row.components.length > 0) {
                components = [row];
            }
        }
        await interaction.reply({
            embeds: [embed],
            components
        });
    }
    catch (error) {
        logger_1.logger.error('Error in dune-roll command:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        if (!interaction.replied) {
            await interaction.reply({
                content: `❌ Error: ${errorMessage}`,
                ephemeral: true
            });
        }
    }
}
async function handleMomentumCommand(interaction) {
    try {
        const options = interaction.options;
        const action = options.get('action')?.value || 'show';
        const guildId = interaction.guildId || '0';
        const channelId = interaction.channelId;
        if (action === 'show') {
            const pool = await dataManager.getMomentumPool(guildId, channelId);
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle('💫 Momentum & Threat Pools')
                .setColor('#0099ff')
                .addFields({ name: 'Momentum', value: `**${pool.momentum}**`, inline: true }, { name: 'Threat', value: `**${pool.threat}**`, inline: true })
                .setFooter({ text: `Last updated: ${new Date(pool.lastUpdated).toLocaleString()}` });
            await interaction.reply({ embeds: [embed] });
        }
        else if (action === 'reset') {
            await dataManager.resetMomentumPool(guildId, channelId);
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle('💫 Pools Reset')
                .setDescription('Momentum and Threat pools have been reset to 0.')
                .setColor('#00ff00');
            await interaction.reply({ embeds: [embed] });
        }
        else {
            await interaction.reply({
                content: "❌ Invalid action. Use 'show' or 'reset'.",
                ephemeral: true
            });
        }
    }
    catch (error) {
        logger_1.logger.error('Error in momentum command:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        if (!interaction.replied) {
            await interaction.reply({
                content: `❌ Error: ${errorMessage}`,
                ephemeral: true
            });
        }
    }
}
async function handleDuneHelpCommand(interaction) {
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('⚔️ Dune 2d20 System Help')
        .setDescription('Guide to using the Dune: Adventures in the Imperium system')
        .setColor('#ff8c00')
        .addFields({
        name: '🎲 Basic Roll',
        value: [
            '`/dune-roll skill:Battle drive:Justice target:12`',
            'Rolls 2d20, counts successes (≤ target)',
            '20s are complications, 2+ successes = critical'
        ].join('\n'),
        inline: false
    }, {
        name: '➕ Bonus Dice',
        value: [
            '`/dune-roll skill:Move drive:Duty target:10 bonus:2`',
            'Adds extra d20s, uses best 2 results',
            'Spend momentum or use assets for bonus dice'
        ].join('\n'),
        inline: false
    }, {
        name: '💫 Momentum & Threat',
        value: [
            'Momentum: Player resource pool',
            'Threat: GM resource pool',
            'Use `/momentum show` to check current pools',
            'Use buttons after rolls to adjust pools'
        ].join('\n'),
        inline: false
    }, {
        name: '📊 Success Levels',
        value: [
            '**0 successes:** Failure',
            '**1 success:** Success',
            '**2+ successes:** Critical Success',
            '**20s:** Complications (GM gains Threat)'
        ].join('\n'),
        inline: false
    });
    await interaction.reply({ embeds: [embed], ephemeral: true });
}
async function handleDuneMomentumButton(interaction) {
    try {
        const [action, guildId, channelId, amount] = interaction.customId.split('_').slice(1);
        if (!action || !guildId || !channelId) {
            await interaction.reply({ content: '❌ Invalid button interaction.', ephemeral: true });
            return;
        }
        let embed;
        let pool;
        switch (action) {
            case 'spend':
                if (action === 'spend' && interaction.customId.includes('momentum')) {
                    pool = await dataManager.updateMomentum(guildId, channelId, -1, 0);
                    embed = new discord_js_1.EmbedBuilder()
                        .setTitle('💫 Momentum Spent')
                        .setDescription('1 Momentum spent for additional effect')
                        .setColor('#0099ff')
                        .addFields({ name: 'Current Momentum', value: `${pool.momentum}`, inline: true }, { name: 'Current Threat', value: `${pool.threat}`, inline: true });
                }
                break;
            case 'add':
                if (action === 'add' && interaction.customId.includes('threat')) {
                    const threatToAdd = parseInt(amount || '1', 10);
                    pool = await dataManager.updateMomentum(guildId, channelId, 0, threatToAdd);
                    embed = new discord_js_1.EmbedBuilder()
                        .setTitle('⚠️ Threat Added')
                        .setDescription(`${threatToAdd} Threat added from complications`)
                        .setColor('#ff0000')
                        .addFields({ name: 'Current Momentum', value: `${pool.momentum}`, inline: true }, { name: 'Current Threat', value: `${pool.threat}`, inline: true });
                }
                break;
            case 'generate':
                if (action === 'generate' && interaction.customId.includes('momentum')) {
                    const momentumToAdd = parseInt(amount || '1', 10);
                    pool = await dataManager.updateMomentum(guildId, channelId, momentumToAdd, 0);
                    embed = new discord_js_1.EmbedBuilder()
                        .setTitle('✨ Momentum Generated')
                        .setDescription(`${momentumToAdd} Momentum generated from excess successes`)
                        .setColor('#00ff00')
                        .addFields({ name: 'Current Momentum', value: `${pool.momentum}`, inline: true }, { name: 'Current Threat', value: `${pool.threat}`, inline: true });
                }
                break;
            default:
                await interaction.reply({ content: '❌ Unknown button action.', ephemeral: true });
                return;
        }
        if (embed) {
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
        else {
            await interaction.reply({ content: '❌ Failed to process button action.', ephemeral: true });
        }
    }
    catch (error) {
        logger_1.logger.error('Error in momentum button handler:', error);
        await interaction.reply({ content: '❌ Error processing button action.', ephemeral: true });
    }
}
function createDuneEmbed(result, skill, drive, target, bonus, description, user) {
    let color;
    if (result.successes >= 2) {
        color = '#ffd700';
    }
    else if (result.successes === 1) {
        color = '#00ff00';
    }
    else {
        color = '#ff0000';
    }
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('⚔️ Dune 2d20 Roll')
        .setColor(color)
        .setTimestamp()
        .setAuthor({
        name: user.displayName || user.username,
        iconURL: user.displayAvatarURL()
    });
    if (description) {
        embed.setDescription(`*${description}*`);
    }
    embed.addFields({ name: '🎯 Skill + Drive', value: `${skill} + ${drive}`, inline: true }, { name: '🎲 Target', value: `${target}`, inline: true }, { name: '➕ Bonus Dice', value: `${bonus}`, inline: true });
    const rollsDisplay = formatDuneRolls(result, target);
    embed.addFields({ name: '🎲 Rolls', value: rollsDisplay, inline: false });
    const successText = getSuccessText(result.successes);
    embed.addFields({ name: '📊 Result', value: successText, inline: true });
    if (result.complications > 0) {
        const complicationText = `⚠️ ${result.complications} Complication${result.complications > 1 ? 's' : ''}`;
        embed.addFields({ name: '⚠️ Complications', value: complicationText, inline: true });
    }
    return embed;
}
function formatDuneRolls(result, target) {
    const formattedRolls = [];
    if (result.details.bonusDice > 0) {
        const allRolls = result.rolls;
        for (let i = 0; i < allRolls.length; i++) {
            const roll = allRolls[i];
            const isMainRoll = i < 2;
            if (isMainRoll) {
                if (roll <= target) {
                    formattedRolls.push(`**${roll}**✅`);
                }
                else if (roll === 20) {
                    formattedRolls.push(`**${roll}**⚠️`);
                }
                else {
                    formattedRolls.push(`**${roll}**`);
                }
            }
            else {
                if (roll <= target) {
                    formattedRolls.push(`~~${roll}~~✅`);
                }
                else if (roll === 20) {
                    formattedRolls.push(`~~${roll}~~⚠️`);
                }
                else {
                    formattedRolls.push(`~~${roll}~~`);
                }
            }
        }
    }
    else {
        for (const roll of result.rolls) {
            if (roll <= target) {
                formattedRolls.push(`**${roll}**✅`);
            }
            else if (roll === 20) {
                formattedRolls.push(`**${roll}**⚠️`);
            }
            else {
                formattedRolls.push(`**${roll}**`);
            }
        }
    }
    return `[${formattedRolls.join(', ')}]`;
}
function getSuccessText(successes) {
    if (successes >= 2) {
        return `🌟 **Critical Success!** (${successes} successes)`;
    }
    else if (successes === 1) {
        return `✅ **Success!** (${successes} success)`;
    }
    else {
        return '❌ **Failure** (0 successes)';
    }
}
