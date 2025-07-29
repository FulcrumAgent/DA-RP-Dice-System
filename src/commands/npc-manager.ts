/**
 * NPC Management Commands
 */

import { 
  SlashCommandBuilder, 
  CommandInteraction,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  ButtonInteraction, 
  EmbedBuilder,
  GuildMember,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalSubmitInteraction
} from 'discord.js';
import { characterManager, NPC, DuneCharacter } from '../utils/character-manager';
import { DuneDiceEngine } from '../utils/dune-dice';
import { logger } from '../utils/logger';

export const data = new SlashCommandBuilder()
  .setName('npc')
  .setDescription('NPC management commands')
  .addSubcommand(subcommand =>
    subcommand
      .setName('create')
      .setDescription('Create a new NPC')
      .addStringOption(option =>
        option
          .setName('name')
          .setDescription('NPC name')
          .setRequired(true)
      )
      .addStringOption(option =>
        option
          .setName('concept')
          .setDescription('NPC concept (e.g., "Harkonnen Guard", "Fremen Warrior")')
          .setRequired(true)
      )
      .addStringOption(option =>
        option
          .setName('description')
          .setDescription('Detailed description of the NPC')
          .setRequired(true)
      )
      .addStringOption(option =>
        option
          .setName('tier')
          .setDescription('NPC tier/power level')
          .setRequired(false)
          .addChoices(
            { name: 'Minion', value: 'minion' },
            { name: 'Toughened', value: 'toughened' },
            { name: 'Nemesis', value: 'nemesis' }
          )
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('list')
      .setDescription('List all NPCs in this server')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('view')
      .setDescription('View detailed NPC information')
      .addStringOption(option =>
        option
          .setName('name')
          .setDescription('NPC name to view')
          .setRequired(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('edit')
      .setDescription('Edit an existing NPC')
      .addStringOption(option =>
        option
          .setName('name')
          .setDescription('NPC name to edit')
          .setRequired(true)
      )
      .addStringOption(option =>
        option
          .setName('field')
          .setDescription('Field to edit')
          .setRequired(true)
          .addChoices(
            { name: 'Name', value: 'name' },
            { name: 'Concept', value: 'concept' },
            { name: 'Description', value: 'description' },
            { name: 'Tier', value: 'tier' }
          )
      )
      .addStringOption(option =>
        option
          .setName('value')
          .setDescription('New value (for Tier: minion, toughened, or nemesis)')
          .setRequired(true)
          .setAutocomplete(true)
      )
  )
  .addSubcommandGroup(group =>
    group
      .setName('roll')
      .setDescription('NPC rolling commands')
      .addSubcommand(subcommand =>
        subcommand
          .setName('basic')
          .setDescription('Simple stat roll for Supporting Characters')
          .addStringOption(option =>
            option
              .setName('name')
              .setDescription('NPC name')
              .setRequired(true)
          )
          .addIntegerOption(option =>
            option
              .setName('difficulty')
              .setDescription('Test difficulty (1-5)')
              .setRequired(false)
              .setMinValue(1)
              .setMaxValue(5)
          )
          .addStringOption(option =>
            option
              .setName('asset')
              .setDescription('Asset providing bonus')
              .setRequired(false)
          )
          .addStringOption(option =>
            option
              .setName('description')
              .setDescription('What is the NPC attempting?')
              .setRequired(false)
          )
      )
      .addSubcommand(subcommand =>
        subcommand
          .setName('skill')
          .setDescription('Full skill+drive roll for Adversary NPCs')
          .addStringOption(option =>
            option
              .setName('name')
              .setDescription('NPC name')
              .setRequired(true)
          )
          .addStringOption(option =>
            option
              .setName('skill')
              .setDescription('Skill to use')
              .setRequired(true)
              .addChoices(
                { name: 'Battle', value: 'Battle' },
                { name: 'Communicate', value: 'Communicate' },
                { name: 'Discipline', value: 'Discipline' },
                { name: 'Move', value: 'Move' },
                { name: 'Understand', value: 'Understand' }
              )
          )
          .addStringOption(option =>
            option
              .setName('drive')
              .setDescription('Drive to use')
              .setRequired(true)
              .addChoices(
                { name: 'Duty', value: 'Duty' },
                { name: 'Faith', value: 'Faith' },
                { name: 'Justice', value: 'Justice' },
                { name: 'Power', value: 'Power' },
                { name: 'Truth', value: 'Truth' }
              )
          )
          .addIntegerOption(option =>
            option
              .setName('difficulty')
              .setDescription('Test difficulty (1-5)')
              .setRequired(false)
              .setMinValue(1)
              .setMaxValue(5)
          )
          .addStringOption(option =>
            option
              .setName('asset')
              .setDescription('Asset providing bonus')
              .setRequired(false)
          )
          .addStringOption(option =>
            option
              .setName('description')
              .setDescription('What is the NPC attempting?')
              .setRequired(false)
          )
      )
      .addSubcommand(subcommand =>
        subcommand
          .setName('attack')
          .setDescription('Combat attack roll')
          .addStringOption(option =>
            option
              .setName('name')
              .setDescription('NPC name')
              .setRequired(true)
          )
          .addStringOption(option =>
            option
              .setName('weapon')
              .setDescription('Weapon being used')
              .setRequired(false)
          )
          .addIntegerOption(option =>
            option
              .setName('difficulty')
              .setDescription('Attack difficulty (1-5)')
              .setRequired(false)
              .setMinValue(1)
              .setMaxValue(5)
          )
          .addStringOption(option =>
            option
              .setName('description')
              .setDescription('Description of the attack')
              .setRequired(false)
          )
      )
      .addSubcommand(subcommand =>
        subcommand
          .setName('resist')
          .setDescription('Resistance/saving throw')
          .addStringOption(option =>
            option
              .setName('name')
              .setDescription('NPC name')
              .setRequired(true)
          )
          .addStringOption(option =>
            option
              .setName('type')
              .setDescription('Type of resistance')
              .setRequired(false)
              .addChoices(
                { name: 'Mental', value: 'mental' },
                { name: 'Physical', value: 'physical' },
                { name: 'Social', value: 'social' }
              )
          )
          .addIntegerOption(option =>
            option
              .setName('difficulty')
              .setDescription('Resistance difficulty (1-5)')
              .setRequired(false)
              .setMinValue(1)
              .setMaxValue(5)
          )
          .addStringOption(option =>
            option
              .setName('description')
              .setDescription('What is being resisted?')
              .setRequired(false)
          )
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('generate')
      .setDescription('Generate quick NPC stats')
      .addStringOption(option =>
        option
          .setName('tier')
          .setDescription('NPC tier/power level')
          .setRequired(true)
          .addChoices(
            { name: 'Minion', value: 'minion' },
            { name: 'Toughened', value: 'toughened' },
            { name: 'Nemesis', value: 'nemesis' }
          )
      )
      .addStringOption(option =>
        option
          .setName('concept')
          .setDescription('NPC concept for stat generation')
          .setRequired(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('delete')
      .setDescription('Delete an NPC (requires manage server permission)')
      .addStringOption(option =>
        option
          .setName('name')
          .setDescription('NPC name to delete')
          .setRequired(true)
      )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild || !interaction.member) {
    await interaction.reply({ content: 'This command can only be used in a server.', flags: MessageFlags.Ephemeral });
    return;
  }

  const subcommandGroup = interaction.options.getSubcommandGroup();
  const subcommand = interaction.options.getSubcommand();
  const member = interaction.member as GuildMember;

  try {
    if (subcommandGroup === 'roll') {
      switch (subcommand) {
        case 'basic':
          await handleNPCBasicRoll(interaction);
          break;
        case 'skill':
          await handleNPCSkillRoll(interaction);
          break;
        case 'attack':
          await handleNPCAttackRoll(interaction);
          break;
        case 'resist':
          await handleNPCResistRoll(interaction);
          break;
        default:
          await interaction.reply({ content: 'Unknown roll subcommand.', flags: MessageFlags.Ephemeral });
      }
    } else {
      switch (subcommand) {
        case 'create':
          await handleCreateNPC(interaction, member);
          break;
        case 'list':
          await handleListNPCs(interaction);
          break;
        case 'view':
          await handleViewNPC(interaction);
          break;
        case 'edit':
          await handleEditNPC(interaction, member);
          break;
        case 'generate':
          await handleGenerateNPC(interaction);
          break;
        case 'delete':
          await handleDeleteNPC(interaction, member);
          break;
        default:
          await interaction.reply({ content: 'Unknown subcommand.', flags: MessageFlags.Ephemeral });
      }
    }
  } catch (error) {
    logger.error('NPC command error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: `❌ ${errorMessage}`, flags: MessageFlags.Ephemeral });
    } else {
      await interaction.reply({ content: `❌ ${errorMessage}`, flags: MessageFlags.Ephemeral });
    }
  }
}

export async function autocomplete(interaction: AutocompleteInteraction) {
  const focusedOption = interaction.options.getFocused(true);
  
  if (focusedOption.name === 'value') {
    const fieldOption = interaction.options.getString('field');
    
    if (fieldOption === 'tier') {
      const choices = [
        { name: 'Minion', value: 'minion' },
        { name: 'Toughened', value: 'toughened' },
        { name: 'Nemesis', value: 'nemesis' }
      ];
      
      const filtered = choices.filter(choice => 
        choice.name.toLowerCase().includes(focusedOption.value.toLowerCase())
      );
      
      await interaction.respond(filtered.slice(0, 25));
    } else {
      await interaction.respond([]);
    }
  }
}

async function handleCreateNPC(interaction: ChatInputCommandInteraction, member: GuildMember) {
  const name = interaction.options.getString('name');
  const concept = interaction.options.getString('concept');
  const description = interaction.options.getString('description');
  const tier = interaction.options.getString('tier') || 'minion';

  if (!name) {
    await interaction.reply({ content: 'Please provide an NPC name.', ephemeral: true });
    return;
  }

  if (!concept) {
    await interaction.reply({ content: 'Please provide an NPC concept.', ephemeral: true });
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    // Generate base stats for the tier
    const baseStats = DuneDiceEngine.generateNPCStats(tier as 'minion' | 'toughened' | 'nemesis');
    
    const npc = await characterManager.createNPC(
      name,
      interaction.guild!.id,
      [concept],
      description || '',
      member.id,
      {
        tier: tier as 'minion' | 'toughened' | 'nemesis',
        attributes: baseStats.attributes,
        skills: Object.entries(baseStats.skills).map(([skillName, value]) => ({
          name: skillName,
          value: value as number
        }))
      }
    );

    const embed = new EmbedBuilder()
      .setColor(0x8B4513)
      .setTitle('👤 NPC Created!')
      .setDescription(`**${npc.name}** has been added to the server.`)
      .addFields(
        { name: '🎯 Concepts', value: npc.concepts.join(', '), inline: true },
        { name: '⭐ Tier', value: tier.charAt(0).toUpperCase() + tier.slice(1), inline: true },
        { name: '👤 Created By', value: `<@${member.id}>`, inline: true },
        { name: '📝 Description', value: npc.description, inline: false }
      )
      .setFooter({ text: 'Use /npc view to see full stats' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    await interaction.editReply({ content: `Failed to create NPC: ${error}` });
  }
}

async function handleListNPCs(interaction: CommandInteraction) {
  const npcs = await characterManager.getGuildNPCs(interaction.guild!.id);

  if (npcs.length === 0) {
    await interaction.reply({ content: 'No NPCs found in this server. Use `/npc create` to add some!', flags: MessageFlags.Ephemeral });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0x9370DB)
    .setTitle('👥 Server NPCs')
    .setDescription(`Found ${npcs.length} NPC(s):`)
    .setTimestamp();

  // Group NPCs by concept for better organization
  const npcList = npcs.map((npc, index) => {
    const concepts = Array.isArray(npc.concepts) ? npc.concepts.join(', ') : (npc.concepts || 'No concept');
    return `**${index + 1}. ${npc.name}**\n*${concepts}*\nCreated by <@${npc.createdBy}>`;
  }).join('\n\n');

  // Split into multiple fields if too long
  if (npcList.length > 4096) {
    const chunks = npcList.match(/.{1,1000}/g) || [npcList];
    chunks.forEach((chunk, index) => {
      embed.addFields({
        name: index === 0 ? 'NPCs' : `NPCs (continued ${index + 1})`,
        value: chunk,
        inline: false
      });
    });
  } else {
    embed.setDescription(`Found ${npcs.length} NPC(s):\n\n${npcList}`);
  }

  await interaction.reply({ embeds: [embed] });
}

async function handleViewNPC(interaction: ChatInputCommandInteraction) {
  const npcName = interaction.options.getString('name');
  
  if (!npcName) {
    await interaction.reply({ content: 'Please provide an NPC name.', ephemeral: true });
    return;
  }
  
  const npc = await characterManager.getNPCByName(npcName, interaction.guild!.id);
  
  if (!npc) {
    await interaction.reply({ 
      content: `❌ NPC "${npcName}" not found.`, 
      flags: MessageFlags.Ephemeral 
    });
    return;
  }

  const embed = createNPCEmbed(npc);
  await interaction.reply({ embeds: [embed] });
}

async function handleEditNPC(interaction: ChatInputCommandInteraction, member: GuildMember) {
  const npcName = interaction.options.getString('name');
  const field = interaction.options.getString('field');
  const value = interaction.options.getString('value');

  if (!npcName) {
    await interaction.reply({ content: 'Please provide an NPC name.', flags: MessageFlags.Ephemeral });
    return;
  }

  if (!field) {
    await interaction.reply({ content: 'Please provide a field to edit.', flags: MessageFlags.Ephemeral });
    return;
  }

  if (!value) {
    await interaction.reply({ content: 'Please provide a value.', flags: MessageFlags.Ephemeral });
    return;
  }

  const npc = await characterManager.getNPCByName(npcName, interaction.guild!.id);
  
  if (!npc) {
    await interaction.reply({ 
      content: `❌ NPC "${npcName}" not found.`, 
      flags: MessageFlags.Ephemeral 
    });
    return;
  }

  // Check permissions - only creator or server managers can edit
  if (npc.createdBy !== member.id && !member.permissions.has(PermissionFlagsBits.ManageGuild)) {
    await interaction.reply({ 
      content: '❌ You can only edit NPCs you created, or you need Manage Server permission.', 
      flags: MessageFlags.Ephemeral 
    });
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    // Validate tier field if editing tier
    if (field === 'tier') {
      const validTiers = ['minion', 'toughened', 'nemesis'];
      if (!validTiers.includes(value.toLowerCase())) {
        await interaction.editReply({ 
          content: `❌ Invalid tier. Must be one of: ${validTiers.join(', ')}` 
        });
        return;
      }
    }

    // Update the NPC using characterManager
    await characterManager.updateNPC(npc.id, field, value, member.id);
    
    await interaction.editReply({ 
      content: `✅ Successfully updated **${field}** of **${npcName}** to "**${value}**"` 
    });

  } catch (error) {
    await interaction.editReply({ content: `Failed to edit NPC: ${error}` });
  }
}

/**
 * Handle basic stat roll for Supporting Characters
 */
async function handleNPCBasicRoll(interaction: ChatInputCommandInteraction) {
  const npcName = interaction.options.getString('name')!;
  const difficulty = interaction.options.getInteger('difficulty') || 2;
  const asset = interaction.options.getString('asset');
  const description = interaction.options.getString('description');

  const npc = await characterManager.getNPCByName(npcName, interaction.guild!.id);
  
  if (!npc) {
    await interaction.reply({ 
      content: `❌ NPC "${npcName}" not found.`, 
      flags: MessageFlags.Ephemeral 
    });
    return;
  }

  await interaction.deferReply();

  try {
    // For Supporting Characters, use a single stat (default 7 for minions, 8 for toughened, 9 for nemesis)
    let baseStat = 7;
    if (npc.tier === 'toughened') baseStat = 8;
    if (npc.tier === 'nemesis') baseStat = 9;

    // Asset bonus (typically +1 or +2 dice)
    const assetBonus = asset ? 1 : 0;
    const totalDice = 2 + assetBonus;

    // Roll dice
    const rolls: number[] = [];
    for (let i = 0; i < totalDice; i++) {
      rolls.push(Math.floor(Math.random() * 20) + 1);
    }

    // Calculate results
    const successes = rolls.filter(roll => roll <= baseStat).length;
    const complications = rolls.filter(roll => roll >= 20).length;
    const criticalHits = rolls.filter(roll => roll === 1).length;
    const success = successes >= difficulty;
    const momentum = success ? Math.max(0, successes - difficulty) : 0;
    const threat = complications;

    // Create result embed
    const embed = new EmbedBuilder()
      .setColor(success ? 0x00FF00 : 0xFF0000)
      .setTitle(`🎲 ${npc.name} - Basic Roll`)
      .setDescription(description || `${npc.name} attempts a basic action`)
      .addFields(
        {
          name: '🎯 Test Details',
          value: `**Target Number:** ${baseStat}\n**Difficulty:** ${difficulty}\n**Dice Pool:** ${totalDice}d20${asset ? ` (+1 from ${asset})` : ''}`,
          inline: true
        },
        {
          name: '📊 Results',
          value: `**${success ? '✅ SUCCESS' : '❌ FAILURE'}**\n**Successes:** ${successes}\n**Complications:** ${complications}\n**Critical Hits:** ${criticalHits}`,
          inline: true
        },
        {
          name: '⚡ Resources',
          value: `**Momentum:** +${momentum}\n**Threat:** +${threat}`,
          inline: true
        }
      );

    // Add dice display
    const diceDisplay = rolls.map((roll: number) => {
      let emoji = '⚪'; // Default
      if (roll <= baseStat) {
        emoji = roll === 1 ? '🎯' : '✅'; // Critical or success
      }
      if (roll >= 20) {
        emoji = '⚠️'; // Complication
      }
      return `${emoji}${roll}`;
    }).join(' ');

    embed.addFields({
      name: '🎲 Dice Rolls',
      value: diceDisplay,
      inline: false
    });

    const concepts = Array.isArray(npc.concepts) ? npc.concepts.join(', ') : (npc.concepts || 'Supporting Character');
    embed.setFooter({ text: concepts })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    await interaction.editReply({ content: `Failed to roll for NPC: ${error}` });
  }
}

/**
 * Handle skill+drive roll for Adversary NPCs
 */
async function handleNPCSkillRoll(interaction: ChatInputCommandInteraction) {
  const npcName = interaction.options.getString('name')!;
  const skillName = interaction.options.getString('skill')!;
  const driveName = interaction.options.getString('drive')!;
  const difficulty = interaction.options.getInteger('difficulty') || 2;
  const asset = interaction.options.getString('asset');
  const description = interaction.options.getString('description');

  const npc = await characterManager.getNPCByName(npcName, interaction.guild!.id);
  
  if (!npc) {
    await interaction.reply({ 
      content: `❌ NPC "${npcName}" not found.`, 
      flags: MessageFlags.Ephemeral 
    });
    return;
  }

  await interaction.deferReply();

  try {
    // Get skill value (default to 8 if not found)
    const skill = npc.skills?.find(s => s.name.toLowerCase() === skillName.toLowerCase());
    const skillValue = skill?.value || 8;

    // For Adversary NPCs, drives are typically 8-10
    const driveValue = 8; // Default drive value for adversaries

    // Asset bonus
    const assetBonus = asset ? 1 : 0;
    const totalDice = 2 + assetBonus;
    const targetNumber = skillValue + driveValue;

    // Roll dice
    const rolls: number[] = [];
    for (let i = 0; i < totalDice; i++) {
      rolls.push(Math.floor(Math.random() * 20) + 1);
    }

    // Calculate results
    const successes = rolls.filter(roll => roll <= targetNumber).length;
    const complications = rolls.filter(roll => roll >= 20).length;
    const criticalHits = rolls.filter(roll => roll === 1).length;
    const success = successes >= difficulty;
    const momentum = success ? Math.max(0, successes - difficulty) : 0;
    const threat = complications;

    // Create result embed
    const embed = new EmbedBuilder()
      .setColor(success ? 0x00FF00 : 0xFF0000)
      .setTitle(`🎲 ${npc.name} - ${skillName} + ${driveName} Test`)
      .setDescription(description || `${npc.name} attempts a ${skillName} + ${driveName} test`)
      .addFields(
        {
          name: '🎯 Test Details',
          value: `**${skillName}:** ${skillValue}\n**${driveName}:** ${driveValue}\n**Target:** ${targetNumber}\n**Difficulty:** ${difficulty}`,
          inline: true
        },
        {
          name: '📊 Results',
          value: `**${success ? '✅ SUCCESS' : '❌ FAILURE'}**\n**Successes:** ${successes}\n**Complications:** ${complications}\n**Critical Hits:** ${criticalHits}`,
          inline: true
        },
        {
          name: '⚡ Resources',
          value: `**Momentum:** +${momentum}\n**Threat:** +${threat}`,
          inline: true
        }
      );

    // Add dice display
    const diceDisplay = rolls.map((roll: number) => {
      let emoji = '⚪';
      if (roll <= targetNumber) {
        emoji = roll === 1 ? '🎯' : '✅';
      }
      if (roll >= 20) {
        emoji = '⚠️';
      }
      return `${emoji}${roll}`;
    }).join(' ');

    embed.addFields({
      name: '🎲 Dice Rolls',
      value: diceDisplay,
      inline: false
    });

    const concepts = Array.isArray(npc.concepts) ? npc.concepts.join(', ') : (npc.concepts || 'Adversary');
    embed.setFooter({ text: concepts })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    await interaction.editReply({ content: `Failed to roll for NPC: ${error}` });
  }
}

/**
 * Handle attack roll
 */
async function handleNPCAttackRoll(interaction: ChatInputCommandInteraction) {
  const npcName = interaction.options.getString('name')!;
  const weapon = interaction.options.getString('weapon');
  const difficulty = interaction.options.getInteger('difficulty') || 2;
  const description = interaction.options.getString('description');

  const npc = await characterManager.getNPCByName(npcName, interaction.guild!.id);
  
  if (!npc) {
    await interaction.reply({ 
      content: `❌ NPC "${npcName}" not found.`, 
      flags: MessageFlags.Ephemeral 
    });
    return;
  }

  await interaction.deferReply();

  try {
    // Use Battle skill for attacks
    const battleSkill = npc.skills?.find(s => s.name.toLowerCase() === 'battle');
    let attackValue = battleSkill?.value || 8;
    
    // For Supporting Characters, use their base stat
    if (!battleSkill) {
      if (npc.tier === 'minion') attackValue = 7;
      else if (npc.tier === 'toughened') attackValue = 8;
      else if (npc.tier === 'nemesis') attackValue = 9;
    }

    // Weapon bonus (if specified)
    const weaponBonus = weapon ? 1 : 0;
    const totalDice = 2 + weaponBonus;

    // Roll dice
    const rolls: number[] = [];
    for (let i = 0; i < totalDice; i++) {
      rolls.push(Math.floor(Math.random() * 20) + 1);
    }

    // Calculate results
    const successes = rolls.filter(roll => roll <= attackValue).length;
    const complications = rolls.filter(roll => roll >= 20).length;
    const criticalHits = rolls.filter(roll => roll === 1).length;
    const success = successes >= difficulty;
    const momentum = success ? Math.max(0, successes - difficulty) : 0;
    const threat = complications;

    // Create result embed
    const embed = new EmbedBuilder()
      .setColor(success ? 0x00FF00 : 0xFF0000)
      .setTitle(`⚔️ ${npc.name} - Attack${weapon ? ` (${weapon})` : ''}`)
      .setDescription(description || `${npc.name} attacks${weapon ? ` with ${weapon}` : ''}!`)
      .addFields(
        {
          name: '🎯 Attack Details',
          value: `**Attack Value:** ${attackValue}\n**Difficulty:** ${difficulty}\n**Dice Pool:** ${totalDice}d20${weapon ? ` (+1 from ${weapon})` : ''}`,
          inline: true
        },
        {
          name: '📊 Results',
          value: `**${success ? '🎯 HIT!' : '❌ MISS'}**\n**Successes:** ${successes}\n**Complications:** ${complications}\n**Critical Hits:** ${criticalHits}`,
          inline: true
        },
        {
          name: '⚡ Resources',
          value: `**Momentum:** +${momentum}\n**Threat:** +${threat}`,
          inline: true
        }
      );

    // Add dice display
    const diceDisplay = rolls.map((roll: number) => {
      let emoji = '⚪';
      if (roll <= attackValue) {
        emoji = roll === 1 ? '🎯' : '✅';
      }
      if (roll >= 20) {
        emoji = '⚠️';
      }
      return `${emoji}${roll}`;
    }).join(' ');

    embed.addFields({
      name: '🎲 Dice Rolls',
      value: diceDisplay,
      inline: false
    });

    const concepts = Array.isArray(npc.concepts) ? npc.concepts.join(', ') : (npc.concepts || 'Combatant');
    embed.setFooter({ text: concepts })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    await interaction.editReply({ content: `Failed to roll attack for NPC: ${error}` });
  }
}

/**
 * Handle resistance/saving throw
 */
async function handleNPCResistRoll(interaction: ChatInputCommandInteraction) {
  const npcName = interaction.options.getString('name')!;
  const resistType = interaction.options.getString('type') || 'general';
  const difficulty = interaction.options.getInteger('difficulty') || 2;
  const description = interaction.options.getString('description');

  const npc = await characterManager.getNPCByName(npcName, interaction.guild!.id);
  
  if (!npc) {
    await interaction.reply({ 
      content: `❌ NPC "${npcName}" not found.`, 
      flags: MessageFlags.Ephemeral 
    });
    return;
  }

  await interaction.deferReply();

  try {
    // Determine resistance value based on type and NPC tier
    let resistValue = 8; // Default
    
    if (resistType === 'mental') {
      // Use Discipline for mental resistance
      const disciplineSkill = npc.skills?.find(s => s.name.toLowerCase() === 'discipline');
      resistValue = disciplineSkill?.value || 8;
    } else if (resistType === 'physical') {
      // Use base physical resistance
      if (npc.tier === 'minion') resistValue = 7;
      else if (npc.tier === 'toughened') resistValue = 8;
      else if (npc.tier === 'nemesis') resistValue = 9;
    } else if (resistType === 'social') {
      // Use Communicate for social resistance
      const communicateSkill = npc.skills?.find(s => s.name.toLowerCase() === 'communicate');
      resistValue = communicateSkill?.value || 8;
    }

    // Roll 2d20
    const rolls = [Math.floor(Math.random() * 20) + 1, Math.floor(Math.random() * 20) + 1];

    // Calculate results
    const successes = rolls.filter(roll => roll <= resistValue).length;
    const complications = rolls.filter(roll => roll >= 20).length;
    const criticalHits = rolls.filter(roll => roll === 1).length;
    const success = successes >= difficulty;
    const momentum = success ? Math.max(0, successes - difficulty) : 0;
    const threat = complications;

    // Create result embed
    const embed = new EmbedBuilder()
      .setColor(success ? 0x00FF00 : 0xFF0000)
      .setTitle(`🛡️ ${npc.name} - ${resistType.charAt(0).toUpperCase() + resistType.slice(1)} Resistance`)
      .setDescription(description || `${npc.name} attempts to resist ${resistType} effects`)
      .addFields(
        {
          name: '🎯 Resistance Details',
          value: `**Resistance Value:** ${resistValue}\n**Type:** ${resistType.charAt(0).toUpperCase() + resistType.slice(1)}\n**Difficulty:** ${difficulty}`,
          inline: true
        },
        {
          name: '📊 Results',
          value: `**${success ? '✅ RESISTED' : '❌ FAILED'}**\n**Successes:** ${successes}\n**Complications:** ${complications}\n**Critical Hits:** ${criticalHits}`,
          inline: true
        },
        {
          name: '⚡ Resources',
          value: `**Momentum:** +${momentum}\n**Threat:** +${threat}`,
          inline: true
        }
      );

    // Add dice display
    const diceDisplay = rolls.map((roll: number) => {
      let emoji = '⚪';
      if (roll <= resistValue) {
        emoji = roll === 1 ? '🎯' : '✅';
      }
      if (roll >= 20) {
        emoji = '⚠️';
      }
      return `${emoji}${roll}`;
    }).join(' ');

    embed.addFields({
      name: '🎲 Dice Rolls',
      value: diceDisplay,
      inline: false
    });

    const concepts = Array.isArray(npc.concepts) ? npc.concepts.join(', ') : (npc.concepts || 'Defender');
    embed.setFooter({ text: concepts })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    await interaction.editReply({ content: `Failed to roll resistance for NPC: ${error}` });
  }
}

async function handleGenerateNPC(interaction: ChatInputCommandInteraction) {
  const tier = interaction.options.getString('tier') as 'minion' | 'toughened' | 'nemesis';
  const concept = interaction.options.getString('concept');

  if (!concept) {
    await interaction.reply({ content: 'Please provide a concept for the NPC.', ephemeral: true });
    return;
  }

  const stats = DuneDiceEngine.generateNPCStats(tier);

  const embed = new EmbedBuilder()
    .setColor(0x4169E1)
    .setTitle(`🎲 Generated ${tier.charAt(0).toUpperCase() + tier.slice(1)} Stats`)
    .setDescription(`*${concept}*`)
    .addFields(
      {
        name: '⚡ Attributes',
        value: Object.entries(stats.attributes)
          .map(([name, value]) => `**${name.charAt(0).toUpperCase() + name.slice(1)}:** ${value}`)
          .join('\n'),
        inline: true
      },
      {
        name: '🎯 Skills',
        value: Object.entries(stats.skills)
          .map(([name, value]) => `**${name.charAt(0).toUpperCase() + name.slice(1)}:** ${value}`)
          .join('\n'),
        inline: true
      },
      {
        name: '❤️ Health',
        value: `**Vigor:** ${stats.vigor}\n**Resolve:** ${stats.resolve}`,
        inline: true
      }
    )
    .setFooter({ text: 'Click "Save as NPC" to save this as a permanent NPC' })
    .setTimestamp();

  // Create save button
  const saveButton = new ButtonBuilder()
    .setCustomId(`save_generated_npc_${tier}_${Date.now()}`)
    .setLabel('Save as NPC')
    .setStyle(ButtonStyle.Success);

  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(saveButton);

  // Store the generated stats temporarily for saving
  const tempData = {
    tier,
    concept,
    stats,
    timestamp: Date.now()
  };
  
  // Store in a simple cache (in production, use Redis or similar)
  if (!((global as unknown) as { tempNPCData?: Map<string, any> }).tempNPCData) ((global as unknown) as { tempNPCData?: Map<string, any> }).tempNPCData = new Map();
  ((global as unknown) as { tempNPCData: Map<string, any> }).tempNPCData.set(`${tier}_${Date.now()}`, tempData);

  await interaction.reply({ 
    embeds: [embed], 
    components: [row],
    flags: MessageFlags.Ephemeral
  });
}

async function handleDeleteNPC(interaction: ChatInputCommandInteraction, member: GuildMember) {
  const npcName = interaction.options.getString('name');

  if (!npcName) {
    await interaction.reply({ content: 'Please provide an NPC name.', flags: MessageFlags.Ephemeral });
    return;
  }

  const npc = await characterManager.getNPCByName(npcName, interaction.guild!.id);
  
  if (!npc) {
    await interaction.reply({ 
      content: `❌ NPC "${npcName}" not found.`, 
      flags: MessageFlags.Ephemeral 
    });
    return;
  }

  // Check permissions
  if (npc.createdBy !== member.id && !member.permissions.has(PermissionFlagsBits.ManageGuild)) {
    await interaction.reply({ 
      content: '❌ You can only delete NPCs you created, or you need Manage Server permission.', 
      flags: MessageFlags.Ephemeral 
    });
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    // Delete the NPC
    await characterManager.deleteNPC(npc.id, member.id);
    
    await interaction.editReply({ 
      content: `✅ Successfully deleted NPC "**${npcName}**".` 
    });

  } catch (error) {
    await interaction.editReply({ content: `Failed to delete NPC: ${error}` });
  }
}

function createNPCEmbed(npc: NPC): EmbedBuilder {
  const tierText = npc.tier ? ` (${npc.tier.charAt(0).toUpperCase() + npc.tier.slice(1)})` : '';
  const concepts = Array.isArray(npc.concepts) ? npc.concepts.join(', ') : (npc.concepts || 'No concept');
  const embed = new EmbedBuilder()
    .setColor(0x8B4513)
    .setTitle(`👤 ${npc.name}${tierText}`)
    .setDescription(`*${concepts}*\n\n${npc.description}`)
    .setFooter({ text: `Created by ${npc.createdBy} • ${new Date(npc.createdAt).toLocaleDateString()}` })
    .setTimestamp();

  // Add attributes if present
  if (npc.attributes) {
    const attrs = Object.entries(npc.attributes)
      .map(([name, value]) => `**${name.charAt(0).toUpperCase() + name.slice(1)}:** ${value}`)
      .join('\n');
    embed.addFields({ name: '⚡ Attributes', value: attrs, inline: true });
  }

  // Add skills if present
  if (npc.skills && npc.skills.length > 0) {
    const skills = npc.skills
      .filter(skill => skill.value > 0)
      .map(skill => `**${skill.name}:** ${skill.value}`)
      .join('\n');
    if (skills) {
      embed.addFields({ name: '🎯 Skills', value: skills, inline: true });
    }
  }

  // Add assets if present
  if (npc.assets && npc.assets.length > 0) {
    const assets = npc.assets
      .map(asset => `**${asset.name}** (${asset.type}): ${asset.description}`)
      .join('\n');
    embed.addFields({ name: '🎒 Assets', value: assets.length > 1024 ? assets.substring(0, 1020) + '...' : assets, inline: false });
  }

  // Add traits if present
  if (npc.traits && npc.traits.length > 0) {
    const traits = npc.traits
      .map(trait => `**${trait.name}** (${trait.type}): ${trait.description}`)
      .join('\n');
    embed.addFields({ name: '✨ Traits', value: traits.length > 1024 ? traits.substring(0, 1020) + '...' : traits, inline: false });
  }

  return embed;
}

// Handle saving a generated NPC
export async function handleSaveGeneratedNPC(interaction: ButtonInteraction) {
  const customId = interaction.customId;
  const keyMatch = customId.match(/save_generated_npc_(.+)/);
  
  if (!keyMatch) {
    await interaction.reply({ 
      content: '❌ Invalid save request.', 
      flags: MessageFlags.Ephemeral 
    });
    return;
  }

  const key = keyMatch[1];
  const tempData = (global as { tempNPCData?: Map<string, any> }).tempNPCData?.get(key);
  
  if (!tempData) {
    await interaction.reply({ 
      content: '❌ Generated NPC data has expired. Please generate a new NPC.', 
      flags: MessageFlags.Ephemeral 
    });
    return;
  }

  // Show modal for NPC name input
  const modal = new ModalBuilder()
    .setCustomId(`save_npc_name_${key}`)
    .setTitle('Save Generated NPC');

  const nameInput = new TextInputBuilder()
    .setCustomId('npc_name')
    .setLabel('NPC Name')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Enter a name for this NPC')
    .setRequired(true)
    .setMaxLength(50);

  const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput);
  modal.addComponents(actionRow);

  await interaction.showModal(modal);
}

// Handle NPC name modal submission
export async function handleSaveNPCNameModal(interaction: ModalSubmitInteraction, member: GuildMember) {
  const customId = interaction.customId;
  const keyMatch = customId.match(/save_npc_name_(.+)/);
  
  if (!keyMatch) {
    await interaction.reply({ 
      content: '❌ Invalid save request.', 
      flags: MessageFlags.Ephemeral 
    });
    return;
  }

  const key = keyMatch[1];
  const tempData = (global as { tempNPCData?: Map<string, any> }).tempNPCData?.get(key);
  
  if (!tempData) {
    await interaction.reply({ 
      content: '❌ Generated NPC data has expired. Please generate a new NPC.', 
      flags: MessageFlags.Ephemeral 
    });
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    const npcName = interaction.fields.getTextInputValue('npc_name').trim();
    
    if (!npcName) {
      await interaction.editReply({ 
        content: '❌ NPC name cannot be empty.' 
      });
      return;
    }

    const { tier, concept, stats } = tempData;
    
    // Convert stats to NPC format
    const skills: { name: string; value: number }[] = Object.entries(stats.skills).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: value as number
    }));

    // Create the NPC with user-provided name
    await characterManager.createNPC(
      npcName,
      interaction.guild!.id,
      [concept],
      `Auto-generated ${tier} NPC with concept: ${concept}`,
      member.id,
      {
        tier: tier as 'minion' | 'toughened' | 'nemesis',
        attributes: stats.attributes,
        skills: skills
      }
    );

    // Clean up temp data
    (global as { tempNPCData?: Map<string, any> }).tempNPCData?.delete(key);

    await interaction.editReply({ 
      content: `✅ Successfully saved NPC as "**${npcName}**"!\n\n📝 Use \`/npc edit name:${npcName}\` to customize further.\n🔍 Use \`/npc view name:${npcName}\` to see the full NPC details.` 
    });

  } catch (error) {
    await interaction.editReply({ 
      content: `❌ Failed to save NPC: ${error}` 
    });
  }
}
