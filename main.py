"""
Dune Discord Bot - Main Entry Point

A modular Discord bot for Dune: Adventures in the Imperium RPG community
with Extra-Life charity integration.
"""

import discord
from discord.ext import commands
import asyncio
import logging
import os
from config import Config

# Configure logging
logging.basicConfig(
    level=getattr(logging, Config.LOG_LEVEL.upper()),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('bot.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

class DuneBot(commands.Bot):
    """Main bot class with enhanced functionality."""
    
    def __init__(self):
        # Configure intents
        intents = discord.Intents.default()
        intents.message_content = True
        intents.guilds = True
        intents.guild_messages = True
        
        super().__init__(
            command_prefix=Config.COMMAND_PREFIX,
            intents=intents,
            help_command=None,  # We'll use slash commands
            case_insensitive=True
        )
        
        self.initial_extensions = [
            'cogs.dice_roller',
            'cogs.dune_system',
            'cogs.extralife'
        ]
    
    async def setup_hook(self):
        """Setup hook called when bot is starting up."""
        logger.info("Setting up bot...")
        
        # Ensure data directory exists
        if not os.path.exists(Config.DATA_DIR):
            os.makedirs(Config.DATA_DIR)
        
        # Load all cogs
        for extension in self.initial_extensions:
            try:
                await self.load_extension(extension)
                logger.info(f"Loaded extension: {extension}")
            except Exception as e:
                logger.error(f"Failed to load extension {extension}: {e}")
        
        # Sync commands to guild if specified, otherwise global
        if Config.GUILD_ID:
            guild = discord.Object(id=Config.GUILD_ID)
            self.tree.copy_global_to(guild=guild)
            await self.tree.sync(guild=guild)
            logger.info(f"Synced commands to guild {Config.GUILD_ID}")
        else:
            await self.tree.sync()
            logger.info("Synced commands globally")
    
    async def on_ready(self):
        """Called when bot is ready and connected."""
        logger.info(f"Bot is ready! Logged in as {self.user} (ID: {self.user.id})")
        logger.info(f"Connected to {len(self.guilds)} guilds")
        
        # Set bot status
        activity = discord.Activity(
            type=discord.ActivityType.playing,
            name="Dune: Adventures in the Imperium"
        )
        await self.change_presence(activity=activity)
    
    async def on_guild_join(self, guild):
        """Called when bot joins a new guild."""
        logger.info(f"Joined new guild: {guild.name} (ID: {guild.id})")
        
        # Send welcome message to system channel if available
        if guild.system_channel:
            embed = discord.Embed(
                title="🏜️ Welcome to the Dune Bot!",
                description=(
                    "Thanks for adding me to your server! I'm here to help with:\n\n"
                    "🎲 **Dice Rolling** - Universal roller with multiple systems\n"
                    "⚔️ **Dune 2d20** - Full Modiphius system support\n"
                    "🎮 **Extra-Life** - Charity event integration\n\n"
                    "Use `/roll-help` and `/dune-help` to get started!"
                ),
                color=discord.Color.orange()
            )
            
            try:
                await guild.system_channel.send(embed=embed)
            except discord.Forbidden:
                pass  # No permission to send messages
    
    async def on_command_error(self, ctx, error):
        """Global error handler for prefix commands."""
        if isinstance(error, commands.CommandNotFound):
            return  # Ignore unknown commands
        
        logger.error(f"Command error in {ctx.command}: {error}")
        
        if ctx.interaction:
            # This is a slash command error
            if not ctx.interaction.response.is_done():
                await ctx.interaction.response.send_message(
                    f"❌ An error occurred: {str(error)}", 
                    ephemeral=True
                )
        else:
            # This is a prefix command error
            await ctx.send(f"❌ An error occurred: {str(error)}")
    
    async def on_app_command_error(self, interaction: discord.Interaction, error):
        """Global error handler for slash commands."""
        logger.error(f"Slash command error: {error}")
        
        if not interaction.response.is_done():
            await interaction.response.send_message(
                f"❌ An error occurred: {str(error)}", 
                ephemeral=True
            )
        else:
            await interaction.followup.send(
                f"❌ An error occurred: {str(error)}", 
                ephemeral=True
            )

async def main():
    """Main function to run the bot."""
    try:
        # Validate configuration
        Config.validate()
        
        # Create and run bot
        bot = DuneBot()
        
        logger.info("Starting Dune Discord Bot...")
        await bot.start(Config.DISCORD_TOKEN)
        
    except KeyboardInterrupt:
        logger.info("Bot shutdown requested by user")
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        raise
    finally:
        logger.info("Bot shutdown complete")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nBot shutdown by user")
    except Exception as e:
        print(f"Fatal error: {e}")
        exit(1)
