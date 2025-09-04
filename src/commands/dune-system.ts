/**
 * Dune 2d20 system commands with momentum and threat tracking
 */

import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  MessageFlags,
  AutocompleteInteraction,
  CommandInteraction,
  ButtonInteraction,
  User,
  ColorResolvable
} from 'discord.js';
import { DiceEngine, DiceResult } from '../utils/dice-engines';
import { DataManager } from '../utils/database';
import { prismaCharacterManager } from '../utils/prisma-character-manager';
import { SceneManager } from '../utils/scene-manager';
import { logger } from '../utils/logger';

const dataManager = new DataManager();
const sceneManager = new SceneManager();

export const duneSystemCommands = [
  new SlashCommandBuilder()
    .setName('dune-roll')
    .setDescription('Roll dice using Dune 2d20 system with character integration')
    .addStringOption(option =>
      option.setName('skill')
        .setDescription('What type of action are you attempting?')
        .setRequired(true)
        .addChoices(
          { name: 'Battle - Physical combat and warfare', value: 'Battle' },
          { name: 'Communicate - Social interaction and persuasion', value: 'Communicate' },
          { name: 'Discipline - Mental fortitude and focus', value: 'Discipline' },
          { name: 'Move - Physical agility and stealth', value: 'Move' },
          { name: 'Understand - Knowledge and investigation', value: 'Understand' }
        )
    )
    .addStringOption(option =>
      option.setName('drive')
        .setDescription('Why are you acting? What motivates this action?')
        .setRequired(true)
        .addChoices(
          { name: 'Duty - Obligation to others or ideals', value: 'Duty' },
          { name: 'Faith - Religious or spiritual conviction', value: 'Faith' },
          { name: 'Justice - Moral righteousness and fairness', value: 'Justice' },
          { name: 'Power - Ambition and control', value: 'Power' },
          { name: 'Truth - Seeking knowledge and honesty', value: 'Truth' }
        )
    )
    .addStringOption(option =>
      option.setName('character')
        .setDescription('Character/NPC to roll for (defaults to your active character)')
        .setRequired(false)
        .setAutocomplete(true)
    )
    .addIntegerOption(option =>
      option.setName('difficulty')
        .setDescription('Successes needed to succeed (1-5, default 2)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(5)
    )
    .addIntegerOption(option =>
      option.setName('bonus')
        .setDescription('Extra d20s from Momentum/Determination/Assets (0-5)')
        .setRequired(false)
        .setMinValue(0)
        .setMaxValue(5)
    )
    .addStringOption(option =>
      option.setName('description')
        .setDescription('Describe what your character is attempting')
        .setRequired(false)
    )
    .addBooleanOption(option =>
      option.setName('private')
        .setDescription('Make this roll private (ephemeral)')
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('momentum')
    .setDescription('Manage momentum and threat pools')
    .addStringOption(option =>
      option.setName('action')
        .setDescription('Action to perform')
        .setRequired(false)
        .addChoices(
          { name: 'Show', value: 'show' },
          { name: 'Reset', value: 'reset' }
        )
    ),

  new SlashCommandBuilder()
    .setName('dune-help')
    .setDescription('Show help for Dune 2d20 system'),

  new SlashCommandBuilder()
    .setName('dune-reference')
    .setDescription('Quick reference for Dune 2d20 skills and drives')
    .addStringOption(option =>
      option.setName('type')
        .setDescription('What to show reference for')
        .setRequired(false)
        .addChoices(
          { name: 'Skills - The 5 core skills', value: 'skills' },
          { name: 'Drives - The 5 core drives', value: 'drives' },
          { name: 'All - Skills and drives together', value: 'all' }
        )
    )
];

export async function handleDuneRollCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  try {
    const options = interaction.options;
    const characterName = options.getString('character');
    const skillName = options.getString('skill')!;
    const driveName = options.getString('drive')!;
    const difficulty = options.getInteger('difficulty') || 2;
    const bonus = options.getInteger('bonus') || 0;
    const description = options.getString('description');
    const isPrivate = options.getBoolean('private') || false;

    const userId = interaction.user.id;

    // Get character data
    const character = await prismaCharacterManager.getUserActiveCharacter(userId);
    
    let actingCharacter: any = null;
    if (characterName) {
      // Look for specific character by name
      const userCharacters = await prismaCharacterManager.getUserCharacters(userId);
      actingCharacter = userCharacters.find((c: any) => c.name.toLowerCase() === characterName.toLowerCase());
      
      if (!actingCharacter) {
        // Try to find NPC
        const allNPCs = await prismaCharacterManager.getAllNPCs();
        const npc = allNPCs.find((n: any) => n.name.toLowerCase() === characterName.toLowerCase());
        if (npc) {
          // Check NPC access permissions: only creator can use NPCs
          const canUseNPC = npc.createdBy === userId;
          
          // For now, only the creator can use their NPCs
          // Future enhancement: Add scene host permissions
          if (!canUseNPC) {
            await interaction.reply({
              content: '❌ You can only roll for NPCs you created.',
              ephemeral: true
            });
            return;
          }
          
          actingCharacter = npc;
        }
      }
    }

    if (!actingCharacter) {
      actingCharacter = character;
    }

    // Get skill and drive values from character
    let skillValue = 8; // Default
    let driveValue = 8; // Default
    
    if (actingCharacter.skills) {
      const skill = actingCharacter.skills.find((s: any) => s.name.toLowerCase() === skillName.toLowerCase());
      skillValue = skill?.value || 8;
    }
    
    if (actingCharacter.drives) {
      const drive = actingCharacter.drives.find((d: any) => d.name.toLowerCase() === driveName.toLowerCase());
      driveValue = drive?.value || 8;
    }

    const targetNumber = skillValue + driveValue;

    // Validate parameters
    if (difficulty < 1 || difficulty > 5) {
      await interaction.reply({ 
        content: '❌ Difficulty must be between 1 and 5.', 
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

    // Perform the roll
    const result = DiceEngine.dune2d20Roll(targetNumber, bonus);

    // Get current momentum pool
    const channelId = interaction.channelId;
    const momentumPool = await dataManager.getMomentumPool(channelId);

    // Create response embed
    const embed = createImprovedDuneEmbed(
      result, 
      actingCharacter, 
      skillName, 
      driveName, 
      skillValue,
      driveValue,
      targetNumber, 
      difficulty,
      bonus, 
      description || undefined, 
      interaction.user,
      actingCharacter.type === 'npc'
    );

    // Add momentum pool info
    embed.addFields({
      name: '💫 Current Pools',
      value: `Momentum: ${momentumPool.momentum} | Threat: ${momentumPool.threat}`,
      inline: false
    });

    // Add momentum/threat buttons if there are complications or successes
    let components: ActionRowBuilder<ButtonBuilder>[] = [];
    if (result.successes > 0 || result.complications > 0) {
      const row = new ActionRowBuilder<ButtonBuilder>();

      if (result.successes > difficulty) {
        const excessSuccesses = result.successes - difficulty;
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`generate_momentum_${channelId}_${excessSuccesses}`)
            .setLabel(`Generate Momentum (+${excessSuccesses})`)
            .setStyle(ButtonStyle.Success)
            .setEmoji('✨')
        );
      }

      if (momentumPool.momentum > 0) {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`spend_momentum_${channelId}`)
            .setLabel('Spend Momentum')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('💫')
        );
      }

      if (result.complications > 0) {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`add_threat_${channelId}_${result.complications}`)
            .setLabel(`Add Threat (+${result.complications})`)
            .setStyle(ButtonStyle.Danger)
            .setEmoji('⚠️')
        );
      }

      if (row.components.length > 0) {
        components = [row];
      }
    }

    await interaction.reply({ 
      embeds: [embed], 
      components,
      ephemeral: isPrivate
    });

  } catch (error) {
    logger.error('Error in dune-roll command:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    if (!interaction.replied) {
      await interaction.reply({ 
        content: `❌ Error: ${errorMessage}`, 
        ephemeral: true 
      });
    }
  }
}

export async function handleMomentumCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  try {
    const options = interaction.options;
    const action = (options.get('action')?.value as string) || 'show';
    const channelId = interaction.channelId;

    if (action === 'show') {
      const pool = await dataManager.getMomentumPool(channelId);
      const embed = new EmbedBuilder()
        .setTitle('💫 Momentum & Threat Pools')
        .setColor('#0099ff')
        .addFields(
          { name: 'Momentum', value: `**${pool.momentum}**`, inline: true },
          { name: 'Threat', value: `**${pool.threat}**`, inline: true }
        )
        .setFooter({ text: `Last updated: ${new Date(pool.lastUpdated).toLocaleString()}` });

      await interaction.reply({ embeds: [embed] });

    } else if (action === 'reset') {
      await dataManager.resetMomentumPool(channelId);
      const embed = new EmbedBuilder()
        .setTitle('💫 Pools Reset')
        .setDescription('Momentum and Threat pools have been reset to 0.')
        .setColor('#00ff00');

      await interaction.reply({ embeds: [embed] });

    } else {
      await interaction.reply({ 
        content: "❌ Invalid action. Use 'show' or 'reset'.", 
        ephemeral: true 
      });
    }

  } catch (error) {
    logger.error('Error in momentum command:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    if (!interaction.replied) {
      await interaction.reply({ 
        content: `❌ Error: ${errorMessage}`, 
        ephemeral: true 
      });
    }
  }
}

export async function handleDuneHelpCommand(interaction: CommandInteraction): Promise<void> {
  const embed = new EmbedBuilder()
    .setTitle('⚔️ Dune 2d20 System Help')
    .setDescription('Guide to using the Dune: Adventures in the Imperium system')
    .setColor('#ff8c00')
    .addFields(
      {
        name: '🎲 Basic Roll',
        value: [
          '`/dune-roll skill:Battle drive:Justice target:12`',
          'Rolls 2d20, counts successes (≤ target)',
          '20s are complications, 2+ successes = critical'
        ].join('\n'),
        inline: false
      },
      {
        name: '➕ Bonus Dice',
        value: [
          '`/dune-roll skill:Move drive:Duty target:10 bonus:2`',
          'Adds extra d20s, uses best 2 results',
          'Spend momentum or use assets for bonus dice'
        ].join('\n'),
        inline: false
      },
      {
        name: '💫 Momentum & Threat',
        value: [
          'Momentum: Player resource pool',
          'Threat: GM resource pool',
          'Use `/momentum show` to check current pools',
          'Use buttons after rolls to adjust pools'
        ].join('\n'),
        inline: false
      },
      {
        name: '📊 Success Levels',
        value: [
          '**0 successes:** Failure',
          '**1 success:** Success',
          '**2+ successes:** Critical Success',
          '**20s:** Complications (GM gains Threat)'
        ].join('\n'),
        inline: false
      }
    );

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

export async function handleDuneMomentumButton(interaction: ButtonInteraction): Promise<void> {
  try {
    const [action, channelId, amount] = interaction.customId.split('_').slice(1);

    if (!action || !channelId) {
      await interaction.reply({ content: '❌ Invalid button interaction.', ephemeral: true });
      return;
    }

    let embed: EmbedBuilder;
    let pool;

    switch (action) {
      case 'spend':
        if (action === 'spend' && interaction.customId.includes('momentum')) {
          pool = await dataManager.updateMomentum(channelId, -1, 0);
          embed = new EmbedBuilder()
            .setTitle('💫 Momentum Spent')
            .setDescription('1 Momentum spent for additional effect')
            .setColor('#0099ff')
            .addFields(
              { name: 'Current Momentum', value: `${pool.momentum}`, inline: true },
              { name: 'Current Threat', value: `${pool.threat}`, inline: true }
            );
        }
        break;

      case 'add':
        if (action === 'add' && interaction.customId.includes('threat')) {
          const threatToAdd = parseInt(amount || '1', 10);
          pool = await dataManager.updateMomentum(channelId, 0, threatToAdd);
          embed = new EmbedBuilder()
            .setTitle('⚠️ Threat Added')
            .setDescription(`${threatToAdd} Threat added from complications`)
            .setColor('#ff0000')
            .addFields(
              { name: 'Current Momentum', value: `${pool.momentum}`, inline: true },
              { name: 'Current Threat', value: `${pool.threat}`, inline: true }
            );
        }
        break;

      case 'generate':
        if (action === 'generate' && interaction.customId.includes('momentum')) {
          const momentumToAdd = parseInt(amount || '1', 10);
          pool = await dataManager.updateMomentum(channelId, momentumToAdd, 0);
          embed = new EmbedBuilder()
            .setTitle('✨ Momentum Generated')
            .setDescription(`${momentumToAdd} Momentum generated from excess successes`)
            .setColor('#00ff00')
            .addFields(
              { name: 'Current Momentum', value: `${pool.momentum}`, inline: true },
              { name: 'Current Threat', value: `${pool.threat}`, inline: true }
            );
        }
        break;

      default:
        await interaction.reply({ content: '❌ Unknown button action.', ephemeral: true });
        return;
    }

    if (embed!) {
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } else {
      await interaction.reply({ content: '❌ Failed to process button action.', ephemeral: true });
    }

  } catch (error) {
    logger.error('Error in momentum button handler:', error);
    await interaction.reply({ content: '❌ Error processing button action.', ephemeral: true });
  }
}

function createImprovedDuneEmbed(
  result: DiceResult,
  character: any, // DuneCharacter | NPC
  skill: string,
  drive: string,
  skillValue: number,
  driveValue: number,
  target: number,
  difficulty: number,
  bonus: number,
  description: string | undefined,
  user: User,
  isNPC: boolean
): EmbedBuilder {
  const isSuccess = result.successes >= difficulty;
  const color: ColorResolvable = isSuccess ? '#00ff00' : '#ff0000';
  
  const characterType = isNPC ? 'NPC' : 'Character';
  const characterName = character.name;
  
  // Get avatar URL - use character's custom avatar or fallback to user's Discord avatar
  const avatarUrl = character.avatarUrl || user.displayAvatarURL();
  
  const embed = new EmbedBuilder()
    .setTitle(`🎲 ${characterName} - ${skill} + ${drive} Test`)
    .setColor(color)
    .setTimestamp()
    .setThumbnail(avatarUrl)
    .setFooter({ text: `Rolled by ${user.displayName}` });

  if (description) {
    embed.setDescription(`*${description}*`);
  }

  // Test details with auto-calculated target
  const totalDice = 2 + bonus;
  embed.addFields({
    name: '🎯 Test Details',
    value: `**${skill}:** ${skillValue} | **${drive}:** ${driveValue} | **Target:** ${target}\n**Difficulty:** ${difficulty} | **Bonus Dice:** +${bonus} | **Total Pool:** ${totalDice}d20`,
    inline: false
  });

  // Results with clear success/failure
  const resultText = isSuccess ? '✅ SUCCESS' : '❌ FAILURE';
  const momentum = Math.max(0, result.successes - difficulty);
  const threat = result.complications;
  
  let resultDetails = `**Outcome:** ${resultText}\n**Successes:** ${result.successes}/${difficulty}`;
  
  if (result.complications > 0) {
    resultDetails += `\n**Complications:** ${result.complications}`;
  }
  
  if (momentum > 0) {
    resultDetails += `\n**Momentum Generated:** +${momentum}`;
  }
  
  if (threat > 0) {
    resultDetails += `\n**Threat Generated:** +${threat}`;
  }

  embed.addFields({
    name: '📊 Results',
    value: resultDetails,
    inline: false
  });

  // Dice rolls with better visualization
  const diceEmojis = result.rolls.map(roll => {
    if (roll <= 1) return '🎯'; // Critical success
    if (roll <= target) return '✅'; // Success
    if (roll === 20) return '⚠️'; // Complication
    return '❌'; // Failure
  });
  
  embed.addFields({
    name: '🎲 Dice Rolls',
    value: `${diceEmojis.join(' ')} \n\`${result.rolls.join(', ')}\``,
    inline: false
  });

  return embed;
}

function formatDuneRolls(result: DiceResult, target: number): string {
  const formattedRolls: string[] = [];

  if ((result.details.bonusDice as number) > 0) {
    // Show which rolls were used vs bonus
    const allRolls = result.rolls;

    for (let i = 0; i < allRolls.length; i++) {
      const roll = allRolls[i]!;
      const isMainRoll = i < 2; // First two are always main rolls after sorting
      
      if (isMainRoll) {
        if (roll <= target) {
          formattedRolls.push(`**${roll}**✅`);
        } else if (roll === 20) {
          formattedRolls.push(`**${roll}**⚠️`);
        } else {
          formattedRolls.push(`**${roll}**`);
        }
      } else {
        // Bonus roll (not used)
        if (roll <= target) {
          formattedRolls.push(`~~${roll}~~✅`);
        } else if (roll === 20) {
          formattedRolls.push(`~~${roll}~~⚠️`);
        } else {
          formattedRolls.push(`~~${roll}~~`);
        }
      }
    }
  } else {
    // Standard 2d20 roll
    for (const roll of result.rolls) {
      if (roll <= target) {
        formattedRolls.push(`**${roll}**✅`);
      } else if (roll === 20) {
        formattedRolls.push(`**${roll}**⚠️`);
      } else {
        formattedRolls.push(`**${roll}**`);
      }
    }
  }

  return `[${formattedRolls.join(', ')}]`;
}

function getSuccessText(successes: number): string {
  if (successes >= 2) {
    return `🌟 **Critical Success!** (${successes} successes)`;
  } else if (successes === 1) {
    return `✅ **Success!** (${successes} success)`;
  } else {
    return '❌ **Failure** (0 successes)';
  }
}

// Autocomplete handler for character option
export async function autocomplete(interaction: AutocompleteInteraction) {
  const focusedOption = interaction.options.getFocused(true);
  
  if (focusedOption.name === 'character') {
    const userId = interaction.user.id;
    
    try {
      // Get user's characters
      const userCharacters = await prismaCharacterManager.getUserCharacters(userId);
      
      // Get all NPCs globally
      const allNPCs = await prismaCharacterManager.getAllNPCs();
      
      // Combine and filter based on input
      const allOptions = [
        ...userCharacters.map((char: any) => ({ name: char.name, value: char.name })),
        ...allNPCs.map((npc: any) => ({ name: `${npc.name} (NPC)`, value: npc.name }))
      ];
      
      const filtered = allOptions.filter(option => 
        option.name.toLowerCase().includes(focusedOption.value.toLowerCase())
      ).slice(0, 25); // Discord limit
      
      await interaction.respond(filtered);
    } catch (error) {
      logger.error('Error in dune-roll autocomplete:', error);
      await interaction.respond([]);
    }
  }
}
