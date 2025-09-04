# Dune Discord Bot - TypeScript Version

A modular Discord bot for the **Dune: Adventures in the Imperium** RPG community, built with TypeScript and discord.js.

## Features

### 🎲 Universal Dice Roller (`/roll`)
- **Standard Dice**: Basic dice rolling with modifiers (e.g., `3d6+2`)
- **Exploding Dice**: Dice that reroll on maximum values
- **World of Darkness**: Success counting system with difficulty and specialty rules

### ⚔️ Dune 2d20 System (`/dune-roll`)
- Full implementation of Modiphius 2d20 mechanics
- Skill + Drive target number rolls
- Bonus dice from momentum/assets
- Success/complication tracking
- Interactive momentum and threat pool management
- Critical success detection

### 💫 Momentum & Threat Tracking (`/momentum`)
- Persistent momentum and threat pools per channel
- Interactive buttons for spending/generating momentum
- Automatic threat generation from complications
- Pool reset functionality

### 🎮 Extra-Life Integration (`/extralife`)
- Real-time fundraising statistics
- Team and participant data display
- Automated announcement posting
- Background data refresh (every 5 minutes)
- Pinned message updates

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Discord Application with Bot Token
- (Optional) Extra-Life Team/Participant IDs

### Installation

1. **Clone and setup**:
   ```bash
   git clone <repository-url>
   cd dune-discord-bot
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your tokens
   ```

3. **Build and run**:
   ```bash
   npm run build
   npm start
   ```

   Or for development:
   ```bash
   npm run dev
   ```

### Environment Variables

```env
# Required
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_application_id_here

# Optional
GUILD_ID=your_guild_id_for_testing
EXTRALIFE_TEAM_ID=your_team_id
EXTRALIFE_PARTICIPANT_ID=your_participant_id

# Settings
NODE_ENV=production
LOG_LEVEL=info
DATA_DIR=./data
```

## Commands

### Dice Rolling
- `/roll dice:3d6+2 system:standard` - Roll standard dice
- `/roll dice:5d10 system:wod difficulty:7` - World of Darkness roll
- `/roll dice:4d6 system:exploding` - Exploding dice
- `/roll-help` - Show dice rolling help

### Dune 2d20 System
- `/dune-roll skill:Battle drive:Justice target:12` - Basic 2d20 roll
- `/dune-roll skill:Move drive:Duty target:10 bonus:2` - Roll with bonus dice
- `/momentum show` - Display current pools
- `/momentum reset` - Reset pools to zero
- `/dune-help` - Show Dune system help

### Extra-Life
- `/extralife action:stats` - Show fundraising stats
- `/extralife action:setup channel:#announcements` - Setup announcements
- `/extralife action:announce` - Post event announcement
- `/extralife-help` - Show Extra-Life help

## Development

### Scripts
- `npm run dev` - Start in development mode
- `npm run dev:watch` - Start with auto-restart
- `npm run build` - Compile TypeScript
- `npm run lint` - Check code style
- `npm run clean` - Clean build directory

### Project Structure
```
src/
├── commands/          # Command handlers
│   ├── dice-roller.ts
│   ├── dune-system.ts
│   └── extralife.ts
├── utils/             # Utilities
│   ├── dice-engines.ts
│   ├── database.ts
│   └── logger.ts
├── config.ts          # Configuration
├── bot.ts            # Bot class
└── index.ts          # Entry point
```

### Adding New Commands

1. Create command file in `src/commands/`
2. Export command builders and handlers
3. Import and register in `src/bot.ts`
4. Add to switch statement in `handleCommand()`

## Architecture

### Modular Design
- **Commands**: Isolated command logic
- **Utils**: Shared utilities and engines
- **Database**: JSON-based persistence
- **Config**: Environment-based configuration

### Data Persistence
- Momentum/threat pools stored per guild/channel
- Extra-Life API data cached (5-minute TTL)
- Bot settings stored per guild
- All data in JSON files under `./data/`

### Error Handling
- Comprehensive try/catch blocks
- Graceful degradation for API failures
- User-friendly error messages
- Detailed logging with Winston

## Deployment

### Production Setup
1. Set `NODE_ENV=production`
2. Configure proper logging level
3. Use process manager (PM2, systemd)
4. Set up log rotation
5. Monitor bot status

### Docker (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
CMD ["npm", "start"]
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Follow TypeScript/ESLint standards
4. Add tests for new features
5. Submit pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Check the troubleshooting section
- Review command help (`/roll-help`, `/dune-help`, etc.)
- Open GitHub issue with details

---

**Built for the Dune: Adventures in the Imperium community** 🏜️⚔️
