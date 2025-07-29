# Dune TTRPG Discord Bot

A comprehensive Discord bot for Dune: Adventures in the Imperium RPG, featuring dice rolling systems and complete character creation tools.

## Features

### 🎲 Dice Rolling Systems
- **Universal Roller** (`/roll`): Standard, Exploding, and World of Darkness dice
- **Dune 2d20 System** (`/dune-roll`): Full Modiphius 2d20 support with momentum/threat tracking

### 🏜️ Dune TTRPG System
- **Character Creation** (`/sheet`): Complete step-by-step character builder
  - Skills, Focuses, Drives, Drive Statements
  - Talents and Assets selection
  - Character details and finalization
- **Reference System** (`/reference`): Quick access to rules and mechanics
- **Scene Management** (`/scene`): Tools for managing RPG sessions
- **NPC Management** (`/npc`): Create and manage NPCs

## Deployment Options

### Global Deployment (Recommended for Public Bots)
For bots that will be invited to multiple servers:

1. **Leave `GUILD_ID` empty** in your `.env` file
2. Commands will be deployed globally (takes up to 1 hour to update)
3. Bot works on any server it's invited to

### Guild-Specific Deployment (Development/Testing)
For faster testing on a single server:

1. **Set `GUILD_ID`** to your test server's ID in `.env`
2. Commands update immediately
3. Only works on the specified server

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env with your Discord bot token and client ID
   ```

3. Deploy commands:
   ```bash
   npm run deploy
   ```

4. Run the bot:
   ```bash
   npm start
   ```

## Project Structure

```
dune-ttrpg-bot/
├── src/
│   ├── index.ts              # Bot entry point
│   ├── bot.ts                # Main bot class
│   ├── deploy-commands.ts    # Command deployment
│   ├── commands/             # Slash commands
│   │   ├── dice-roller.ts    # Universal dice systems
│   │   ├── dune-system.ts    # Dune 2d20 mechanics
│   │   ├── character-sheet.ts # Character creation
│   │   ├── reference.ts      # Rules reference
│   │   ├── scene-host.ts     # Scene management
│   │   └── npc-manager.ts    # NPC tools
│   ├── utils/                # Utility modules
│   │   ├── database.ts       # Data persistence
│   │   ├── character-creation-state.ts
│   │   └── logger.ts         # Logging system
│   ├── config/               # Configuration
│   │   └── index.ts          # Config management
│   └── data/                 # Game data
│       └── mixed-archetypes.ts
├── package.json              # Dependencies
├── tsconfig.json            # TypeScript config
├── .env.example             # Environment template
└── data/                    # Bot data storage
    ├── momentum_pools.json
    └── character_states.json
```

## Discord Bot Setup

### Required Permissions
When inviting the bot to servers, ensure it has these permissions:
- **Send Messages** - Basic bot functionality
- **Use Slash Commands** - All bot commands are slash commands
- **Embed Links** - Character sheets and rich responses
- **Manage Messages** - Scene management features
- **Read Message History** - Context for interactions

### Bot Invite Link
Generate an invite link with the required permissions:
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=2147485696&scope=bot%20applications.commands
```
Replace `YOUR_CLIENT_ID` with your bot's Client ID from the Discord Developer Portal.

## Commands

### 🎲 Dice Rolling
- `/roll 3d6` - Standard dice roll
- `/roll 3d6 exploding` - Exploding dice
- `/roll 5d10 wod difficulty:7` - World of Darkness
- `/dune-roll skill:Battle drive:Justice target:7 bonus:2` - Dune 2d20

### 🏜️ Character Creation
- `/sheet skills` - Assign character skills
- `/sheet focuses` - Set skill focuses
- `/sheet drives` - Assign drives and statements
- `/sheet talents` - Select character talents
- `/sheet assets` - Choose character assets
- `/sheet details` - Finalize character

### 📚 Reference & Tools
- `/reference skills` - View skill descriptions
- `/reference talents` - Browse available talents
- `/scene create` - Start a new scene
- `/npc create` - Generate NPCs

## Development

The bot uses a modular TypeScript architecture with clear separation of concerns. Each command is self-contained with proper error handling and logging.
