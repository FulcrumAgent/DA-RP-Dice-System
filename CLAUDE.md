# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### TypeScript/Node.js Commands
- **Build project**: `npm run build`
- **Start production**: `npm start`
- **Development with restart**: `npm run dev`
- **Development with watch**: `npm run dev:watch`
- **Clean build directory**: `npm run clean`
- **Lint TypeScript**: `npm run lint`
- **Fix linting issues**: `npm run lint:fix`
- **Deploy commands**: `npm run deploy`

### Python Commands
- **Run Python bot**: `python main.py`
- **Install dependencies**: `pip install -r requirements.txt`

### Project Structure
The project has both TypeScript and Python implementations:
- **TypeScript version**: Primary implementation in `/src` directory
- **Python version**: Legacy implementation with `main.py` and `/cogs` directory
- **Build output**: TypeScript compiles to `/dist` directory
- **Configuration**: `tsconfig.json` for TypeScript, `package.json` for Node.js dependencies

## Architecture Overview

### Dual Implementation System
This is a Discord bot with two parallel implementations:
1. **TypeScript/Node.js** (primary, actively developed)
2. **Python/discord.py** (legacy, for reference)

### Core Bot Structure (TypeScript)
- **Entry point**: `src/index.ts` → imports and starts `src/bot.ts`
- **Main bot class**: `src/bot.ts` - contains `DuneBot` class with interaction handling
- **Commands**: Organized in `src/commands/` directory as individual modules
- **Utilities**: Shared functionality in `src/utils/` directory
- **Data management**: JSON-based persistence in `src/utils/database.ts`
- **Configuration**: Environment-based config in `src/config/index.ts`

### Character Creation System Architecture
The character creation system uses a complex multi-step workflow:
- **State management**: `src/utils/character-creation-state.ts` manages user sessions
- **Flow control**: `src/commands/character-creation-flow.ts` handles step progression
- **Unified creator**: `src/commands/character-creator.ts` - new unified character creation system
- **Legacy handlers**: Multiple specialized handlers for different character aspects (skills, concepts, drives, etc.)

### Command Architecture
Commands are implemented as:
- **Slash commands**: Exported `data` (SlashCommandBuilder) and `execute` functions
- **Interaction handlers**: Button, select menu, and modal handlers in the main bot class
- **Modular design**: Each command file is self-contained with its own handlers

### Data Management
- **JSON storage**: Data persisted in `/data` directory as JSON files
- **Character data**: Stored in `data/characters.json` and `data/character_creation_states.json`
- **Game data**: RPG-specific data in `src/data/` directory (skills, talents, concepts, etc.)

## Key Components

### Command Modules
- **dice-roller.ts**: Universal dice rolling system (standard, exploding, World of Darkness)
- **dune-system.ts**: Dune 2d20 system with momentum/threat tracking
- **character-sheet.ts**: Character creation and management
- **character-creator.ts**: New unified character creation system
- **npc-manager.ts**: NPC creation and management
- **scene-host.ts**: Scene management tools
- **reference.ts**: Rules and mechanics lookup

### Utilities
- **logger.ts**: Winston-based logging system
- **database.ts**: JSON file-based data persistence
- **character-manager.ts**: Character data operations
- **dice-engines.ts**: Dice rolling implementations
- **dune-dice.ts**: Dune-specific dice mechanics

### Configuration
- **Environment variables**: Required `DISCORD_TOKEN`, `CLIENT_ID`, optional `GUILD_ID`
- **Deployment modes**: Guild-specific (instant) vs global (up to 1 hour)
- **Logging**: Configurable log levels and Winston transport

## Development Workflow

### Making Changes
1. Edit TypeScript files in `src/` directory
2. Run `npm run build` to compile to `dist/`
3. Run `npm start` or `npm run dev` to test changes
4. Use `npm run lint` to check code style

### Code Quality
- **Current lint status**: The codebase currently has 281 linting issues (141 errors, 140 warnings)
- **Main issues**: Unused imports, unused variables, explicit `any` types, and missing type declarations
- **Before deployment**: Fix critical lint errors, especially unused variables and missing types
- **Use `npm run lint:fix`** to automatically fix some issues

### Adding New Commands
1. Create new file in `src/commands/` following existing patterns
2. Export `data` (SlashCommandBuilder) and `execute` function
3. Import and register in `src/bot.ts` command handling switch
4. Add interaction handlers for buttons/modals if needed

### Character Creation Integration
- Use `CharacterCreator` class for new character creation features
- Follow the session-based pattern with `character_creation_` prefixes
- Update `character-creation-flow.ts` for navigation between steps
- Store character data in the unified session format

## Important Notes

### Legacy vs New Systems
- The codebase contains both old and new character creation systems
- New development should use the unified `CharacterCreator` class
- Legacy handlers exist for backwards compatibility but are being phased out

### Error Handling
- All interactions use try/catch blocks with proper error responses
- Logging is done through Winston logger with appropriate log levels
- Graceful degradation for missing data or API failures

### Data Persistence
- All data is stored as JSON files in the `/data` directory
- Character creation uses temporary sessions stored in memory
- Final character data is persisted to `characters.json`

### Discord Integration
- Uses discord.js v14 with slash commands
- Button, select menu, and modal interactions are handled in the main bot class
- Supports both ephemeral and persistent messages
- Proper permission handling for guild operations