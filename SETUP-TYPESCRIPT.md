# Dune Discord Bot - TypeScript Setup Guide

## Prerequisites Installation

### 1. Install Node.js
1. Visit [nodejs.org](https://nodejs.org/)
2. Download the **LTS version** (18.x or higher)
3. Run the installer with default settings
4. Restart your terminal/command prompt
5. Verify installation:
   ```bash
   node --version
   npm --version
   ```

### 2. Install Git (if not already installed)
1. Visit [git-scm.com](https://git-scm.com/)
2. Download and install Git for Windows
3. Use default settings during installation

## Bot Setup

### 1. Discord Application Setup
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and name it (e.g., "Dune RPG Bot")
3. Go to "Bot" section and click "Add Bot"
4. **Copy the Bot Token** (keep this secret!)
5. Under "Privileged Gateway Intents", enable:
   - Server Members Intent (if needed)
   - Message Content Intent
6. Go to "OAuth2" > "General" and copy the **Application ID**

### 2. Bot Permissions
In Discord Developer Portal > OAuth2 > URL Generator:
1. Select "bot" and "applications.commands" scopes
2. Select these bot permissions:
   - Send Messages
   - Use Slash Commands
   - Embed Links
   - Read Message History
   - Manage Messages (for pinning)
3. Copy the generated URL and invite bot to your server

### 3. Environment Configuration
1. Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   ```
2. Edit `.env` file with your values:
   ```env
   DISCORD_TOKEN=your_bot_token_from_step_1
   CLIENT_ID=your_application_id_from_step_1
   GUILD_ID=your_server_id_for_testing
   
   # Optional Extra-Life integration
   EXTRALIFE_TEAM_ID=your_team_id
   EXTRALIFE_PARTICIPANT_ID=your_participant_id
   ```

### 4. Get Guild ID (Server ID)
1. Enable Developer Mode in Discord (User Settings > Advanced > Developer Mode)
2. Right-click your server name and select "Copy ID"
3. Paste this as `GUILD_ID` in your `.env` file

## Installation and Running

### 1. Install Dependencies
```bash
cd C:\Users\ixymo\CascadeProjects\dune-discord-bot
npm install
```

### 2. Build the Project
```bash
npm run build
```

### 3. Start the Bot
```bash
# Production mode
npm start

# Development mode (auto-restart on changes)
npm run dev
```

## Verification

### 1. Check Bot Status
- Bot should show as online in your Discord server
- Console should show "Bot logged in as [BotName]"
- No error messages in console

### 2. Test Commands
Try these commands in your Discord server:
```
/roll dice:2d6 system:standard
/dune-roll skill:Battle drive:Justice target:12
/momentum show
/roll-help
```

### 3. Check Logs
- Logs are written to `logs/` directory
- Check `combined.log` for all activity
- Check `error.log` for any issues

## Troubleshooting

### Common Issues

**"Cannot find module 'discord.js'"**
- Run `npm install` to install dependencies
- Check that Node.js is properly installed

**"Invalid token"**
- Verify `DISCORD_TOKEN` in `.env` file
- Make sure token is from Bot section, not OAuth2

**"Missing permissions"**
- Check bot has proper permissions in server
- Verify bot role is above other roles if needed

**Commands not appearing**
- Wait up to 1 hour for global commands
- Use `GUILD_ID` for instant testing
- Check `CLIENT_ID` is correct

**"Cannot read properties of undefined"**
- Check all required environment variables are set
- Verify `.env` file is in project root

### Debug Mode
Set these in `.env` for more detailed logging:
```env
NODE_ENV=development
LOG_LEVEL=debug
```

### Reset Commands
If commands aren't updating:
1. Remove `GUILD_ID` from `.env` (forces global deployment)
2. Restart bot
3. Wait up to 1 hour for changes

## Development Workflow

### Making Changes
1. Edit TypeScript files in `src/`
2. Run `npm run build` to compile
3. Run `npm start` or `npm run dev`

### Adding New Commands
1. Create new file in `src/commands/`
2. Export command builders and handlers
3. Import in `src/bot.ts`
4. Add to command switch statement

### Database
- Data stored in `data/` directory as JSON files
- Momentum pools: `data/momentum_pools.json`
- Extra-Life cache: `data/extralife_cache.json`
- Bot settings: `data/bot_settings.json`

## Production Deployment

### Environment Variables
```env
NODE_ENV=production
LOG_LEVEL=info
DISCORD_TOKEN=your_production_token
CLIENT_ID=your_production_client_id
# Remove GUILD_ID for global commands
```

### Process Management
Consider using PM2 for production:
```bash
npm install -g pm2
pm2 start dist/index.js --name dune-bot
pm2 startup
pm2 save
```

### Monitoring
- Check logs regularly: `pm2 logs dune-bot`
- Monitor memory usage: `pm2 monit`
- Set up log rotation for large deployments

## Support

If you encounter issues:
1. Check this setup guide thoroughly
2. Verify all prerequisites are installed
3. Check Discord Developer Portal settings
4. Review bot permissions in your server
5. Check console/log output for specific errors

For additional help, refer to:
- [Discord.js Guide](https://discordjs.guide/)
- [Discord Developer Documentation](https://discord.com/developers/docs)
- Project README files

---

**Ready to roll dice in the Imperium!** 🎲⚔️
