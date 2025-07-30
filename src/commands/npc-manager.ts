import {
  SlashCommandBuilder,
  CommandInteraction,
  ChatInputCommandInteraction,
  GuildMember,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalSubmitInteraction
} from 'discord.js';
import { logger } from '../utils/logger';
import { prismaCharacterManager, PrismaCharacterManager } from '../utils/prisma-character-manager.js';
import { DuneDiceEngine } from '../utils/dune-dice.js';

/**
 * Map internal tier values to official TTRPG display names
 */
function getTierDisplayName(tier: string): string {
  switch (tier) {
    case 'minion':
      return 'Supporting Character';
    case 'toughened':
      return 'Notable/Elite Supporting Character';
    case 'nemesis':
      return 'Adversary';
    default:
      return tier;
  }
}

/**
 * Map display names back to internal tier values
 */
function getTierInternalValue(displayName: string): string {
  switch (displayName) {
    case 'Supporting Character':
      return 'minion';
    case 'Notable/Elite Supporting Character':
      return 'toughened';
    case 'Adversary':
      return 'nemesis';
    default:
      return displayName.toLowerCase();
  }
}

export const data = new SlashCommandBuilder()
  .setName('npc')
  .setDescription('NPC management commands')
  .addSubcommand(subcommand =>
    subcommand
      .setName('create')
      .setDescription('Create a new NPC')
      .addStringOption(option =>
        option.setName('name')
          .setDescription('Name of the NPC')
          .setRequired(true))
      .addStringOption(option =>
        option.setName('concept')
          .setDescription('Primary concept/role of the NPC')
          .setRequired(true))
      .addStringOption(option =>
        option.setName('tier')
          .setDescription('NPC tier')
          .setRequired(true)
          .addChoices(
            { name: 'Supporting Character', value: 'minion' },
            { name: 'Notable/Elite Supporting Character', value: 'toughened' },
            { name: 'Adversary', value: 'nemesis' }
          ))
      .addStringOption(option =>
        option.setName('description')
          .setDescription('Brief description of the NPC')
          .setRequired(false)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('generate')
      .setDescription('Generate a random NPC with optional naming and saving')
      .addStringOption(option =>
        option.setName('tier')
          .setDescription('NPC tier')
          .setRequired(true)
          .addChoices(
            { name: 'Supporting Character', value: 'minion' },
            { name: 'Notable/Elite Supporting Character', value: 'toughened' },
            { name: 'Adversary', value: 'nemesis' }
          ))
      .addStringOption(option =>
        option.setName('concept')
          .setDescription('Primary concept/role (optional - will generate random if not provided)')
          .setRequired(false))
      .addBooleanOption(option =>
        option.setName('save')
          .setDescription('Save this NPC to the server (default: false)')
          .setRequired(false)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('list')
      .setDescription('List all NPCs in this server'))
  .addSubcommand(subcommand =>
    subcommand
      .setName('view')
      .setDescription('View detailed NPC information')
      .addStringOption(option =>
        option.setName('name')
          .setDescription('Name of the NPC to view')
          .setRequired(true)
          .setAutocomplete(true)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('edit')
      .setDescription('Edit NPC properties')
      .addStringOption(option =>
        option.setName('name')
          .setDescription('Name of the NPC to edit')
          .setRequired(true)
          .setAutocomplete(true))
      .addStringOption(option =>
        option.setName('field')
          .setDescription('Field to edit')
          .setRequired(true)
          .addChoices(
            { name: 'Name', value: 'name' },
            { name: 'Concept', value: 'concept' },
            { name: 'Description', value: 'description' },
            { name: 'Tier', value: 'tier' }
          ))
      .addStringOption(option =>
        option.setName('value')
          .setDescription('New value for the field')
          .setRequired(true)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('delete')
      .setDescription('Delete an NPC')
      .addStringOption(option =>
        option.setName('name')
          .setDescription('Name of the NPC to delete')
          .setRequired(true)
          .setAutocomplete(true)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('roll')
      .setDescription('Roll for an NPC')
      .addStringOption(option =>
        option.setName('name')
          .setDescription('Name of the NPC')
          .setRequired(true)
          .setAutocomplete(true))
      .addStringOption(option =>
        option.setName('type')
          .setDescription('Type of roll')
          .setRequired(true)
          .addChoices(
            { name: 'Basic Roll', value: 'basic' },
            { name: 'Skill Roll', value: 'skill' },
            { name: 'Skill + Drive (Nemesis only)', value: 'skill_drive' },
            { name: 'Attack', value: 'attack' },
            { name: 'Defend', value: 'defend' }
          ))
      .addIntegerOption(option =>
        option.setName('difficulty')
          .setDescription('Difficulty of the test (default: 2)')
          .setRequired(false)
          .setMinValue(1)
          .setMaxValue(5))
      .addStringOption(option =>
        option.setName('skill')
          .setDescription('Skill to use (for skill rolls)')
          .setRequired(false)
          .setAutocomplete(true))
      .addStringOption(option =>
        option.setName('drive')
          .setDescription('Drive to use (Nemesis NPCs only)')
          .setRequired(false)
          .setAutocomplete(true))
      .addStringOption(option =>
        option.setName('asset')
          .setDescription('Asset or weapon to use')
          .setRequired(false)
          .setAutocomplete(true))
      .addStringOption(option =>
        option.setName('description')
          .setDescription('Description of the action')
          .setRequired(false)));

// Helper function to generate NPC stats based on tier - now uses PrismaCharacterManager
function generateNPCStatsForTier(tier: 'minion' | 'toughened' | 'nemesis') {
  const baseAttributes = {
    muscle: 8,
    move: 8,
    intellect: 8,
    awareness: 8,
    communication: 8,
    discipline: 8
  };

  const baseSkills = [
    { name: 'Battle', value: 0 },
    { name: 'Communicate', value: 0 },
    { name: 'Discipline', value: 0 },
    { name: 'Move', value: 0 },
    { name: 'Understand', value: 0 }
  ];

  const baseAssets: any[] = [];
  const baseTraits: any[] = [];

  switch (tier) {
    case 'minion':
      // Minions have reduced stats
      Object.keys(baseAttributes).forEach(key => {
        baseAttributes[key as keyof typeof baseAttributes] = 6;
      });
      baseSkills.forEach(skill => skill.value = 1);
      break;
    case 'toughened':
      // Toughened NPCs have standard stats
      baseSkills.forEach(skill => skill.value = 2);
      break;
    case 'nemesis':
      // Nemesis NPCs have enhanced stats
      Object.keys(baseAttributes).forEach(key => {
        baseAttributes[key as keyof typeof baseAttributes] = 10;
      });
      baseSkills.forEach(skill => skill.value = 3);
      break;
  }

  return {
    attributes: baseAttributes,
    skills: baseSkills,
    assets: baseAssets,
    traits: baseTraits
  };
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const subcommand = interaction.options.getSubcommand();
  const member = interaction.member as GuildMember;

  if (!member || !interaction.guild) {
    await interaction.reply({
      content: '❌ This command can only be used in a server.',
      ephemeral: true
    });
    return;
  }

  try {
    switch (subcommand) {
      case 'create':
        await handleCreateNPC(interaction, member);
        break;
      case 'generate':
        await handleGenerateNPC(interaction, member);
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
      case 'delete':
        await handleDeleteNPC(interaction, member);
        break;
      case 'roll':
        await handleNPCRoll(interaction);
        break;
      default:
        await interaction.reply({
          content: '❌ Unknown subcommand.',
          ephemeral: true
        });
    }
  } catch (error) {
    logger.error('Error in NPC command:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply({
        content: `❌ Error: ${errorMessage}`
      });
    } else {
      await interaction.reply({
        content: `❌ Error: ${errorMessage}`,
        ephemeral: true
      });
    }
  }
}

async function handleCreateNPC(interaction: ChatInputCommandInteraction, member: GuildMember) {
  const name = interaction.options.getString('name', true);
  const concept = interaction.options.getString('concept', true);
  const tier = interaction.options.getString('tier', true);
  const description = interaction.options.getString('description');

  await interaction.deferReply();

  try {
    // Generate base stats for the tier using PrismaCharacterManager
    const baseStats = prismaCharacterManager.generateNPCStatsForTier(tier as 'minion' | 'toughened' | 'nemesis');
    
    // Create the NPC using Prisma
    const npc = await prismaCharacterManager.createNPC(
      name,
      [concept],
      tier as 'minion' | 'toughened' | 'nemesis',
      baseStats.attributes,
      baseStats.skills,
      baseStats.assets,
      baseStats.traits,
      baseStats.drives, // Include drives (empty for minion/toughened, populated for nemesis)
      member.id,
      description || undefined // Include description
    );

    const embed = new EmbedBuilder()
      .setColor(0x8B4513)
      .setTitle(`✅ NPC Created: ${npc.name}`)
      .setDescription(
        `**Concept:** ${concept}\n` +
        `**Tier:** ${tier}\n` +
        `**Created by:** <@${member.id}>`
      )
      .setFooter({ text: 'Use /npc view to see full stats' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
    logger.info(`NPC created: ${name} by ${member.user.tag}`);
  } catch (error) {
    logger.error('Error creating NPC:', error);
    throw error;
  }
}

async function handleGenerateNPC(interaction: ChatInputCommandInteraction, member: GuildMember) {
  const tier = interaction.options.getString('tier', true) as 'minion' | 'toughened' | 'nemesis';
  const concept = interaction.options.getString('concept');
  const shouldSave = interaction.options.getBoolean('save') || false;

  await interaction.deferReply();

  try {
    // Generate random concept if not provided
    const generatedConcept = concept || generateRandomConcept();
    
    // Generate base stats for the tier
    const baseStats = prismaCharacterManager.generateNPCStatsForTier(tier);
    
    // Add some randomization to make it more interesting
    const randomizedStats = addRandomizationToStats(baseStats, tier);
    
    // Generate a temporary name for display
    const tempName = generateTempNPCName(generatedConcept, tier);
    
    // Create the display embed
    const embed = new EmbedBuilder()
      .setColor(0x8B4513)
      .setTitle(`🎲 Generated ${tier.charAt(0).toUpperCase() + tier.slice(1)} NPC`)
      .setDescription(
        `**Concept:** ${generatedConcept}\n` +
        `**Tier:** ${tier}\n` +
        `**Suggested Name:** ${tempName}`
      )
      .addFields(
        { 
          name: '💪 Attributes', 
          value: `**Muscle:** ${randomizedStats.attributes.muscle} | **Move:** ${randomizedStats.attributes.move} | **Intellect:** ${randomizedStats.attributes.intellect}\n**Awareness:** ${randomizedStats.attributes.awareness} | **Communication:** ${randomizedStats.attributes.communication} | **Discipline:** ${randomizedStats.attributes.discipline}`,
          inline: false 
        }
      );

    if (randomizedStats.skills.length > 0) {
      const skillsText = randomizedStats.skills
        .filter((skill: any) => skill.value > 0)
        .map((skill: any) => `**${skill.name}:** ${skill.value}`)
        .join('\n') || 'None';
      embed.addFields({ name: '🎯 Skills', value: skillsText, inline: true });
    }

    if (randomizedStats.assets.length > 0) {
      const assetsText = randomizedStats.assets
        .map((asset: any) => `**${asset.name}** (${asset.type}): ${asset.description}`)
        .join('\n');
      embed.addFields({ name: '🎒 Assets', value: assetsText, inline: false });
    }

    if (randomizedStats.traits.length > 0) {
      const traitsText = randomizedStats.traits
        .map((trait: any) => `**${trait.name}** (${trait.type}): ${trait.description}`)
        .join('\n');
      embed.addFields({ name: '✨ Traits', value: traitsText, inline: false });
    }

    if (shouldSave) {
      // Save the NPC with the suggested name
      const savedNPC = await prismaCharacterManager.createNPC(
        tempName,
        [generatedConcept],
        tier,
        randomizedStats.attributes,
        randomizedStats.skills,
        randomizedStats.assets,
        randomizedStats.traits,
        randomizedStats.drives, // Include drives (empty for minion/toughened, populated for nemesis)
        member.id,
        undefined // No description for generated NPCs
      );
      
      embed.setFooter({ text: `✅ NPC saved as "${savedNPC.name}" | Use /npc view to see details` });
      logger.info(`Generated NPC saved: ${savedNPC.name} by ${member.user.tag}`);
    } else {
      // Create action buttons for saving with custom name or using as-is
      const saveButtons = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`save_generated_npc_${tier}_${generatedConcept}_${member.id}`)
            .setLabel('Save with Custom Name')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📝'),
          new ButtonBuilder()
            .setCustomId(`save_generated_npc_quick_${tier}_${generatedConcept}_${tempName}_${member.id}`)
            .setLabel(`Save as "${tempName}"`)
            .setStyle(ButtonStyle.Success)
            .setEmoji('💾'),
          new ButtonBuilder()
            .setCustomId('dismiss_generated_npc')
            .setLabel('Dismiss')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('❌')
        );
      
      embed.setFooter({ text: 'Use the buttons below to save this NPC or dismiss it' });
      
      await interaction.editReply({ embeds: [embed], components: [saveButtons] });
      return;
    }

    embed.setTimestamp();
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    logger.error('Error generating NPC:', error);
    throw error;
  }
}

async function handleListNPCs(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  try {
    const npcs = await prismaCharacterManager.getGuildNPCs(interaction.guild!.id);

    if (npcs.length === 0) {
      await interaction.editReply({
        content: '📝 No NPCs found in this server. Use `/npc create` to create one!'
      });
      return;
    }

    const npcList = npcs.map((npc: any, index: number) => {
      const tierEmoji = npc.tier === 'nemesis' ? '👑' : npc.tier === 'toughened' ? '🛡️' : '⚔️';
      return `${index + 1}. ${tierEmoji} **${npc.name}** (${getTierDisplayName(npc.tier)}) - *${npc.concepts.join(', ')}*`;
    }).join('\n');

    // Split into chunks if too long
    const chunks: string[] = [];
    const lines = npcList.split('\n');
    let currentChunk = '';
    
    lines.forEach((line: string, index: number) => {
      if (currentChunk.length + line.length > 1900) {
        chunks.push(currentChunk);
        currentChunk = line;
      } else {
        currentChunk += (currentChunk ? '\n' : '') + line;
      }
      
      if (index === lines.length - 1) {
        chunks.push(currentChunk);
      }
    });

    chunks.forEach((chunk: string, index: number) => {
      const embed = new EmbedBuilder()
        .setColor(0x8B4513)
        .setTitle(index === 0 ? `📋 NPCs in ${interaction.guild!.name}` : `📋 NPCs (continued)`)
        .setDescription(chunk)
        .setFooter({ text: `Page ${index + 1}/${chunks.length} • Use /npc view <name> for details` });

      if (index === 0) {
        interaction.editReply({ embeds: [embed] });
      } else {
        interaction.followUp({ embeds: [embed] });
      }
    });
  } catch (error) {
    logger.error('Error listing NPCs:', error);
    throw error;
  }
}

async function handleViewNPC(interaction: ChatInputCommandInteraction) {
  const npcName = interaction.options.getString('name', true);
  await interaction.deferReply();

  try {
    const npc = await prismaCharacterManager.getNPCByName(npcName);

    if (!npc) {
      await interaction.editReply({
        content: `❌ NPC "${npcName}" not found. Use \`/npc list\` to see available NPCs.`
      });
      return;
    }

    const embed = createNPCEmbed(npc);
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    logger.error('Error viewing NPC:', error);
    throw error;
  }
}

async function handleEditNPC(interaction: ChatInputCommandInteraction, member: GuildMember) {
  const npcName = interaction.options.getString('name', true);
  const field = interaction.options.getString('field', true);
  const value = interaction.options.getString('value', true);

  await interaction.deferReply();

  try {
    const npc = await prismaCharacterManager.getNPCByName(npcName);

    if (!npc) {
      await interaction.editReply({
        content: `❌ NPC "${npcName}" not found.`
      });
      return;
    }

    // Check permissions
    if (npc.createdBy !== member.id && !member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      await interaction.editReply({
        content: '❌ You can only edit NPCs you created, unless you have Manage Server permission.'
      });
      return;
    }

    // Handle tier changes specially - they require stat regeneration
    if (field === 'tier') {
      const newTier = value as 'minion' | 'toughened' | 'nemesis';
      if (!['minion', 'toughened', 'nemesis'].includes(newTier)) {
        await interaction.editReply({
          content: '❌ Invalid tier. Must be one of: minion, toughened, nemesis'
        });
        return;
      }

      // Generate new stats for the target tier
      const newStats = prismaCharacterManager.generateNPCStatsForTier(newTier);
      
      // Update the NPC with new tier and regenerated stats
      const updatedNPC = await prismaCharacterManager.updateNPC(
        npc.id, 
        'tier_change', 
        JSON.stringify({
          tier: newTier,
          attributes: newStats.attributes,
          skills: newStats.skills,
          drives: newStats.drives,
          assets: newStats.assets,
          traits: newStats.traits
        }), 
        member.id
      );

      const tierInfo = PrismaCharacterManager.getTierInfo(newTier);
      const embed = new EmbedBuilder()
        .setColor(tierInfo.color)
        .setTitle(`✅ NPC Tier Changed: ${npc.name}`)
        .setDescription(`**${npc.name}** has been upgraded/downgraded to **${getTierDisplayName(newTier)}** tier.\n\n${tierInfo.description}\n\n⚠️ **Stats have been regenerated** to match the new tier. Use \`/npc view ${npc.name}\` to see the updated stats.`)
        .addFields(
          { name: '🔄 Previous Tier', value: getTierDisplayName(npc.tier || 'unknown'), inline: true },
          { name: '🎯 New Tier', value: getTierDisplayName(newTier), inline: true },
          { name: '📊 Changes', value: newTier === 'nemesis' ? 'Added drives and enhanced stats' : newTier === 'minion' ? 'Simplified stats, removed drives' : 'Enhanced stats, no drives', inline: false }
        )
        .setFooter({ text: 'Tier change completed with stat regeneration' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } else {
      // Handle regular field updates
      await prismaCharacterManager.updateNPC(npc.id, field, value, member.id);

      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle(`✅ NPC Updated: ${npc.name}`)
        .setDescription(`**${field}** has been updated to: ${value}`)
        .setFooter({ text: 'Use /npc view to see all changes' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }
    logger.info(`NPC ${npc.name} updated by ${member.user.tag}: ${field} = ${value}`);
  } catch (error) {
    logger.error('Error editing NPC:', error);
    throw error;
  }
}

async function handleDeleteNPC(interaction: ChatInputCommandInteraction, member: GuildMember) {
  const npcName = interaction.options.getString('name', true);
  await interaction.deferReply();

  try {
    const npc = await prismaCharacterManager.getNPCByName(npcName);

    if (!npc) {
      await interaction.editReply({
        content: `❌ NPC "${npcName}" not found.`
      });
      return;
    }

    // Check permissions
    if (npc.createdBy !== member.id && !member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      await interaction.editReply({
        content: '❌ You can only delete NPCs you created, unless you have Manage Server permission.'
      });
      return;
    }

    await prismaCharacterManager.deleteNPC(npc.id, member.id);

    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle(`🗑️ NPC Deleted: ${npc.name}`)
      .setDescription(`**${npc.name}** has been permanently deleted.`)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
    logger.info(`NPC ${npc.name} deleted by ${member.user.tag}`);
  } catch (error) {
    logger.error('Error deleting NPC:', error);
    throw error;
  }
}

/**
 * Handle NPC roll commands with tier-specific behavior
 * - Minion/Toughened: Basic rolls using skill + attribute only
 * - Nemesis: Full rolls including skill + drive combinations
 * 
 * @param interaction - Discord slash command interaction
 */
async function handleNPCRoll(interaction: ChatInputCommandInteraction) {
  const npcName = interaction.options.getString('name', true);
  const rollType = interaction.options.getString('type', true);
  const difficulty = interaction.options.getInteger('difficulty') || 2;
  const skillName = interaction.options.getString('skill');
  const driveName = interaction.options.getString('drive');
  const assetName = interaction.options.getString('asset');
  const description = interaction.options.getString('description');

  await interaction.deferReply();

  try {
    const npc = await prismaCharacterManager.getNPCByName(npcName);

    if (!npc) {
      await interaction.editReply({
        content: `❌ NPC "${npcName}" not found.`
      });
      return;
    }

    let rollResult;
    let rollDescription = description || `${npc.name} attempts a ${rollType} roll`;

    // Create a mock character object for the DuneDiceEngine
    const mockCharacter = {
      attributes: npc.attributes,
      skills: npc.skills || [],
      drives: npc.drives || []
    };

    switch (rollType) {
      case 'basic':
        // For basic rolls, use a default attribute
        rollResult = DuneDiceEngine.performTest(
          mockCharacter as any,
          'awareness',
          '',
          { difficulty }
        );
        break;
        
      case 'skill':
        if (!skillName) {
          await interaction.editReply({
            content: '❌ Skill name is required for skill rolls.'
          });
          return;
        }
        
        const skill = npc.skills?.find((s: any) => s.name.toLowerCase() === skillName.toLowerCase());
        if (!skill) {
          await interaction.editReply({
            content: `❌ NPC ${npc.name} doesn't have the skill "${skillName}".`
          });
          return;
        }
        
        // Get the appropriate attribute for the skill
        const attributeName = getAttributeNameForSkill(skillName);
        rollResult = DuneDiceEngine.performTest(
          mockCharacter as any,
          attributeName,
          skillName,
          { difficulty }
        );
        rollDescription = `${npc.name} uses ${skillName} (${skill.value})`;
        break;
        
      case 'skill_drive':
        // Skill + Drive rolls are only available for Nemesis tier NPCs
        if (npc.tier !== 'nemesis') {
          await interaction.editReply({
            content: `❌ Skill + Drive rolls are only available for Nemesis tier NPCs. ${npc.name} is a ${npc.tier} tier NPC.`
          });
          return;
        }
        
        if (!skillName || !driveName) {
          await interaction.editReply({
            content: '❌ Both skill and drive are required for skill + drive rolls.'
          });
          return;
        }
        
        const skillForDrive = npc.skills?.find((s: any) => s.name.toLowerCase() === skillName.toLowerCase());
        if (!skillForDrive) {
          await interaction.editReply({
            content: `❌ NPC ${npc.name} doesn't have the skill "${skillName}".`
          });
          return;
        }
        
        const drive = npc.drives?.find((d: any) => d.name.toLowerCase() === driveName.toLowerCase());
        if (!drive) {
          await interaction.editReply({
            content: `❌ NPC ${npc.name} doesn't have the drive "${driveName}".`
          });
          return;
        }
        
        // For skill + drive rolls, use the drive name as the "skill" parameter in DuneDiceEngine
        const attributeForDrive = getAttributeNameForSkill(skillName);
        rollResult = DuneDiceEngine.performTest(
          mockCharacter as any,
          attributeForDrive,
          driveName, // Use drive name for the engine
          { difficulty }
        );
        rollDescription = `${npc.name} uses ${skillName} (${skillForDrive.value}) + ${driveName} (${drive.value})`;
        break;
        
      case 'attack':
        rollResult = DuneDiceEngine.performTest(
          mockCharacter as any,
          'muscle',
          'Battle',
          { difficulty }
        );
        rollDescription = `${npc.name} attacks`;
        break;
        
      case 'defend':
        rollResult = DuneDiceEngine.performTest(
          mockCharacter as any,
          'move',
          'Battle',
          { difficulty }
        );
        rollDescription = `${npc.name} defends`;
        break;
        
      default:
        await interaction.editReply({
          content: '❌ Invalid roll type.'
        });
        return;
    }

    const embed = new EmbedBuilder()
      .setColor(rollResult.success ? 0x00FF00 : 0xFF0000)
      .setTitle(`🎲 ${npc.name} - ${rollType.charAt(0).toUpperCase() + rollType.slice(1)} Roll`)
      .setDescription(rollDescription)
      .addFields(
        { name: '🎯 Difficulty', value: difficulty.toString(), inline: true },
        { name: '🎲 Dice Rolled', value: rollResult.rolls.join(', '), inline: true },
        { name: '✨ Successes', value: rollResult.successes.toString(), inline: true },
        { name: '📊 Result', value: rollResult.success ? '✅ **SUCCESS**' : '❌ **FAILURE**', inline: false }
      );

    if (rollResult.momentum > 0) {
      embed.addFields({ name: '⚡ Momentum Generated', value: rollResult.momentum.toString(), inline: true });
    }

    if (rollResult.complications > 0) {
      embed.addFields({ name: '⚠️ Complications', value: rollResult.complications.toString(), inline: true });
    }

    if (npc.avatarUrl) {
      embed.setThumbnail(npc.avatarUrl);
    }

    embed.setFooter({ text: `Tier: ${npc.tier} | Created by: ${npc.createdBy}` })
         .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    logger.error('Error with NPC roll:', error);
    throw error;
  }
}

function getAttributeNameForSkill(skillName: string): 'muscle' | 'move' | 'intellect' | 'awareness' | 'communication' | 'discipline' {
  const skill = skillName.toLowerCase();
  
  switch (skill) {
    case 'battle':
      return 'muscle';
    case 'communicate':
      return 'communication';
    case 'discipline':
      return 'discipline';
    case 'move':
      return 'move';
    case 'understand':
      return 'intellect';
    default:
      return 'awareness'; // Default fallback
  }
}

function createNPCEmbed(npc: any): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(0x8B4513)
    .setTitle(`📋 ${npc.name}`)
    .setDescription(`**Concepts:** ${npc.concepts.join(', ')}\n**Tier:** ${getTierDisplayName(npc.tier)}`)
    .addFields(
      { 
        name: '💪 Attributes', 
        value: `**Muscle:** ${npc.attributes.muscle || 'N/A'} | **Move:** ${npc.attributes.move || 'N/A'} | **Intellect:** ${npc.attributes.intellect || 'N/A'}\n**Awareness:** ${npc.attributes.awareness || 'N/A'} | **Communication:** ${npc.attributes.communication || 'N/A'} | **Discipline:** ${npc.attributes.discipline || 'N/A'}`,
        inline: false 
      }
    );

  if (npc.description) {
    embed.addFields({ name: '📝 Description', value: npc.description, inline: false });
  }

  if (npc.skills && npc.skills.length > 0) {
    const skillsText = npc.skills
      .filter((skill: any) => skill.value > 0)
      .map((skill: any) => `**${skill.name}:** ${skill.value}`)
      .join('\n') || 'None';
    embed.addFields({ name: '🎯 Skills', value: skillsText, inline: true });
  }

  if (npc.assets && npc.assets.length > 0) {
    const assetsText = npc.assets
      .map((asset: any) => `**${asset.name}** (${asset.type}): ${asset.description}`)
      .join('\n') || 'None';
    embed.addFields({ name: '🎒 Assets', value: assetsText, inline: false });
  }

  if (npc.traits && npc.traits.length > 0) {
    const traitsText = npc.traits
      .map((trait: any) => `**${trait.name}** (${trait.type}): ${trait.description}`)
      .join('\n') || 'None';
    embed.addFields({ name: '✨ Traits', value: traitsText, inline: false });
  }

  // Only show drives for Nemesis tier NPCs
  if (npc.tier === 'nemesis' && npc.drives && npc.drives.length > 0) {
    const drivesText = npc.drives
      .map((drive: any) => `**${drive.name}:** ${drive.value} - *${drive.statement}*`)
      .join('\n') || 'None';
    embed.addFields({ name: '🔥 Drives', value: drivesText, inline: false });
  }

  if (npc.avatarUrl) {
    embed.setThumbnail(npc.avatarUrl);
  }

  embed.setFooter({ text: `Created by: ${npc.createdBy} | Use /npc roll to make rolls for this NPC` })
       .setTimestamp(new Date(npc.createdAt));

  return embed;
}

export async function autocomplete(interaction: any) {
  const focusedOption = interaction.options.getFocused(true);
  
  if (focusedOption.name === 'name') {
    try {
      const npcs = await prismaCharacterManager.getGuildNPCs(interaction.guild.id);
      const filtered = npcs
        .filter((npc: any) => npc.name.toLowerCase().includes(focusedOption.value.toLowerCase()))
        .slice(0, 25)
        .map((npc: any) => ({
          name: `${npc.name} (${getTierDisplayName(npc.tier)})`,
          value: npc.name
        }));
      
      await interaction.respond(filtered);
    } catch (error) {
      logger.error('Error in NPC autocomplete:', error);
      await interaction.respond([]);
    }
  } else if (focusedOption.name === 'skill' || focusedOption.name === 'asset' || focusedOption.name === 'drive') {
    try {
      // Get the selected NPC name from the command options
      const npcName = interaction.options.getString('name');
      if (!npcName) {
        await interaction.respond([]);
        return;
      }

      const npc = await prismaCharacterManager.getNPCByName(npcName);
      if (!npc) {
        await interaction.respond([]);
        return;
      }

      let options: { name: string; value: string }[] = [];

      if (focusedOption.name === 'skill') {
        // Filter skills that have a value > 0
        options = (npc.skills || [])
          .filter((skill: any) => skill.value > 0 && skill.name.toLowerCase().includes(focusedOption.value.toLowerCase()))
          .slice(0, 25)
          .map((skill: any) => ({
            name: `${skill.name} (${skill.value})`,
            value: skill.name
          }));
      } else if (focusedOption.name === 'asset') {
        // Filter assets/weapons
        options = (npc.assets || [])
          .filter((asset: any) => asset.name.toLowerCase().includes(focusedOption.value.toLowerCase()))
          .slice(0, 25)
          .map((asset: any) => ({
            name: `${asset.name} (${asset.type})`,
            value: asset.name
          }));
      } else if (focusedOption.name === 'drive') {
        // Filter drives - only available for Nemesis tier NPCs
        if (npc.tier === 'nemesis') {
          options = (npc.drives || [])
            .filter((drive: any) => drive.name.toLowerCase().includes(focusedOption.value.toLowerCase()))
            .slice(0, 25)
            .map((drive: any) => ({
              name: `${drive.name} (${drive.value})`,
              value: drive.name
            }));
        } else {
          // No drives available for non-Nemesis NPCs
          options = [{
            name: `Drives only available for Nemesis tier NPCs (${npc.name} is ${getTierDisplayName(npc.tier)})`,
            value: 'unavailable'
          }];
        }
      }

      await interaction.respond(options);
    } catch (error) {
      logger.error(`Error in NPC ${focusedOption.name} autocomplete:`, error);
      await interaction.respond([]);
    }
  }
}

// Helper functions for NPC generation
function generateRandomConcept(): string {
  const concepts = [
    'Guard', 'Merchant', 'Spy', 'Assassin', 'Noble', 'Servant', 'Pilot', 'Engineer',
    'Medic', 'Soldier', 'Scout', 'Diplomat', 'Smuggler', 'Bounty Hunter', 'Cultist',
    'Fremen Warrior', 'House Retainer', 'Mentat', 'Bene Gesserit Adept', 'Guild Navigator',
    'Suk Doctor', 'Swordmaster', 'Desert Guide', 'Spice Worker', 'Tech Adept',
    'Information Broker', 'Cantina Owner', 'Starport Official', 'Customs Inspector'
  ];
  return concepts[Math.floor(Math.random() * concepts.length)];
}

function generateTempNPCName(concept: string, tier: string): string {
  const prefixes = {
    minion: ['', 'Young', 'Junior', 'Novice'],
    toughened: ['', 'Veteran', 'Senior', 'Experienced'],
    nemesis: ['Master', 'Lord', 'Commander', 'Chief']
  };
  
  const names = [
    'Alexei', 'Dmitri', 'Katya', 'Anya', 'Boris', 'Natasha', 'Viktor', 'Elena',
    'Hassan', 'Farid', 'Zara', 'Amara', 'Rashid', 'Layla', 'Omar', 'Yasmin',
    'Chen', 'Li', 'Wei', 'Mei', 'Jin', 'Xiao', 'Feng', 'Ling',
    'Marcus', 'Julia', 'Gaius', 'Livia', 'Cassius', 'Octavia', 'Brutus', 'Claudia'
  ];
  
  const tierPrefixes = prefixes[tier as keyof typeof prefixes] || prefixes.toughened;
  const prefix = tierPrefixes[Math.floor(Math.random() * tierPrefixes.length)];
  const name = names[Math.floor(Math.random() * names.length)];
  
  return prefix ? `${prefix} ${name}` : name;
}

function addRandomizationToStats(baseStats: any, tier: string) {
  const randomized = JSON.parse(JSON.stringify(baseStats)); // Deep clone
  
  // Add some random variation to attributes (±1)
  Object.keys(randomized.attributes).forEach(attr => {
    const variation = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
    randomized.attributes[attr] = Math.max(4, Math.min(12, randomized.attributes[attr] + variation));
  });
  
  // Add some random skills based on tier
  const additionalSkills = ['Stealth', 'Survival', 'Technology', 'Lore'];
  const numAdditionalSkills = tier === 'nemesis' ? 2 : tier === 'toughened' ? 1 : 0;
  
  for (let i = 0; i < numAdditionalSkills; i++) {
    const skillIndex = Math.floor(Math.random() * additionalSkills.length);
    const skillName = additionalSkills.splice(skillIndex, 1)[0];
    const skillValue = tier === 'nemesis' ? Math.floor(Math.random() * 3) + 2 : Math.floor(Math.random() * 2) + 1;
    
    randomized.skills.push({ name: skillName, value: skillValue });
  }
  
  // Add some random assets based on tier
  if (tier === 'toughened' || tier === 'nemesis') {
    const weapons = [
      { name: 'Kindjal', type: 'Weapon', description: 'Traditional curved blade' },
      { name: 'Lasgun', type: 'Weapon', description: 'Energy weapon' },
      { name: 'Maula Pistol', type: 'Weapon', description: 'Spring-loaded dart gun' }
    ];
    
    const equipment = [
      { name: 'Stillsuit', type: 'Equipment', description: 'Desert survival gear' },
      { name: 'Personal Shield', type: 'Equipment', description: 'Defensive energy field' },
      { name: 'Comm Unit', type: 'Equipment', description: 'Communication device' }
    ];
    
    // Add 1-2 random items
    const allItems = [...weapons, ...equipment];
    const numItems = Math.floor(Math.random() * 2) + 1;
    
    for (let i = 0; i < numItems && allItems.length > 0; i++) {
      const itemIndex = Math.floor(Math.random() * allItems.length);
      randomized.assets.push(allItems.splice(itemIndex, 1)[0]);
    }
  }
  
  // Add traits for nemesis tier
  if (tier === 'nemesis') {
    const traits = [
      { name: 'Commanding Presence', type: 'Social', description: 'Inspires fear and respect' },
      { name: 'Combat Veteran', type: 'Combat', description: 'Experienced in battle' },
      { name: 'Strategic Mind', type: 'Mental', description: 'Excellent tactical thinking' }
    ];
    
    const numTraits = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < numTraits && traits.length > 0; i++) {
      const traitIndex = Math.floor(Math.random() * traits.length);
      randomized.traits.push(traits.splice(traitIndex, 1)[0]);
    }
  }
  
  return randomized;
}

// Export handler functions for bot.ts integration
export async function handleSaveGeneratedNPC(interaction: any) {
  // This function would handle saving generated NPCs from other commands
  // Implementation depends on the specific NPC generation workflow
  await interaction.reply({
    content: '✅ NPC generation and saving functionality is now available through `/npc create`!',
    ephemeral: true
  });
}

export async function handleSaveNPCNameModal(interaction: any, member: GuildMember) {
  // This function would handle NPC name modals
  // Implementation depends on the specific modal workflow
  await interaction.reply({
    content: '✅ NPC naming functionality is now available through `/npc edit`!',
    ephemeral: true
  });
}
