import { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  StringSelectMenuBuilder,
  ChatInputCommandInteraction,
  AutocompleteInteraction
} from 'discord.js';
import { Command } from '../interfaces/command';
import { ModulesRepository } from '../services/modules-repository';
import { prisma } from '../utils/prisma-client';
import { moduleLogger } from '../utils/module-logger';
import { Handout } from '../types/module-types';

const modulesRepository = new ModulesRepository(prisma);

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('handout')
    .setDescription('View and distribute module handouts')
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all handouts in the current module')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View a specific handout')
        .addStringOption(option =>
          option
            .setName('handout')
            .setDescription('Handout to view')
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('distribute')
        .setDescription('Distribute a handout to players')
        .addStringOption(option =>
          option
            .setName('handout')
            .setDescription('Handout to distribute')
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addBooleanOption(option =>
          option
            .setName('public')
            .setDescription('Make the handout visible to all players (default: true)')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('scene')
        .setDescription('List handouts available in the current scene')
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();
    
    moduleLogger.commandStart({
      userId: interaction.user.id,
      channelId: interaction.channelId,
      command: `handout ${subcommand}`
    });

    try {
      switch (subcommand) {
        case 'list':
          await handleListHandouts(interaction);
          break;
        case 'view':
          await handleViewHandout(interaction);
          break;
        case 'distribute':
          await handleDistributeHandout(interaction);
          break;
        case 'scene':
          await handleSceneHandouts(interaction);
          break;
        default:
          await interaction.reply({ content: 'Unknown subcommand.', ephemeral: true });
      }
      
      moduleLogger.commandSuccess({
        userId: interaction.user.id,
        channelId: interaction.channelId,
        command: `handout ${subcommand}`
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      moduleLogger.error({
        userId: interaction.user.id,
        channelId: interaction.channelId,
        command: `handout ${subcommand}`,
        error: errorMessage
      }, 'Handout command execution failed');

      const content = 'An error occurred while processing the handout command.';
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

      const handouts = await modulesRepository.getModuleHandouts(campaignState.currentModuleId);
      const focusedValue = interaction.options.getFocused();
      
      const filtered = handouts
        .filter(handout => 
          handout.name.toLowerCase().includes(focusedValue.toLowerCase())
        )
        .slice(0, 25);

      await interaction.respond(
        filtered.map(handout => ({
          name: handout.name,
          value: handout.id
        }))
      );
    } catch (error) {
      moduleLogger.error({
        userId: interaction.user.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'Handout autocomplete failed');
      
      await interaction.respond([]);
    }
  }
};

async function handleListHandouts(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const campaignState = await modulesRepository.getCampaignState(
    interaction.channelId
  );
  
  if (!campaignState?.currentModuleId) {
    await interaction.editReply({
      content: 'No active module. Load a module first.',
    });
    return;
  }

  const handouts = await modulesRepository.getModuleHandouts(campaignState.currentModuleId);
  
  if (handouts.length === 0) {
    await interaction.editReply({
      content: 'No handouts found in the current module.',
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('📄 Module Handouts')
    .setDescription(`Found **${handouts.length}** handouts in the current module.`)
    .setColor(0xD4AF37)
    .setTimestamp();

  const handoutList = handouts
    .map(handout => `📄 **${handout.name}**`)
    .join('\n');
  
  embed.addFields({
    name: 'Available Handouts',
    value: handoutList.length > 1000 ? handoutList.substring(0, 1000) + '...' : handoutList,
    inline: false
  });

  // Create selection menu for detailed view
  if (handouts.length <= 25) {
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('handout_select')
      .setPlaceholder('Choose a handout to view or distribute')
      .addOptions(
        handouts.map(handout => ({
          label: handout.name,
          description: 'Click to view or distribute',
          value: handout.id,
          emoji: '📄'
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

async function handleViewHandout(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const handoutId = interaction.options.getString('handout', true);
  const handout = await modulesRepository.getHandoutById(handoutId);
  
  if (!handout) {
    await interaction.editReply({
      content: 'Handout not found.',
    });
    return;
  }

  const embed = createHandoutEmbed(handout, true);
  
  await interaction.editReply({ embeds: [embed] });
}

async function handleDistributeHandout(interaction: ChatInputCommandInteraction) {
  const handoutId = interaction.options.getString('handout', true);
  const isPublic = interaction.options.getBoolean('public') ?? true;
  
  await interaction.deferReply({ ephemeral: !isPublic });

  const handout = await modulesRepository.getHandoutById(handoutId);
  
  if (!handout) {
    await interaction.editReply({
      content: 'Handout not found.',
    });
    return;
  }

  const embed = createHandoutEmbed(handout, false);
  embed.setFooter({ 
    text: `Distributed by ${interaction.user.displayName}`,
    iconURL: interaction.user.displayAvatarURL()
  });
  
  const content = isPublic 
    ? `📄 **Handout Distributed:** ${handout.name}`
    : undefined;

  await interaction.editReply({ 
    content,
    embeds: [embed] 
  });

  moduleLogger.info({
    userId: interaction.user.id,
    channelId: interaction.channelId,
    handoutId: handout.id,
    handoutName: handout.name,
    public: isPublic
  }, 'Handout distributed');
}

async function handleSceneHandouts(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

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
  
  if (!scene?.handouts || scene.handouts.length === 0) {
    await interaction.editReply({
      content: 'No handouts available in the current scene.',
    });
    return;
  }

  // Get detailed handout information
  const handoutDetails = await Promise.all(
    scene.handouts.map(handoutName => {
      // Try to find handout by name - this might need adjustment based on how handouts are referenced
      return modulesRepository.getModuleHandouts(campaignState.currentModuleId!)
        .then(handouts => handouts.find(h => h.name === handoutName));
    })
  );

  const validHandouts = handoutDetails.filter(handout => handout !== undefined) as Handout[];

  if (validHandouts.length === 0) {
    await interaction.editReply({
      content: 'Handout details not found for the current scene.',
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(`📄 Scene Handouts: ${scene.title}`)
    .setDescription(`Handouts available in this scene:`)
    .setColor(0xD4AF37)
    .setTimestamp();

  const handoutList = validHandouts
    .map(handout => `📄 **${handout.name}**`)
    .join('\n');
  
  embed.addFields({
    name: 'Available Handouts',
    value: handoutList,
    inline: false
  });

  // Create quick distribution menu
  if (validHandouts.length <= 25) {
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('scene_handout_distribute')
      .setPlaceholder('Choose a handout to distribute')
      .addOptions(
        validHandouts.map(handout => ({
          label: handout.name,
          description: 'Distribute to players',
          value: handout.id,
          emoji: '📄'
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

function createHandoutEmbed(handout: Handout, includeGMNotes: boolean): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(`📄 ${handout.name}`)
    .setColor(0xD4AF37)
    .setTimestamp();

  if (handout.description) {
    embed.setDescription(handout.description);
  }

  // Only show GM notes to GMs or in GM-only contexts
  if (includeGMNotes && handout.gmNotes) {
    embed.addFields({
      name: '🎯 GM Notes',
      value: handout.gmNotes.length > 1000 
        ? handout.gmNotes.substring(0, 1000) + '...'
        : handout.gmNotes,
      inline: false
    });
  }

  return embed;
}
