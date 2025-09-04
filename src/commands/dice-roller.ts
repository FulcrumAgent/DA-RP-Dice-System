/**
 * Universal dice roller commands supporting multiple RPG systems
 */

import { 
  SlashCommandBuilder, 
  CommandInteraction, 
  ChatInputCommandInteraction, 
  EmbedBuilder, 
  ColorResolvable,
  User 
} from 'discord.js';
import { DiceEngine, DiceParser, DiceSystem, DiceResult } from '../utils/dice-engines';
import { logger } from '../utils/logger';

export const diceRollerCommands = [
  // Standard dice rolling
  new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Roll standard dice (e.g., 3d6+2, 2d10)')
    .addStringOption(option =>
      option.setName('dice')
        .setDescription('Dice notation (e.g., 3d6, 2d10+5)')
        .setRequired(true)
    ),

  // Exploding dice rolling
  new SlashCommandBuilder()
    .setName('roll-exploding')
    .setDescription('Roll exploding dice (max results roll again)')
    .addStringOption(option =>
      option.setName('dice')
        .setDescription('Dice notation (e.g., 3d6, 2d10+5)')
        .setRequired(true)
    ),

  // World of Darkness dice rolling
  new SlashCommandBuilder()
    .setName('roll-wod')
    .setDescription('Roll World of Darkness dice pool')
    .addIntegerOption(option =>
      option.setName('pool')
        .setDescription('Number of d10s to roll')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(30)
    )
    .addIntegerOption(option =>
      option.setName('difficulty')
        .setDescription('Difficulty number (default: 6)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(10)
    )
    .addBooleanOption(option =>
      option.setName('specialty')
        .setDescription('Use specialty rules (10s count double)')
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('roll-help')
    .setDescription('Show help for dice rolling systems')
];

export async function handleRollCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  try {
    const commandName = interaction.commandName;
    let result: DiceResult;
    let diceNotation: string;
    let system: string;

    switch (commandName) {
      case 'roll': {
        // Standard dice rolling
        const dice = interaction.options.getString('dice', true);
        const { count, sides, modifier } = DiceParser.parseStandardNotation(dice);
        DiceParser.validateDiceParameters(count, sides);
        
        result = DiceEngine.standardRoll(count, sides, modifier);
        diceNotation = dice;
        system = 'standard';
        break;
      }
      
      case 'roll-exploding': {
        // Exploding dice rolling
        const dice = interaction.options.getString('dice', true);
        const { count, sides, modifier } = DiceParser.parseStandardNotation(dice);
        DiceParser.validateDiceParameters(count, sides);
        
        result = DiceEngine.explodingRoll(count, sides, modifier);
        diceNotation = dice;
        system = 'exploding';
        break;
      }
      
      case 'roll-wod': {
        // World of Darkness dice rolling
        const pool = interaction.options.getInteger('pool', true);
        const difficulty = interaction.options.getInteger('difficulty') || 6;
        const specialty = interaction.options.getBoolean('specialty') || false;
        
        if (difficulty < 1 || difficulty > 10) {
          await interaction.reply({ 
            content: '❌ WoD difficulty must be between 1 and 10.', 
            ephemeral: true 
          });
          return;
        }
        
        result = DiceEngine.worldOfDarknessRoll(pool, difficulty, specialty);
        diceNotation = `${pool}d10`;
        system = 'wod';
        break;
      }
      
      default:
        await interaction.reply({ 
          content: '❌ Unknown roll command.', 
          ephemeral: true 
        });
        return;
    }

    // Create response embed
    const embed = createDiceEmbed(result, diceNotation, system, interaction.user);
    await interaction.reply({ embeds: [embed] });

  } catch (error) {
    logger.error('Error in roll command:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    if (!interaction.replied) {
      await interaction.reply({ 
        content: `❌ Error: ${errorMessage}`, 
        ephemeral: true 
      });
    }
  }
}

export async function handleRollHelpCommand(interaction: CommandInteraction): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle('🎲 Dice Rolling Help')
    .setDescription('Available dice rolling commands and their usage:')
    .addFields(
      {
        name: '🎯 `/roll` - Standard Dice',
        value: `**Usage:** \`/roll dice:3d6+2\`\n**Description:** Basic dice rolling with modifiers\n**Examples:**\n• \`/roll dice:3d6\` - Roll 3 six-sided dice\n• \`/roll dice:2d10+5\` - Roll 2 ten-sided dice, add 5\n• \`/roll dice:1d20-2\` - Roll 1 twenty-sided die, subtract 2`,
        inline: false
      },
      {
        name: '💥 `/roll-exploding` - Exploding Dice',
        value: `**Usage:** \`/roll-exploding dice:4d6\`\n**Description:** When you roll the maximum value, roll again and add\n**Examples:**\n• \`/roll-exploding dice:4d6\` - Roll 4d6, any 6s explode\n• \`/roll-exploding dice:3d10+1\` - Roll 3d10+1, any 10s explode`,
        inline: false
      },
      {
        name: '🌙 `/roll-wod` - World of Darkness',
        value: `**Usage:** \`/roll-wod pool:8 difficulty:6\`\n**Description:** Roll a pool of d10s, count successes vs difficulty\n**Options:**\n• \`pool\` - Number of d10s to roll (required)\n• \`difficulty\` - Target number (default: 6)\n• \`specialty\` - 10s count as 2 successes\n**Examples:**\n• \`/roll-wod pool:8\` - Roll 8 dice vs difficulty 6\n• \`/roll-wod pool:5 difficulty:7 specialty:true\``,
        inline: false
      },
      {
        name: '📝 Dice Notation (for /roll and /roll-exploding)',
        value: `**Format:** \`[count]d[sides][+/-modifier]\`\n**Examples:**\n• \`d20\` = \`1d20\`\n• \`3d6+2\` - Add 2 to total\n• \`2d8-1\` - Subtract 1 from total`,
        inline: false
      }
    )
    .setFooter({ text: 'Each command only shows relevant options - no more confusion!' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

function createDiceEmbed(result: DiceResult, diceNotation: string, system: string, user: User): EmbedBuilder {
  // Color based on result quality
  let color: ColorResolvable = '#0099ff';
  
  if (result.system === DiceSystem.WORLD_OF_DARKNESS) {
    if (result.botch) {
      color = '#ff0000';
    } else if (result.successes >= 5) {
      color = '#ffd700';
    } else if (result.successes >= 3) {
      color = '#00ff00';
    } else if (result.successes > 0) {
      color = '#0099ff';
    } else {
      color = '#808080';
    }
  }

  const embed = new EmbedBuilder()
    .setTitle(`🎲 ${system.charAt(0).toUpperCase() + system.slice(1)} Dice Roll`)
    .setColor(color)
    .setTimestamp()
    .setAuthor({ 
      name: user.displayName || user.username, 
      iconURL: user.displayAvatarURL() 
    })
    .addFields(
      { name: 'Dice', value: `\`${diceNotation}\``, inline: true },
      { name: 'Rolls', value: formatRolls(result), inline: true }
    );

  // System-specific results
  if (result.system === DiceSystem.STANDARD) {
    embed.addFields({ name: 'Total', value: `**${result.total}**`, inline: true });
    
    if (result.details.modifier !== 0) {
      const mod = result.details.modifier as number;
      embed.addFields({ name: 'Modifier', value: `${mod > 0 ? '+' : ''}${mod}`, inline: true });
    }
  } else if (result.system === DiceSystem.EXPLODING) {
    embed.addFields({ name: 'Total', value: `**${result.total}**`, inline: true });
    
    if (result.explodedDice.length > 0) {
      embed.addFields({ name: 'Exploded', value: `${result.explodedDice.length} dice`, inline: true });
    }
  } else if (result.system === DiceSystem.WORLD_OF_DARKNESS) {
    embed.addFields(
      { name: 'Successes', value: `**${result.successes}**`, inline: true },
      { name: 'Difficulty', value: `${result.details.difficulty}`, inline: true }
    );

    let resultText: string;
    if (result.botch) {
      resultText = '💀 **BOTCH!**';
    } else if (result.successes >= 5) {
      resultText = '🌟 **Exceptional Success!**';
    } else if (result.successes >= 3) {
      resultText = '✅ **Great Success!**';
    } else if (result.successes > 0) {
      resultText = '✅ **Success**';
    } else {
      resultText = '❌ **Failure**';
    }
    
    embed.addFields({ name: 'Result', value: resultText, inline: false });

    if ((result.details.ones as number) > 0) {
      embed.addFields({ name: 'Ones', value: `${result.details.ones as number}`, inline: true });
    }
  }

  return embed;
}

function formatRolls(result: DiceResult): string {
  if (result.rolls.length <= 10) {
    // Show individual rolls
    const formattedRolls = result.rolls.map(roll => {
      if (result.system === DiceSystem.WORLD_OF_DARKNESS) {
        const difficulty = result.details.difficulty as number;
        if (roll >= difficulty) {
          return `**${roll}**`; // Success
        } else if (roll === 1) {
          return `~~${roll}~~`; // Botch
        } else {
          return roll.toString();
        }
      }
      return roll.toString();
    });
    
    return `[${formattedRolls.join(', ')}]`;
  } else {
    // Too many rolls, show summary
    return `[${result.rolls.length} dice rolled]`;
  }
}
