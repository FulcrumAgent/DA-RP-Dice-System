import { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  ComponentType,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  AutocompleteInteraction
} from 'discord.js';
import { Command } from '../interfaces/command';
import { ModulesRepository } from '../services/modules-repository';
import { prisma } from '../utils/prisma-client';
import { moduleLogger } from '../utils/module-logger';
import { Scene, CampaignState } from '../types/module-types';

const modulesRepository = new ModulesRepository(prisma);

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('scene')
    .setDescription('Navigate through module scenes (GM only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand(subcommand =>
      subcommand
        .setName('current')
        .setDescription('Display the current scene')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('next')
        .setDescription('Advance to the next scene')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('previous')
        .setDescription('Go back to the previous scene')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('jump')
        .setDescription('Jump to a specific scene')
        .addStringOption(option =>
          option
            .setName('scene')
            .setDescription('Scene to jump to')
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all scenes in the current module')
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();
    
    moduleLogger.commandStart({
      userId: interaction.user.id,
      channelId: interaction.channelId,
      command: `scene ${subcommand}`
    });

    try {
      switch (subcommand) {
        case 'current':
          await handleCurrentScene(interaction);
          break;
        case 'next':
          await handleNextScene(interaction);
          break;
        case 'previous':
          await handlePreviousScene(interaction);
          break;
        case 'jump':
          await handleJumpToScene(interaction);
          break;
        case 'list':
          await handleListScenes(interaction);
          break;
        default:
          await interaction.reply({ content: 'Unknown subcommand.', ephemeral: true });
      }
      
      moduleLogger.commandSuccess({
        userId: interaction.user.id,
        channelId: interaction.channelId,
        command: `scene ${subcommand}`
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      moduleLogger.error({
        userId: interaction.user.id,
        channelId: interaction.channelId,
        command: `scene ${subcommand}`,
        error: errorMessage
      }, 'Scene command execution failed');

      const content = 'An error occurred while processing the scene command.';
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply({ content });
      } else {
        await interaction.reply({ content, ephemeral: true });
      }
    }
  },

  async autocomplete(interaction: AutocompleteInteraction) {
    try {
      const campaignState = await modulesRepository.getCampaignState(
        interaction.channelId
      );
      
      if (!campaignState?.currentModuleId) {
        await interaction.respond([]);
        return;
      }

      const scenes = await modulesRepository.getModuleScenes(campaignState.currentModuleId);
      const focusedValue = interaction.options.getFocused();
      
      const filtered = scenes
        .filter(scene => 
          scene.title.toLowerCase().includes(focusedValue.toLowerCase())
        )
        .slice(0, 25);

      await interaction.respond(
        filtered.map(scene => ({
          name: `Act ${scene.act}, Scene ${scene.order}: ${scene.title}`,
          value: scene.id
        }))
      );
    } catch (error) {
      moduleLogger.error({
        userId: interaction.user.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'Scene autocomplete failed');
      
      await interaction.respond([]);
    }
  }
};

async function handleCurrentScene(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const campaignState = await modulesRepository.getCampaignState(
    interaction.channelId
  );
  
  if (!campaignState?.currentSceneId) {
    await interaction.editReply({
      content: 'No active scene. Use `/modules browse` to load a module first.',
    });
    return;
  }

  const scene = await modulesRepository.getSceneById(campaignState.currentSceneId);
  if (!scene) {
    await interaction.editReply({
      content: 'Current scene not found. The campaign state may be corrupted.',
    });
    return;
  }

  const embed = createSceneEmbed(scene, 'Current Scene');
  const actionRow = createSceneNavigationButtons(scene, campaignState);

  await interaction.editReply({
    embeds: [embed],
    components: [actionRow]
  });
}

async function handleNextScene(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const campaignState = await modulesRepository.getCampaignState(
    interaction.channelId
  );
  
  if (!campaignState?.currentSceneId) {
    await interaction.editReply({
      content: 'No active scene to advance from.',
    });
    return;
  }

  const currentScene = await modulesRepository.getSceneById(campaignState.currentSceneId);
  if (!currentScene?.nextSceneId) {
    await interaction.editReply({
      content: 'No next scene available. This may be the end of the module.',
    });
    return;
  }

  const nextScene = await modulesRepository.getSceneById(currentScene.nextSceneId);
  if (!nextScene) {
    await interaction.editReply({
      content: 'Next scene not found.',
    });
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

  const embed = createSceneEmbed(nextScene, '▶️ Advanced to Next Scene');
  const actionRow = createSceneNavigationButtons(nextScene, updatedState);

  await interaction.editReply({
    embeds: [embed],
    components: [actionRow]
  });
}

async function handlePreviousScene(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const campaignState = await modulesRepository.getCampaignState(
    interaction.channelId
  );
  
  if (!campaignState?.sceneHistory.length) {
    await interaction.editReply({
      content: 'No previous scene to return to.',
    });
    return;
  }

  const previousSceneId = campaignState.sceneHistory[campaignState.sceneHistory.length - 1];
  const previousScene = await modulesRepository.getSceneById(previousSceneId);
  
  if (!previousScene) {
    await interaction.editReply({
      content: 'Previous scene not found.',
    });
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

  const embed = createSceneEmbed(previousScene, '◀️ Returned to Previous Scene');
  const actionRow = createSceneNavigationButtons(previousScene, updatedState);

  await interaction.editReply({
    embeds: [embed],
    components: [actionRow]
  });
}

async function handleJumpToScene(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const sceneId = interaction.options.getString('scene', true);
  const scene = await modulesRepository.getSceneById(sceneId);
  
  if (!scene) {
    await interaction.editReply({
      content: 'Scene not found.',
    });
    return;
  }

  const campaignState = await modulesRepository.getCampaignState(
    interaction.channelId
  );

  if (!campaignState) {
    await interaction.editReply({
      content: 'No active campaign. Load a module first.',
    });
    return;
  }

  // Update campaign state
  const updatedState: CampaignState = {
    ...campaignState,
    currentSceneId: scene.id,
    sceneHistory: campaignState.currentSceneId ? 
      [...campaignState.sceneHistory, campaignState.currentSceneId] : 
      campaignState.sceneHistory,
    lastAdvancedAt: new Date()
  };

  await modulesRepository.createOrUpdateCampaignState(updatedState);

  const embed = createSceneEmbed(scene, '🎯 Jumped to Scene');
  const actionRow = createSceneNavigationButtons(scene, updatedState);

  await interaction.editReply({
    embeds: [embed],
    components: [actionRow]
  });
}

async function handleListScenes(interaction: ChatInputCommandInteraction) {
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

  const scenes = await modulesRepository.getModuleScenes(campaignState.currentModuleId);
  
  if (scenes.length === 0) {
    await interaction.editReply({
      content: 'No scenes found in the current module.',
    });
    return;
  }

  // Group scenes by act
  const scenesByAct = scenes.reduce((acc, scene) => {
    if (!acc[scene.act]) acc[scene.act] = [];
    acc[scene.act].push(scene);
    return acc;
  }, {} as Record<string, Scene[]>);

  const embed = new EmbedBuilder()
    .setTitle('📚 Module Scenes')
    .setColor(0xD4AF37)
    .setTimestamp();

  // Add fields for each act
  Object.entries(scenesByAct).forEach(([act, actScenes]: [string, Scene[]]) => {
    const sceneList = actScenes
      .sort((a, b) => a.order - b.order)
      .map(scene => {
        const current = scene.id === campaignState.currentSceneId ? '**→ ' : '';
        const end = scene.id === campaignState.currentSceneId ? '**' : '';
        return `${current}${scene.order}. ${scene.title}${end}`;
      })
      .join('\n');

    embed.addFields({
      name: `🎭 Act ${act}`,
      value: sceneList || 'No scenes',
      inline: false
    });
  });

  await interaction.editReply({ embeds: [embed] });
}

function createSceneEmbed(scene: Scene, title: string): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setColor(0xD4AF37)
    .addFields(
      {
        name: '🎬 Scene',
        value: `**${scene.title}**\nAct ${scene.act}, Scene ${scene.order}`,
        inline: false
      }
    )
    .setTimestamp();

  if (scene.readAloud) {
    embed.addFields({
      name: '📢 Read Aloud',
      value: scene.readAloud.length > 1000 ? 
        scene.readAloud.substring(0, 1000) + '...' : 
        scene.readAloud,
      inline: false
    });
  }

  if (scene.gmNotes) {
    embed.addFields({
      name: '🎯 GM Notes',
      value: scene.gmNotes.length > 500 ? 
        scene.gmNotes.substring(0, 500) + '...' : 
        scene.gmNotes,
      inline: false
    });
  }

  if (scene.checks && scene.checks.length > 0) {
    embed.addFields({
      name: '🎲 Suggested Checks',
      value: scene.checks.join(', '),
      inline: true
    });
  }

  if (scene.safetyFlags && scene.safetyFlags.length > 0) {
    embed.addFields({
      name: '⚠️ Safety Flags',
      value: scene.safetyFlags.join(', '),
      inline: true
    });
  }

  return embed;
}

function createSceneNavigationButtons(scene: Scene, campaignState: CampaignState): ActionRowBuilder<ButtonBuilder> {
  const buttons = [];

  // Previous button
  if (campaignState.sceneHistory.length > 0) {
    buttons.push(
      new ButtonBuilder()
        .setCustomId('scene_previous')
        .setLabel('Previous')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('◀️')
    );
  }

  // Next button
  if (scene.nextSceneId) {
    buttons.push(
      new ButtonBuilder()
        .setCustomId('scene_next')
        .setLabel('Next')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('▶️')
    );
  }

  // Quick action buttons
  if (scene.npcs && scene.npcs.length > 0) {
    buttons.push(
      new ButtonBuilder()
        .setCustomId(`scene_npcs:${scene.id}`)
        .setLabel('NPCs')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('👥')
    );
  }

  if (scene.handouts && scene.handouts.length > 0) {
    buttons.push(
      new ButtonBuilder()
        .setCustomId(`scene_handouts:${scene.id}`)
        .setLabel('Handouts')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📄')
    );
  }

  return new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);
}
