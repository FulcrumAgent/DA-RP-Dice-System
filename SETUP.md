# Dune Discord Bot Setup Guide

## Prerequisites

1. **Python 3.8+** installed on your system
2. **Discord Bot Token** from Discord Developer Portal
3. **Extra-Life Team/Participant ID** (optional, for charity features)

## Step-by-Step Setup

### 1. Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to "Bot" section and click "Add Bot"
4. Copy the bot token (keep this secret!)
5. Enable these bot permissions:
   - Send Messages
   - Use Slash Commands
   - Embed Links
   - Read Message History
   - Manage Messages (for pinning)

### 2. Install Dependencies

```bash
# Navigate to project directory
cd dune-discord-bot

# Install Python dependencies
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your settings
```

Required settings in `.env`:
```env
DISCORD_TOKEN=your_bot_token_here
GUILD_ID=your_server_id_here  # Optional: for faster command sync
```

Optional Extra-Life settings:
```env
EXTRALIFE_TEAM_ID=12345
EXTRALIFE_PARTICIPANT_ID=67890
```

### 4. Invite Bot to Server

1. In Discord Developer Portal, go to "OAuth2" > "URL Generator"
2. Select scopes: `bot` and `applications.commands`
3. Select permissions: `Send Messages`, `Use Slash Commands`, `Embed Links`
4. Copy the generated URL and open it to invite the bot

### 5. Run the Bot

```bash
python main.py
```

The bot will:
- Load all modules (dice roller, Dune system, Extra-Life)
- Sync slash commands to your server
- Start background tasks for Extra-Life updates

## Command Overview

### Dice Rolling
- `/roll 3d6` - Standard dice roll
- `/roll 3d6 system:exploding` - Exploding dice
- `/roll 5d10 system:wod difficulty:7` - World of Darkness
- `/roll-help` - Show detailed help

### Dune 2d20 System
- `/dune-roll skill:Battle drive:Justice target:12` - Basic roll
- `/dune-roll skill:Move drive:Duty target:10 bonus:2` - With bonus dice
- `/momentum show` - Check current pools
- `/momentum reset` - Reset pools to zero
- `/dune-help` - Show system help

### Extra-Life (if configured)
- `/extralife stats` - Show fundraising stats
- `/extralife setup channel:#announcements` - Setup announcements
- `/extralife announce` - Post event announcement
- `/extralife refresh` - Manually refresh data

## Troubleshooting

### Bot doesn't respond to commands
- Check bot has proper permissions in the channel
- Verify bot token is correct in `.env`
- Check console for error messages

### Commands not showing up
- Make sure `GUILD_ID` is set correctly (or remove for global commands)
- Wait a few minutes for Discord to sync commands
- Try restarting the bot

### Extra-Life features not working
- Verify `EXTRALIFE_TEAM_ID` and/or `EXTRALIFE_PARTICIPANT_ID` are set
- Check that the IDs are valid (test the API URLs manually)
- Extra-Life API may have rate limits or temporary issues

### Permission errors
- Bot needs "Send Messages" and "Use Slash Commands" permissions
- For pinning announcements, bot needs "Manage Messages" permission
- Check channel-specific permission overrides

## Advanced Configuration

### Database Options
By default, the bot uses JSON files for data storage. For production use, you can configure a proper database:

```env
DATABASE_URL=sqlite:///bot_data.db
# or
DATABASE_URL=postgresql://user:pass@localhost/botdb
```

### Logging
Adjust log level in `.env`:
```env
LOG_LEVEL=INFO  # DEBUG, INFO, WARNING, ERROR
DEBUG_MODE=True  # Enable debug features
```

### Custom Data Directory
```env
DATA_DIR=custom_data_folder
```

## Security Best Practices

1. **Never commit `.env` file** - it contains sensitive tokens
2. **Use environment variables** in production deployments
3. **Restrict bot permissions** to only what's needed
4. **Regularly rotate bot tokens** if compromised
5. **Monitor bot logs** for unusual activity

## Extending the Bot

The bot is designed to be modular and extensible:

### Adding New Dice Systems
1. Add new system to `utils/dice_engines.py`
2. Update `DiceSystem` enum
3. Add handling in `cogs/dice_roller.py`

### Adding New Commands
1. Create new cog file in `cogs/` directory
2. Add to `initial_extensions` in `main.py`
3. Follow existing patterns for error handling

### Custom Data Storage
1. Extend `utils/database.py` for new data types
2. Use the `DataManager` class for consistency
3. Consider migration scripts for schema changes

## Support

For issues or questions:
1. Check the logs in `bot.log`
2. Review this setup guide
3. Check Discord.py documentation
4. Verify API endpoints are working
