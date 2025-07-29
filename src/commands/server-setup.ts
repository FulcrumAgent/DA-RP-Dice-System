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
    content: `# **STORYGUIDE/GM ROLE**
- Run scenes, challenges, and story beats for the group.
- Control all NPCs, adversaries, and environmental hazards.
- Set the difficulty and consequences for rolls.
- Award or use Momentum and Threat.
- Create and manage scenes using the bot's commands.
- Keep the action moving, make rulings, and spotlight character Drives and Statements.


# **SETTING UP A SCENE**
1. In <#1399805471866617927>, type:
/scene host

2. The bot creates a new thread for the scene. Announce who's involved and set the opening situation.

3. Players join the scene with:
/scene join

4. List all active scenes or see participants:
/scene list
/scene status


# **RUNNING CHALLENGES**
1. Set the Difficulty (1 = easy, 2 = standard, 3+ = hard).

2. Tell players which Skill and Drive you think are most relevant.

3. Ask for rolls using:
*/dune-roll skill:[Skill] drive:[Drive] difficulty:[#]*

4. Watch for Momentum (extra successes) and Threat (players can add dice by giving you Threat).

5. Narrate the results. If a player rolls a 20, add a Complication!


# **NPC MANAGEMENT**
- Create new NPCs for major or recurring adversaries:

    */npc create*
    */npc generate*
- For quick rolls (supporting characters or minor enemies), use:

    */npc roll basic*
    */npc roll skill [skill] [difficulty] [bonus]*
- For combat or dramatic moments, use:

    */npc roll attack*
    */npc roll resist*
- View or edit NPC stats:

    */npc view [name]*
    */npc edit*


# **MOMENTUM AND THREAT**
*Momentum (player pool):*
    - Players earn Momentum for extra successes.
    - Can be spent for bonus dice, info, improved results, or team effects.
    - Track with /momentum or use the scene's resources command.

*Threat (GM pool):*
    - Players give you Threat to buy extra dice.
    - You spend Threat to raise difficulty, introduce hazards, or complicate scenes.
    - Announce when you use Threat for full transparency.


# **COMPLICATIONS**
- If any die rolls a 20, a Complication happens.
- Complications can make the scene harder, add new problems, or create dramatic twists.
- *Examples:* An alarm is triggered, a sandstorm hits, a weapon jams, backup arrives.
- Make Complications meaningful but fair—don't punish, add drama!


# **BEST PRACTICES**
- Use clear, concise narration and spotlight characters' Drives and Statements.
- Ask players what their Drives mean to them in tough situations.
- Keep scenes moving—don't sweat every rule.
- Use the bot for all dice and sheet management, focus your energy on story and characters.
- Encourage teamwork and clever solutions, not just dice rolls.
- Make Threat and Momentum visible to everyone.`
  },
  'Command Reference': {
    title: 'Command Reference',
    content: `# **LOOKUP & HELP COMMANDS**
- */dune-help*
   Shows a summary of all major commands and core rules. Great for new players.
- */dune-reference*
   Quick rules and Dune-specific term lookups.
- */lookup asset [asset name or partial]*
   Get info about an asset (gear, contact, etc).
- */lookup npc [name or tag]*
   Get info about a non-player character.
- */lookup rules [topic]*
   Find a rule summary by keyword or category.
- */lookup skill [skill name]*
   Shows an explanation of a specific skill.
- */roll-help*
   Quick help on how dice rolling works and available options.


# **DICE ROLLING COMMANDS**
- /roll
   Roll standard dice with custom notation.
   Examples: /roll 3d6+2, /roll 2d10, /roll 1d20+5
- /roll-exploding
   Roll exploding dice (when the max result is rolled, that die is rolled again and added).
   *Example:* /roll-exploding 4d6
- /roll-wod
   Roll a World of Darkness-style dice pool.
   *Example:* /roll-wod 7 (roll 7d10, count successes by WoD rules)
- /roll-help
   Show help and examples for all supported dice-rolling systems.


## **CHARACTER SHEET COMMANDS**
- */sheet create*
  Start a new character sheet for your PC. The bot will walk you through entering name, skills, drives, drive statements, and assets.
- */sheet edit*
  Update details on your character sheet—skills, drives, drive statements, avatar, or assets.
- */sheet view*
  Displays your current character sheet in a formatted embed (shows avatar, stats, assets).
- */sheet delete*
  Permanently remove your character sheet (warning: can't be undone).
- */character avatar set [upload image or URL]*
  Set a custom avatar for your character sheet.


# **NPC MANAGEMENT COMMANDS**
- */npc create*
  Start a new NPC (used by Storyguide/GM or for background characters).
- */npc edit*
  Change an NPC's details, stats, or avatar.
- */npc list*
  List all current NPCs in the game/server.
- */npc view [NPC name]*
  View the sheet/stats for a selected NPC.
- */npc delete*
  Remove an NPC from the game.
- */npc generate*
  Randomly create a supporting character or adversary for fast play.


# **SCENE & STORY COMMANDS**
- */scene host*
  Start (host) a new scene. Creates a scene thread for active play.
- */scene join*
  Join an open scene (thread) as a participant.
- */scene list*
  Show all active scenes.
- */scene end*
  End and archive the current scene.
- */scene pass*
  Pass scene hosting duties to another participant in the scene.
  Use this when you want to hand off GM/Storyguide control, let another player narrate, or switch perspectives during an active scene.
- */scene resources*
  View scene-specific resources (momentum, threat, assets in play).
- */scene status*
  Shows current status, active PCs/NPCs, and key scene info.


# **IN-SCENE & NPC ROLL COMMANDS**
- */momentum*
  Display or update current momentum pool for the scene.
- */npc roll attack*
  Roll an attack for a specified NPC against a target or defense.
- */npc roll basic*
  Make a basic skill/drive roll for an NPC (e.g., resisting a PC action).
- */npc roll resist*
  NPC attempts to resist or defend against a PC action.
- */npc roll skill [skill] [difficulty] [bonus]*
  Run a custom skill/drive test for any NPC.`
  },
  'Key Concepts & Core Mechanics': {
    title: 'Key Concepts & Core Mechanics',
    content: `# **SKILLS AND DRIVES**
Every character in Dune: Awakened Adventures has 5 Skills and 5 Drives.

## **SKILLS:**
- Battle: Fighting, tactics, physical conflict
- Communicate: Persuasion, social skills, deception, reading people
- Discipline: Willpower, focus, resisting fear or temptation
- Move: Stealth, agility, climbing, running, dodging
- Understand: Investigation, knowledge, deduction, insight

## **DRIVES:**
- Duty: Loyalty, responsibility, following orders or codes
- Faith: Belief in religion, prophecy, fate, or personal conviction
- Justice: Sense of fairness, righting wrongs, moral choices
- Power: Ambition, strength of will, seeking control or influence
- Truth: Pursuit of honesty, knowledge, clarity, uncovering secrets

---

# **ROLLING DICE: THE 2D20 SYSTEM**
Most actions are resolved with a Skill + Drive roll using two twenty-sided dice (2d20).

## **BASIC STEPS:**
1. Choose the most relevant Skill and Drive for the action.
2. Add your Skill score and Drive score to get your TARGET NUMBER.
3. Roll 2d20 (you may roll more dice if you spend Momentum or take on Threat).
4. Each die that rolls equal to or under your TARGET NUMBER counts as a SUCCESS.
5. If you roll equal to or under your Skill score, you get a CRITICAL SUCCESS (counts as 2).
6. The GM sets a DIFFICULTY (number of successes needed).
7. If you meet or exceed the DIFFICULTY, you succeed! Extra successes become MOMENTUM.
8. Rolling a 20 on any die is a COMPLICATION—something goes wrong, even if you succeed.

## **NOTES:**
- Most rolls use 2d20, but you can add up to 3 more dice (max 5d20) by spending Momentum or accepting Threat.
- GMs and players can use "assets" (gear, information, support) to get bonuses.

## **COMMON TERMS:**
- TARGET NUMBER = Skill + Drive
- MOMENTUM = Bonus points earned from extra successes, spent for more dice or effects
- THREAT = GM's "currency" for raising tension or causing trouble
- DIFFICULTY = Number of successes needed to accomplish the task

---

# **CHARACTER SHEET BASICS**
A character sheet contains everything needed to play:

- Name and (optional) Avatar
- Five Skills (Battle, Communicate, Discipline, Move, Understand), each rated 4–8 for most PCs
- Five Drives (Duty, Faith, Justice, Power, Truth), each rated 4–8 for most PCs
- Drive Statements: Short sentences or beliefs tied to each Drive
- Assets: Gear, contacts, information, special training, or relationships used in play
- (Optional) Traits, Talents, and Notes: Distinctive abilities or background info
- Current Momentum, Stress, or Harm (tracked as needed during sessions)

---

# **EXAMPLE TURN: HOW A ROLL WORKS**
1. The GM asks you to sneak past a Harkonnen patrol.
2. You pick the most relevant Skill and Drive: Move (6) + Duty (7) = TARGET NUMBER 13.
3. The GM sets Difficulty 2 (you need 2 successes).
4. You roll 2d20: you get a 10 and a 6.
    - Both are under 13 (your Target), so both are successes!
    - The 6 is also equal to or under your Move score, so it's a CRITICAL SUCCESS (counts as 2).
5. You score 3 successes total—enough to succeed and earn 1 Momentum (3 - 2 = 1).
6. If either die had rolled a 20, a complication would be introduced by the GM.

---

# **DUNE TERMS GLOSSARY**
- *Momentum:* Bonus points earned by getting more successes than you need, spent for extra dice or effects.
- *Threat:* GM's pool for causing trouble, raising stakes, or complicating actions.
- *Asset:* Any item, person, piece of info, or resource your character uses.
- *Trait:* Special features or story tags that define your character (e.g., "Fremen," "Bene Gesserit Trained").
- *Complication:* Bad or unexpected event caused by rolling a 20.
- *Drive Statement:* Your character's personal belief or motto tied to each Drive.
- *NPC:* Non-player character (controlled by GM or bot).
- *GM / Storyguide:* The game master or narrator, running scenes and challenges.`
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
