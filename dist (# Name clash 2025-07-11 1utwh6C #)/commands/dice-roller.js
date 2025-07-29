"use strict";
/**
 * Universal dice roller commands supporting multiple RPG systems
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.diceRollerCommands = void 0;
exports.handleRollCommand = handleRollCommand;
exports.handleRollHelpCommand = handleRollHelpCommand;
const discord_js_1 = require("discord.js");
const dice_engines_1 = require("../utils/dice-engines");
const logger_1 = require("../utils/logger");
exports.diceRollerCommands = [
    new discord_js_1.SlashCommandBuilder()
        .setName('roll')
        .setDescription('Roll dice using various RPG systems')
        .addStringOption(option => option.setName('dice')
        .setDescription('Dice notation (e.g., 3d6, 2d10+5)')
        .setRequired(true))
        .addStringOption(option => option.setName('system')
        .setDescription('Dice system to use')
        .setRequired(false)
        .addChoices({ name: 'Standard', value: 'standard' }, { name: 'Exploding', value: 'exploding' }, { name: 'World of Darkness', value: 'wod' }))
        .addIntegerOption(option => option.setName('difficulty')
        .setDescription('Difficulty for WoD system (1-10)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(10))
        .addBooleanOption(option => option.setName('specialty')
        .setDescription('Use specialty rules for WoD (10s count double)')
        .setRequired(false)),
    new discord_js_1.SlashCommandBuilder()
        .setName('roll-help')
        .setDescription('Show help for dice rolling systems')
];
async function handleRollCommand(interaction) {
    try {
        const options = interaction.options;
        const dice = options.get('dice')?.value;
        const system = options.get('system')?.value || 'standard';
        const difficulty = options.get('difficulty')?.value || 6;
        const specialty = options.get('specialty')?.value || false;
        // Parse dice notation
        const { count, sides, modifier } = dice_engines_1.DiceParser.parseStandardNotation(dice);
        dice_engines_1.DiceParser.validateDiceParameters(count, sides);
        // Roll based on system
        let result;
        switch (system) {
            case 'standard':
                result = dice_engines_1.DiceEngine.standardRoll(count, sides, modifier);
                break;
            case 'exploding':
                result = dice_engines_1.DiceEngine.explodingRoll(count, sides, modifier);
                break;
            case 'wod':
                if (difficulty < 1 || difficulty > 10) {
                    await interaction.reply({
                        content: '❌ WoD difficulty must be between 1 and 10.',
                        ephemeral: true
                    });
                    return;
                }
                result = dice_engines_1.DiceEngine.worldOfDarknessRoll(count, difficulty, specialty);
                break;
            default:
                await interaction.reply({
                    content: '❌ Invalid dice system.',
                    ephemeral: true
                });
                return;
        }
        // Create response embed
        const embed = createDiceEmbed(result, dice, system, interaction.user);
        await interaction.reply({ embeds: [embed] });
    }
    catch (error) {
        logger_1.logger.error('Error in roll command:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        if (!interaction.replied) {
            await interaction.reply({
                content: `❌ Error: ${errorMessage}`,
                ephemeral: true
            });
        }
    }
}
async function handleRollHelpCommand(interaction) {
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('🎲 Dice Rolling Help')
        .setDescription('Comprehensive guide to using the dice roller')
        .setColor('#0099ff')
        .addFields({
        name: '📝 Dice Notation',
        value: [
            '`3d6` - Roll 3 six-sided dice',
            '`2d10+5` - Roll 2d10, add 5',
            '`1d20-2` - Roll 1d20, subtract 2',
            '`d6` - Roll 1 six-sided die'
        ].join('\n'),
        inline: false
    }, {
        name: '🎯 Standard System',
        value: [
            'Basic dice rolling with modifiers',
            '**Example:** `/roll dice:3d6+2 system:standard`',
            'Shows total of all dice plus modifier'
        ].join('\n'),
        inline: false
    }, {
        name: '💥 Exploding System',
        value: [
            'Dice explode on maximum roll',
            '**Example:** `/roll dice:3d6 system:exploding`',
            'Reroll and add when you roll max value'
        ].join('\n'),
        inline: false
    }, {
        name: '🌙 World of Darkness',
        value: [
            'Count successes vs difficulty',
            '**Example:** `/roll dice:5d10 system:wod difficulty:7`',
            'Rolls ≥ difficulty = success, 1s may cause botch',
            'Use `specialty:true` for 10s counting double'
        ].join('\n'),
        inline: false
    })
        .setFooter({ text: 'For Dune 2d20 system, use /dune-roll command' });
    await interaction.reply({ embeds: [embed], ephemeral: true });
}
function createDiceEmbed(result, diceNotation, system, user) {
    // Color based on result quality
    let color = '#0099ff';
    if (result.system === dice_engines_1.DiceSystem.WORLD_OF_DARKNESS) {
        if (result.botch) {
            color = '#ff0000';
        }
        else if (result.successes >= 5) {
            color = '#ffd700';
        }
        else if (result.successes >= 3) {
            color = '#00ff00';
        }
        else if (result.successes > 0) {
            color = '#0099ff';
        }
        else {
            color = '#808080';
        }
    }
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle(`🎲 ${system.charAt(0).toUpperCase() + system.slice(1)} Dice Roll`)
        .setColor(color)
        .setTimestamp()
        .setAuthor({
        name: user.displayName || user.username,
        iconURL: user.displayAvatarURL()
    })
        .addFields({ name: 'Dice', value: `\`${diceNotation}\``, inline: true }, { name: 'Rolls', value: formatRolls(result), inline: true });
    // System-specific results
    if (result.system === dice_engines_1.DiceSystem.STANDARD) {
        embed.addFields({ name: 'Total', value: `**${result.total}**`, inline: true });
        if (result.details.modifier !== 0) {
            const mod = result.details.modifier;
            embed.addFields({ name: 'Modifier', value: `${mod > 0 ? '+' : ''}${mod}`, inline: true });
        }
    }
    else if (result.system === dice_engines_1.DiceSystem.EXPLODING) {
        embed.addFields({ name: 'Total', value: `**${result.total}**`, inline: true });
        if (result.explodedDice.length > 0) {
            embed.addFields({ name: 'Exploded', value: `${result.explodedDice.length} dice`, inline: true });
        }
    }
    else if (result.system === dice_engines_1.DiceSystem.WORLD_OF_DARKNESS) {
        embed.addFields({ name: 'Successes', value: `**${result.successes}**`, inline: true }, { name: 'Difficulty', value: `${result.details.difficulty}`, inline: true });
        let resultText;
        if (result.botch) {
            resultText = '💀 **BOTCH!**';
        }
        else if (result.successes >= 5) {
            resultText = '🌟 **Exceptional Success!**';
        }
        else if (result.successes >= 3) {
            resultText = '✅ **Great Success!**';
        }
        else if (result.successes > 0) {
            resultText = '✅ **Success**';
        }
        else {
            resultText = '❌ **Failure**';
        }
        embed.addFields({ name: 'Result', value: resultText, inline: false });
        if (result.details.ones > 0) {
            embed.addFields({ name: 'Ones', value: `${result.details.ones}`, inline: true });
        }
    }
    return embed;
}
function formatRolls(result) {
    if (result.rolls.length <= 10) {
        // Show individual rolls
        const formattedRolls = result.rolls.map(roll => {
            if (result.system === dice_engines_1.DiceSystem.WORLD_OF_DARKNESS) {
                const difficulty = result.details.difficulty;
                if (roll >= difficulty) {
                    return `**${roll}**`; // Success
                }
                else if (roll === 1) {
                    return `~~${roll}~~`; // Botch
                }
                else {
                    return roll.toString();
                }
            }
            return roll.toString();
        });
        return `[${formattedRolls.join(', ')}]`;
    }
    else {
        // Too many rolls, show summary
        return `[${result.rolls.length} dice rolled]`;
    }
}
