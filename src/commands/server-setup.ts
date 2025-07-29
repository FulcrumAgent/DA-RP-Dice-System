/**
 * Server Setup Command - Creates the standard Dune: Awakened Adventures server structure
 */

import { 
  SlashCommandBuilder, 
  CommandInteraction, 
  PermissionFlagsBits,
  ChannelType,
  ForumChannel,
  TextChannel,
  CategoryChannel,
  Guild,
  GuildChannel
} from 'discord.js';
import { logger } from '../utils/logger';

// Forum post templates
const FORUM_POST_TEMPLATES = {
  'Introduction & Project Overview': {
    title: 'Introduction & Project Overview',
    content: `# **Dune: Awakened Adventures**
**DA-RP Dice System** is an advanced, Discord-based dice roller and character assistant designed for running campaigns using the *Dune: Adventures in the Imperium* tabletop RPG (Modiphius 2d20 system).

- **Automates dice rolls** (including 2d20 mechanics, momentum, threat, complications)
- **Manages character sheets** for players and NPCs, including custom avatars and assets
- **Supports both players and GMs** with commands for rolls, scene hosting, and more
- **Integrates with Discord** for in-server roleplay, session management, and player immersion

## **Why Use This Bot?**
Dune's RPG system is fast, cinematic, and dramatic—but running it online can be tricky! This bot handles all the dice, math, and sheet management so you can focus on story and intrigue.

- No need to install or memorise external dice bots or rules
- Fast commands for every Dune mechanic
- Flexible enough for custom house rules and campaign setups

**Note:** This tool is *not* a replacement for the official rulebooks. It's meant as a quick start and practical guide for players, GMs, and devs using the Dune 2d20 system in Discord. I strongly encourage people to pick up some of the TTRPG books aat [Mophidius Entertainment's site](https://modiphius.us/collections/dune-adventures-in-the-imperium).`
  },
  'Storyguide/GM Guide': {
    title: 'Storyguide/GM Guide',
    content: `# **GM ESSENTIALS**
- Run scenes, set difficulty, control NPCs
- Manage Momentum (player pool) and Threat (GM pool)
- Use /scene host in <#1399805471866617927> to start scenes
- Players join with /scene join

# **RUNNING ROLLS**
1. Set Difficulty (1=easy, 2=standard, 3+=hard)
2. Ask for: */dune-roll skill:[Skill] drive:[Drive] difficulty:[#]*
3. Extra successes = Momentum, rolling 20 = Complication

# **NPC COMMANDS**
- */npc create* - Make major NPCs
- */npc roll basic* - Quick NPC rolls
- */npc roll attack/resist* - Combat rolls
- */npc view [name]* - Check NPC stats

# **MOMENTUM & THREAT**
- **Momentum:** Players earn from extra successes, spend for bonuses
- **Threat:** Players give you Threat for extra dice, you spend for complications
- Track with */momentum* and */scene resources*

# **COMPLICATIONS**
When players roll 20: add drama, not punishment!
*Examples:* Alarms, weather, equipment issues, reinforcements

# **BEST PRACTICES**
- Spotlight character Drives and Statements
- Keep scenes moving, don't sweat every rule
- Use bot for mechanics, focus on story
- Make Momentum/Threat visible to all
- Encourage teamwork and creative solutions`
  },
  'Command Reference': {
    title: 'Command Reference',
    content: `# **HELP & LOOKUP**
- */dune-help* - Command summary and core rules
- */dune-reference* - Quick rules lookup
- */lookup asset/npc/rules/skill [name]* - Get info
- */roll-help* - Dice rolling help

# **DICE ROLLING**
- */roll* - Standard dice (3d6+2, 2d10, etc.)
- */roll-exploding* - Exploding dice
- */roll-wod* - World of Darkness pools
- */dune-roll* - Dune system rolls with momentum

# **CHARACTER SHEETS**
- */sheet create* - New character sheet
- */sheet edit* - Update character details
- */sheet view* - Display character sheet
- */sheet delete* - Remove character (permanent)
- */character avatar set* - Set custom avatar

# **NPC MANAGEMENT**
- */npc create/edit/delete* - Manage NPCs
- */npc list/view [name]* - Browse NPCs
- */npc generate* - Random NPC creation
- */npc roll attack/basic/resist/skill* - NPC rolls

# **SCENES & STORY**
- */scene host* - Start new scene thread
- */scene join/list/status* - Scene participation
- */scene end/pass* - Scene management
- */scene resources* - View momentum/threat
- */momentum* - Manage momentum pool

*Use commands without parameters for detailed help!*`
  },
  'Key Concepts & Core Mechanics': {
    title: 'Key Concepts & Core Mechanics',
    content: `# **SKILLS & DRIVES**
Every character has 5 Skills and 5 Drives.

**SKILLS:** Battle, Communicate, Discipline, Move, Understand
**DRIVES:** Duty, Faith, Justice, Power, Truth

# **2D20 SYSTEM BASICS**
1. Choose relevant Skill + Drive
2. Add scores = TARGET NUMBER
3. Roll 2d20 (can add up to 3 more dice)
4. Each die ≤ Target = 1 SUCCESS
5. Each die ≤ Skill = 2 SUCCESSES (critical)
6. Meet GM's Difficulty = Success!
7. Extra successes = MOMENTUM
8. Rolling 20 = COMPLICATION

# **KEY TERMS**
- **TARGET:** Skill + Drive score
- **MOMENTUM:** Earned from extra successes, spend for bonuses
- **THREAT:** GM resource, players can give Threat for extra dice
- **COMPLICATIONS:** Bad things when rolling 20s
- **ASSETS:** Gear/contacts that provide bonuses

# **EXAMPLE ROLL**
*Sneak past guards (Move 3 + Duty 2 = Target 5)*
- Roll 2d20: get 4, 17
- 4 ≤ 5 = success, 4 ≤ 3 = critical (2 successes total)
- If Difficulty was 1, you succeed with 1 Momentum!

*Use /dune-roll for all game rolls!*`
  },
  'Quick Start Guide': {
    title: 'Quick Start Guide',
    content: `Welcome to Dune: Awakened Adventures—your Discord-based TTRPG system for the world of Dune!
Each function has its own server channel. Use these commands in the correct channels as listed below.

-------------------------------
<#1399805506347864094>

Use this channel for quick rule lookups and bot help:

    /dune-help
    /dune-reference
    /lookup asset
    /lookup npc
    /lookup rules
    /lookup skill
    /roll-help

-------------------------------
<#1399805381584359597>

For any personal or out-of-scene dice rolls:

    /roll
    /dune-roll

*Only use /dune-roll here for personal rolls unrelated to an active scene.*

-------------------------------
<#1399806884227186788>

Create and manage player characters and NPCs.

Player Character Commands:
    /sheet create
    /sheet delete
    /sheet edit
    /sheet view

NPC Commands:
    /npc create
    /npc delete
    /npc edit
    /npc generate
    /npc list
    /npc view

-------------------------------
<#1399805471866617927>

For running, joining, and playing in active story scenes.

Scene Setup/Lobby Commands:
    /scene host
    /scene join
    /scene list

In-Scene Thread Commands:
    /scene end
    /scene pass
    /scene resources
    /scene status
    /dune-roll
    /momentum
    /npc roll attack
    /npc roll basic
    /npc roll resist
    /npc roll skill

-------------------------------
FIRST STEPS FOR NEW PLAYERS

1. Create your character in <#1399806884227186788>:
       /sheet create

2. Set a custom avatar (optional):
       /character avatar set [upload image or paste image URL]

3. Make a test roll in <#1399805381584359597>:
       /dune-roll skill:[Skill] drive:[Drive] bonus:[#] description:[optional]

-------------------------------
Need more help? Check <#1399805506347864094> or ask in the <#1399823303475990528> channel.`
  }
};

// Text channels to create
const TEXT_CHANNELS = [
  { name: 'lookups', topic: 'Quick reference lookups and rule clarifications' },
  { name: 'dice-help', topic: 'Help with dice rolling commands and bot usage' },
  { name: 'dice-rolling', topic: 'Practice dice rolls and test bot commands' },
  { name: 'character-sheets', topic: 'Character creation, updates, and sheet management' },
  { name: 'scenes', topic: 'In-character roleplay and scene descriptions' }
];

export const serverSetupCommand = new SlashCommandBuilder()
  .setName('setup-server')
  .setDescription('Create the standard Dune: Awakened Adventures server structure')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function handleServerSetupCommand(interaction: CommandInteraction): Promise<void> {
  // Verify user has administrator permissions
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    await interaction.reply({
      content: '❌ You need Administrator permissions to use this command.',
      ephemeral: true
    });
    return;
  }

  const guild = interaction.guild;
  if (!guild) {
    await interaction.reply({
      content: '❌ This command can only be used in a server.',
      ephemeral: true
    });
    return;
  }

  await interaction.deferReply();

  try {
    logger.info(`Setting up server structure for guild: ${guild.name} (${guild.id})`);
    
    const results = {
      forumCreated: false,
      postsCreated: 0,
      channelsCreated: 0,
      categoryCreated: false,
      errors: [] as string[]
    };

    // Check bot permissions
    const botMember = guild.members.me;
    if (!botMember?.permissions.has([
      PermissionFlagsBits.ManageChannels,
      PermissionFlagsBits.CreatePublicThreads,
      PermissionFlagsBits.SendMessages
    ])) {
      await interaction.editReply({
        content: '❌ I need "Manage Channels", "Create Public Threads", and "Send Messages" permissions to set up the server.'
      });
      return;
    }

    // 1. Create or find category first
    let duneCategory = guild.channels.cache.find(
      channel => channel.name === 'Dune: Awakened Adventures' && channel.type === ChannelType.GuildCategory
    ) as CategoryChannel;

    if (!duneCategory) {
      try {
        duneCategory = await guild.channels.create({
          name: 'Dune: Awakened Adventures',
          type: ChannelType.GuildCategory,
          reason: 'Server setup - creating Dune category'
        });
        results.categoryCreated = true;
        logger.info(`Created category: Dune: Awakened Adventures in ${guild.name}`);
      } catch (error) {
        const errorMsg = `Failed to create category: ${error}`;
        results.errors.push(errorMsg);
        logger.error(errorMsg);
      }
    }

    // 2. Create or find documentation forum
    let documentationForum = guild.channels.cache.find(
      channel => channel.name === 'documentation' && channel.type === ChannelType.GuildForum
    ) as ForumChannel;

    if (!documentationForum) {
      try {
        documentationForum = await guild.channels.create({
          name: 'documentation',
          type: ChannelType.GuildForum,
          topic: 'Server documentation and guides for Dune: Awakened Adventures',
          parent: duneCategory?.id, // Assign to category
          reason: 'Server setup - creating documentation forum'
        });
        results.forumCreated = true;
        logger.info(`Created documentation forum in ${guild.name}`);
      } catch (error) {
        const errorMsg = `Failed to create documentation forum: ${error}`;
        results.errors.push(errorMsg);
        logger.error(errorMsg);
      }
    } else if (duneCategory && documentationForum.parentId !== duneCategory.id) {
      // Move existing forum to category if not already there
      try {
        await documentationForum.setParent(duneCategory.id, { reason: 'Server setup - organizing channels' });
        logger.info(`Moved documentation forum to Dune category in ${guild.name}`);
      } catch (error) {
        const errorMsg = `Failed to move documentation forum to category: ${error}`;
        results.errors.push(errorMsg);
        logger.error(errorMsg);
      }
    }

    // 3. Create forum posts if forum exists
    if (documentationForum) {
      for (const [postKey, template] of Object.entries(FORUM_POST_TEMPLATES)) {
        try {
          // Check if post already exists
          const existingPost = documentationForum.threads.cache.find(
            thread => thread.name === template.title
          );

          if (!existingPost) {
            const forumPost = await documentationForum.threads.create({
              name: template.title,
              message: {
                content: template.content
              },
              reason: 'Server setup - creating documentation post'
            });

            // Don't auto-pin to avoid hitting Discord's pinned thread limit
            await forumPost.setArchived(false);
            
            results.postsCreated++;
            logger.info(`Created forum post: ${template.title} in ${guild.name}`);
          }
        } catch (error) {
          const errorMsg = `Failed to create forum post "${template.title}": ${error}`;
          results.errors.push(errorMsg);
          logger.error(errorMsg);
        }
      }
    }

    // 4. Create text channels and assign to category
    for (const channelConfig of TEXT_CHANNELS) {
      try {
        // Check if channel already exists
        const existingChannel = guild.channels.cache.find(
          channel => channel.name === channelConfig.name && channel.type === ChannelType.GuildText
        );

        if (!existingChannel) {
          await guild.channels.create({
            name: channelConfig.name,
            type: ChannelType.GuildText,
            topic: channelConfig.topic,
            parent: duneCategory?.id, // Assign to category
            reason: 'Server setup - creating standard text channel'
          });
          results.channelsCreated++;
          logger.info(`Created text channel: #${channelConfig.name} in ${guild.name}`);
        } else if (duneCategory && existingChannel.parentId !== duneCategory.id) {
          // Move existing channel to category if not already there
          await (existingChannel as TextChannel).setParent(duneCategory.id, { reason: 'Server setup - organizing channels' });
          logger.info(`Moved existing channel #${channelConfig.name} to Dune category in ${guild.name}`);
        }
      } catch (error) {
        const errorMsg = `Failed to create/move channel "#${channelConfig.name}": ${error}`;
        results.errors.push(errorMsg);
        logger.error(errorMsg);
      }
    }



    // 5. Build response message
    let responseMessage = '✅ **Server setup completed!**\n\n';
    
    if (results.categoryCreated) {
      responseMessage += '📁 Created **Dune: Awakened Adventures** category\n';
    }
    
    if (results.forumCreated) {
      responseMessage += '📁 Created **documentation** forum\n';
    }
    
    if (results.postsCreated > 0) {
      responseMessage += `📝 Created ${results.postsCreated} documentation posts\n`;
    }
    
    if (results.channelsCreated > 0) {
      responseMessage += `💬 Created ${results.channelsCreated} text channels\n`;
    }

    if (results.forumCreated === false && results.postsCreated === 0 && results.channelsCreated === 0) {
      responseMessage += '📋 All channels and posts already exist - nothing to create.\n';
    }

    if (results.errors.length > 0) {
      responseMessage += '\n⚠️ **Errors encountered:**\n';
      results.errors.forEach(error => {
        responseMessage += `• ${error}\n`;
      });
    }

    responseMessage += '\n🎲 Your Dune: Awakened Adventures server is ready!';

    await interaction.editReply({ content: responseMessage });

  } catch (error) {
    logger.error('Server setup command failed:', error);
    await interaction.editReply({
      content: '❌ An unexpected error occurred during server setup. Please check my permissions and try again.'
    });
  }
}
