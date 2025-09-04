import { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  StringSelectMenuBuilder,
  ChatInputCommandInteraction 
} from 'discord.js';
import { Command } from '../interfaces/command';
import { ModulesRepository } from '../services/modules-repository';
import { prisma } from '../utils/prisma-client';
import { moduleLogger } from '../utils/module-logger';
import { NPC } from '../types/module-types';

const modulesRepository = new ModulesRepository(prisma);

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('module-npc')
    .setDescription('View and manage module NPCs')
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all NPCs in the current module')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View detailed information about a specific NPC')
        .addStringOption(option =>
          option
            .setName('npc')
            .setDescription('NPC to view')
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('scene')
        .setDescription('List NPCs present in the current scene')
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();
    
    moduleLogger.commandStart({
      userId: interaction.user.id,
      channelId: interaction.channelId,
      command: `module-npc ${subcommand}`
    });

    try {
      switch (subcommand) {
        case 'list':
          await handleListNPCs(interaction);
          break;
        case 'view':
          await handleViewNPC(interaction);
          break;
        case 'scene':
          await handleSceneNPCs(interaction);
          break;
        default:
          await interaction.reply({ content: 'Unknown subcommand.', ephemeral: true });
      }
      
      moduleLogger.commandSuccess({
        userId: interaction.user.id,
        channelId: interaction.channelId,
        command: `module-npc ${subcommand}`
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      moduleLogger.error({
        userId: interaction.user.id,
        channelId: interaction.channelId,
        command: `module-npc ${subcommand}`,
        error: errorMessage
      }, 'Module NPC command execution failed');

      const content = 'An error occurred while processing the NPC command.';
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply({ content });
      } else {
        await interaction.reply({ content, ephemeral: true });
      }
    }
  },

  async autocomplete(interaction) {
    try {
      const campaignState = await modulesRepository.getCampaignState(
        interaction.channelId
      );
      
      if (!campaignState?.currentModuleId) {
        await interaction.respond([]);
        return;
      }

      const npcs = await modulesRepository.getModuleNPCs(campaignState.currentModuleId);
      const focusedValue = interaction.options.getFocused();
      
      const filtered = npcs
        .filter(npc => 
          npc.name.toLowerCase().includes(focusedValue.toLowerCase()) ||
          npc.role?.toLowerCase().includes(focusedValue.toLowerCase())
        )
        .slice(0, 25);

      await interaction.respond(
        filtered.map(npc => ({
          name: `${npc.name}${npc.role ? ` (${npc.role})` : ''}`,
          value: npc.name
        }))
      );
    } catch (error) {
      moduleLogger.error({
        userId: interaction.user.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'Module NPC autocomplete failed');
      
      await interaction.respond([]);
    }
  }
};

async function handleListNPCs(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const campaignState = await modulesRepository.getCampaignState(
    interaction.channelId
  );
  
  if (!campaignState?.currentModuleId) {
    await interaction.editReply({
      content: 'No active module. Load a module first.',
    });
    return;
  }

  const npcs = await modulesRepository.getModuleNPCs(campaignState.currentModuleId);
  
  if (npcs.length === 0) {
    await interaction.editReply({
      content: 'No NPCs found in the current module.',
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('👥 Module NPCs')
    .setDescription(`Found **${npcs.length}** NPCs in the current module.`)
    .setColor(0xD4AF37)
    .setTimestamp();

  // Group NPCs by role or show all
  const publicNPCs = npcs.filter(npc => !npc.gmOnly);
  const secretNPCs = npcs.filter(npc => npc.gmOnly);

  if (publicNPCs.length > 0) {
    const npcList = publicNPCs
      .map(npc => `**${npc.name}**${npc.role ? ` - ${npc.role}` : ''}`)
      .join('\n');
    
    embed.addFields({
      name: '👁️ Public NPCs',
      value: npcList.length > 1000 ? npcList.substring(0, 1000) + '...' : npcList,
      inline: false
    });
  }

  if (secretNPCs.length > 0) {
    const secretList = secretNPCs
      .map(npc => `**${npc.name}**${npc.role ? ` - ${npc.role}` : ''}`)
      .join('\n');
    
    embed.addFields({
      name: '🔒 GM-Only NPCs',
      value: secretList.length > 1000 ? secretList.substring(0, 1000) + '...' : secretList,
      inline: false
    });
  }

  // Create selection menu for detailed view
  if (npcs.length <= 25) {
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('npc_select')
      .setPlaceholder('Choose an NPC to view details')
      .addOptions(
        npcs.map(npc => ({
          label: npc.name,
          description: npc.role || 'No role specified',
          value: npc.name,
          emoji: npc.gmOnly ? '🔒' : '👤'
        }))
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(selectMenu);

    await interaction.editReply({
      embeds: [embed],
      components: [row]
    });
  } else {
    await interaction.editReply({ embeds: [embed] });
  }
}

async function handleViewNPC(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const npcName = interaction.options.getString('npc', true);
  const campaignState = await modulesRepository.getCampaignState(
    interaction.channelId
  );
  
  if (!campaignState?.currentModuleId) {
    await interaction.editReply({
      content: 'No active module.',
    });
    return;
  }

  const npc = await modulesRepository.getNPCByName(campaignState.currentModuleId, npcName);
  
  if (!npc) {
    await interaction.editReply({
      content: `NPC "${npcName}" not found in the current module.`,
    });
    return;
  }

  const embed = createNPCDetailEmbed(npc);
  
  await interaction.editReply({ embeds: [embed] });
}

async function handleSceneNPCs(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const campaignState = await modulesRepository.getCampaignState(
    interaction.channelId
  );
  
  if (!campaignState?.currentSceneId) {
    await interaction.editReply({
      content: 'No active scene.',
    });
    return;
  }

  const scene = await modulesRepository.getSceneById(campaignState.currentSceneId);
  
  if (!scene?.npcs || scene.npcs.length === 0) {
    await interaction.editReply({
      content: 'No NPCs present in the current scene.',
    });
    return;
  }

  // Get detailed NPC information
  const npcDetails = await Promise.all(
    scene.npcs.map(npcName => 
      modulesRepository.getNPCByName(campaignState.currentModuleId!, npcName)
    )
  );

  const validNPCs = npcDetails.filter(npc => npc !== null) as NPC[];

  if (validNPCs.length === 0) {
    await interaction.editReply({
      content: 'NPC details not found for the current scene.',
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(`👥 Scene NPCs: ${scene.title}`)
    .setDescription(`NPCs present in this scene:`)
    .setColor(0xD4AF37)
    .setTimestamp();

  // Add NPC summaries
  validNPCs.forEach(npc => {
    if (!npc.gmOnly || interaction.memberPermissions?.has('ManageChannels')) {
      const summary = [
        npc.role && `**Role:** ${npc.role}`,
        npc.motivation && `**Motivation:** ${npc.motivation}`,
        npc.traits && npc.traits.length > 0 && `**Traits:** ${npc.traits.slice(0, 3).join(', ')}`
      ].filter(Boolean).join('\n');

      embed.addFields({
        name: `${npc.gmOnly ? '🔒 ' : ''}${npc.name}`,
        value: summary || 'No additional details',
        inline: true
      });
    }
  });

  await interaction.editReply({ embeds: [embed] });
}

function createNPCDetailEmbed(npc: NPC): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(`${npc.gmOnly ? '🔒 ' : '👤 '}${npc.name}`)
    .setColor(npc.gmOnly ? 0xFF6B6B : 0xD4AF37)
    .setTimestamp();

  if (npc.role) {
    embed.addFields({
      name: '🎭 Role',
      value: npc.role,
      inline: true
    });
  }

  if (npc.motivation) {
    embed.addFields({
      name: '🎯 Motivation',
      value: npc.motivation,
      inline: true
    });
  }

  if (npc.traits && npc.traits.length > 0) {
    embed.addFields({
      name: '✨ Traits',
      value: npc.traits.join('\n• '),
      inline: false
    });
  }

  if (npc.bonds && npc.bonds.length > 0) {
    embed.addFields({
      name: '🔗 Bonds',
      value: npc.bonds.join('\n• '),
      inline: false
    });
  }

  if (npc.secrets && npc.secrets.length > 0 && npc.gmOnly) {
    embed.addFields({
      name: '🤫 Secrets',
      value: npc.secrets.join('\n• '),
      inline: false
    });
  }

  if (npc.statBlock) {
    const statPreview = typeof npc.statBlock === 'string' 
      ? npc.statBlock.substring(0, 500) + (npc.statBlock.length > 500 ? '...' : '')
      : JSON.stringify(npc.statBlock).substring(0, 500);
    
    embed.addFields({
      name: '📊 Stats',
      value: `\`\`\`${statPreview}\`\`\``,
      inline: false
    });
  }

  if (npc.gmOnly) {
    embed.setFooter({ text: '🔒 GM-Only Information' });
  }

  return embed;
}
