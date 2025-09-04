import {
  ButtonInteraction,
  StringSelectMenuInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} from 'discord.js';
import { ModulesRepository } from '../services/modules-repository';
import { prisma } from '../utils/prisma';
import { moduleLogger } from '../utils/module-logger';
import { CampaignState } from '../types/module-types';

const modulesRepository = new ModulesRepository(prisma);

/**
 * Handle all module-related button and select menu interactions
 */
export async function handleModuleInteractions(
  interaction: ButtonInteraction | StringSelectMenuInteraction
): Promise<void> {
  const customId = interaction.customId;
  
  moduleLogger.info({
    userId: interaction.user.id,
    guildId: interaction.guildId || undefined,
    channelId: interaction.channelId,
    customId: customId
  }, 'Module interaction received');

  try {
    // Button interactions
    if (interaction.isButton()) {
      if (customId.startsWith('load_module:')) {
        await handleLoadModule(interaction);
      } else if (customId.startsWith('view_scenes:')) {
        await handleViewScenes(interaction);
      } else if (customId.startsWith('view_npcs:')) {
        await handleViewNPCs(interaction);
      } else if (customId === 'scene_next') {
        await handleSceneNext(interaction);
      } else if (customId === 'scene_previous') {
        await handleScenePrevious(interaction);
      } else if (customId.startsWith('scene_npcs:')) {
        await handleSceneNPCs(interaction);
      } else if (customId.startsWith('scene_handouts:')) {
        await handleSceneHandouts(interaction);
      }
    }
    
    // Select menu interactions
    else if (interaction.isStringSelectMenu()) {
      if (customId === 'module_select') {
        await handleModuleSelect(interaction);
      } else if (customId === 'npc_select') {
        await handleNPCSelect(interaction);
      } else if (customId === 'handout_select') {
        await handleHandoutSelect(interaction);
      } else if (customId === 'scene_handout_distribute') {
        await handleSceneHandoutDistribute(interaction);
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    moduleLogger.error({
      userId: interaction.user.id,
      guildId: interaction.guildId || undefined,
      channelId: interaction.channelId,
      customId: customId,
      error: errorMessage
    }, 'Module interaction failed');

    const content = 'An error occurred while processing your request.';
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply({ content });
    } else {
      await interaction.reply({ content, ephemeral: true });
    }
  }
}

async function handleLoadModule(interaction: ButtonInteraction): Promise<void> {
  const moduleSlug = interaction.customId.split(':')[1];
  await interaction.deferReply();

  const module = await modulesRepository.getModuleBySlug(moduleSlug);
  if (!module) {
    await interaction.editReply({ content: 'Module not found.' });
    return;
  }

  // Get module scenes to find the first scene
  const scenes = await modulesRepository.getModuleScenes(module.id);
  if (scenes.length === 0) {
    await interaction.editReply({ content: 'This module has no scenes to load.' });
    return;
  }

  // Sort scenes by act and order to find the first scene
  const firstScene = scenes.sort((a, b) => {
    const actA = Number(a.act);
    const actB = Number(b.act);
    if (actA !== actB) return actA - actB;
    return Number(a.order) - Number(b.order);
  })[0];

  // Create or update campaign state
  const campaignState: CampaignState = {
    channelId: interaction.channelId,
    currentModuleId: module.id,
    currentSceneId: firstScene.id,
    sceneHistory: [],
    progressTracks: [],
    gmNotes: [],
    loadedAt: new Date(),
    lastAdvancedAt: new Date()
  };

  await modulesRepository.createOrUpdateCampaignState(campaignState);

  const embed = new EmbedBuilder()
    .setTitle(`🚀 Module Loaded: ${module.title}`)
    .setDescription(`Successfully loaded **${module.title}** by ${module.authors.join(', ')}`)
    .setColor(0x00FF00)
    .addFields(
      {
        name: '🎬 Starting Scene',
        value: `**${firstScene.title}**\nAct ${firstScene.act}, Scene ${firstScene.order}`,
        inline: true
      },
      {
        name: '📚 Total Scenes',
        value: scenes.length.toString(),
        inline: true
      }
    )
    .setTimestamp();

  const actionRow = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('scene_current')
        .setLabel('View Current Scene')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🎬'),
      new ButtonBuilder()
        .setCustomId(`view_scenes:${module.slug}`)
        .setLabel('All Scenes')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📝'),
      new ButtonBuilder()
        .setCustomId(`view_npcs:${module.slug}`)
        .setLabel('NPCs')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('👥')
    );

  await interaction.editReply({
    embeds: [embed],
    components: [actionRow]
  });

  moduleLogger.info({
    userId: interaction.user.id,
    guildId: interaction.guildId || undefined,
    channelId: interaction.channelId,
    moduleId: module.id,
    moduleSlug: module.slug,
    sceneId: firstScene.id
  }, 'Module loaded successfully');
}

async function handleViewScenes(interaction: ButtonInteraction): Promise<void> {
  const moduleSlug = interaction.customId.split(':')[1];
  await interaction.deferReply({ ephemeral: true });

  const module = await modulesRepository.getModuleBySlug(moduleSlug);
  if (!module) {
    await interaction.editReply({ content: 'Module not found.' });
    return;
  }

  const scenes = await modulesRepository.getModuleScenes(module.id);
  if (scenes.length === 0) {
    await interaction.editReply({ content: 'This module has no scenes.' });
    return;
  }

  // Group scenes by act
  const scenesByAct = scenes.reduce((acc, scene) => {
    const actNumber = Number(scene.act);
    if (!acc[actNumber]) acc[actNumber] = [];
    acc[actNumber].push(scene);
    return acc;
  }, {} as Record<number, typeof scenes>);

  const embed = new EmbedBuilder()
    .setTitle(`📝 Scenes: ${module.title}`)
    .setDescription(`Total of **${scenes.length}** scenes`)
    .setColor(0xD4AF37)
    .setTimestamp();

  // Add fields for each act
  Object.entries(scenesByAct).forEach(([act, actScenes]) => {
    const sceneList = actScenes
      .sort((a, b) => a.order - b.order)
      .map(scene => `${scene.order}. ${scene.title}`)
      .join('\n');

    embed.addFields({
      name: `🎭 Act ${act}`,
      value: sceneList,
      inline: false
    });
  });

  await interaction.editReply({ embeds: [embed] });
}

async function handleViewNPCs(interaction: ButtonInteraction): Promise<void> {
  const moduleSlug = interaction.customId.split(':')[1];
  await interaction.deferReply({ ephemeral: true });

  const module = await modulesRepository.getModuleBySlug(moduleSlug);
  if (!module) {
    await interaction.editReply({ content: 'Module not found.' });
    return;
  }

  const npcs = await modulesRepository.getModuleNPCs(module.id);
  if (npcs.length === 0) {
    await interaction.editReply({ content: 'This module has no NPCs.' });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(`👥 NPCs: ${module.title}`)
    .setDescription(`Total of **${npcs.length}** NPCs`)
    .setColor(0xD4AF37)
    .setTimestamp();

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

  await interaction.editReply({ embeds: [embed] });
}

async function handleSceneNext(interaction: ButtonInteraction): Promise<void> {
  await interaction.deferUpdate();

  const campaignState = await modulesRepository.getCampaignState(
    interaction.channelId
  );
  
  if (!campaignState?.currentSceneId) {
    return;
  }

  const currentScene = await modulesRepository.getSceneById(campaignState.currentSceneId);
  if (!currentScene?.nextSceneId) {
    return;
  }

  const nextScene = await modulesRepository.getSceneById(currentScene.nextSceneId);
  if (!nextScene) {
    return;
  }

  // Update campaign state
  const updatedState: CampaignState = {
    ...campaignState,
    currentSceneId: nextScene.id,
    sceneHistory: [...campaignState.sceneHistory, campaignState.currentSceneId],
    lastAdvancedAt: new Date()
  };

  await modulesRepository.createOrUpdateCampaignState(updatedState);

  // Update the message with new scene info - this would need to be implemented
  // based on the specific embed structure of the scene display
}

async function handleScenePrevious(interaction: ButtonInteraction): Promise<void> {
  await interaction.deferUpdate();

  const campaignState = await modulesRepository.getCampaignState(
    interaction.channelId
  );
  
  if (!campaignState?.sceneHistory.length) {
    return;
  }

  const previousSceneId = campaignState.sceneHistory[campaignState.sceneHistory.length - 1];
  const previousScene = await modulesRepository.getSceneById(previousSceneId);
  
  if (!previousScene) {
    return;
  }

  // Update campaign state
  const updatedState: CampaignState = {
    ...campaignState,
    currentSceneId: previousScene.id,
    sceneHistory: campaignState.sceneHistory.slice(0, -1),
    lastAdvancedAt: new Date()
  };

  await modulesRepository.createOrUpdateCampaignState(updatedState);
}

async function handleSceneNPCs(interaction: ButtonInteraction): Promise<void> {
  const sceneId = interaction.customId.split(':')[1];
  await interaction.deferReply({ ephemeral: true });

  const scene = await modulesRepository.getSceneById(sceneId);
  if (!scene?.npcs || scene.npcs.length === 0) {
    await interaction.editReply({ content: 'No NPCs in this scene.' });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(`👥 Scene NPCs: ${scene.title}`)
    .setDescription(`NPCs present in this scene: ${scene.npcs.join(', ')}`)
    .setColor(0xD4AF37);

  await interaction.editReply({ embeds: [embed] });
}

async function handleSceneHandouts(interaction: ButtonInteraction): Promise<void> {
  const sceneId = interaction.customId.split(':')[1];
  await interaction.deferReply({ ephemeral: true });

  const scene = await modulesRepository.getSceneById(sceneId);
  if (!scene?.handouts || scene.handouts.length === 0) {
    await interaction.editReply({ content: 'No handouts in this scene.' });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(`📄 Scene Handouts: ${scene.title}`)
    .setDescription(`Available handouts: ${scene.handouts.join(', ')}`)
    .setColor(0xD4AF37);

  await interaction.editReply({ embeds: [embed] });
}

async function handleModuleSelect(interaction: StringSelectMenuInteraction): Promise<void> {
  const selectedSlug = interaction.values[0];
  await interaction.deferUpdate();

  const module = await modulesRepository.getModuleBySlug(selectedSlug);
  if (!module) {
    return;
  }

  // This would update the original message with module details
  // Implementation depends on the specific embed structure needed
}

async function handleNPCSelect(interaction: StringSelectMenuInteraction): Promise<void> {
  const npcName = interaction.values[0];
  await interaction.deferReply({ ephemeral: true });

  const campaignState = await modulesRepository.getCampaignState(
    interaction.channelId
  );
  
  if (!campaignState?.currentModuleId) {
    await interaction.editReply({ content: 'No active module.' });
    return;
  }

  const npc = await modulesRepository.getNPCByName(campaignState.currentModuleId, npcName);
  if (!npc) {
    await interaction.editReply({ content: 'NPC not found.' });
    return;
  }

  // Create detailed NPC embed - implementation would depend on NPC display format
  const embed = new EmbedBuilder()
    .setTitle(`${npc.gmOnly ? '🔒 ' : '👤 '}${npc.name}`)
    .setColor(npc.gmOnly ? 0xFF6B6B : 0xD4AF37);

  if (npc.role) {
    embed.addFields({ name: '🎭 Role', value: npc.role, inline: true });
  }

  await interaction.editReply({ embeds: [embed] });
}

async function handleHandoutSelect(interaction: StringSelectMenuInteraction): Promise<void> {
  const handoutId = interaction.values[0];
  await interaction.deferReply({ ephemeral: true });

  const handout = await modulesRepository.getHandoutById(handoutId);
  if (!handout) {
    await interaction.editReply({ content: 'Handout not found.' });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(`📄 ${handout.title}`)
    .setColor(0xD4AF37);

  if (handout.body) {
    embed.setDescription(handout.body);
  }

  if (handout.gmNotes) {
    embed.addFields({
      name: '🎯 GM Notes',
      value: handout.gmNotes.length > 1000 
        ? handout.gmNotes.substring(0, 1000) + '...'
        : handout.gmNotes,
      inline: false
    });
  }

  const actionRow = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`distribute_handout:${handout.id}`)
        .setLabel('Distribute to Players')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📤')
    );

  await interaction.editReply({ embeds: [embed], components: [actionRow] });
}

async function handleSceneHandoutDistribute(interaction: StringSelectMenuInteraction): Promise<void> {
  const handoutId = interaction.values[0];
  await interaction.deferReply();

  const handout = await modulesRepository.getHandoutById(handoutId);
  if (!handout) {
    await interaction.editReply({ content: 'Handout not found.' });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(`📄 ${handout.name}`)
    .setColor(0xD4AF37)
    .setFooter({ 
      text: `Distributed by ${interaction.user.displayName}`,
      iconURL: interaction.user.displayAvatarURL()
    });

  if (handout.description) {
    embed.setDescription(handout.description);
  }

  await interaction.editReply({
    content: `📄 **Handout Distributed:** ${handout.name}`,
    embeds: [embed]
  });

  moduleLogger.info({
    userId: interaction.user.id,
    channelId: interaction.channelId,
    handoutId: handout.id,
    handoutName: handout.name,
    public: true
  }, 'Scene handout distributed');
}
