"""Extra-Life charity integration cog."""

import discord
from discord.ext import commands, tasks
from discord import app_commands
import aiohttp
import asyncio
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from config import Config
from utils.database import DataManager

class ExtraLife(commands.Cog):
    """Extra-Life charity event integration."""
    
    def __init__(self, bot):
        self.bot = bot
        self.data_manager = DataManager()
        self.session = None
        self.announcement_channel = None
        self.pinned_message = None
        
        # Start background tasks
        if Config.EXTRALIFE_TEAM_ID or Config.EXTRALIFE_PARTICIPANT_ID:
            self.update_stats.start()
    
    async def cog_load(self):
        """Initialize HTTP session when cog loads."""
        self.session = aiohttp.ClientSession()
    
    async def cog_unload(self):
        """Clean up HTTP session when cog unloads."""
        if self.session:
            await self.session.close()
        self.update_stats.cancel()
    
    @app_commands.command(name="extralife", description="Extra-Life charity integration commands")
    @app_commands.describe(
        action="Action to perform",
        channel="Channel for announcements (admin only)"
    )
    async def extralife_command(
        self,
        interaction: discord.Interaction,
        action: str = "stats",
        channel: Optional[discord.TextChannel] = None
    ):
        """Main Extra-Life command."""
        if action == "stats":
            await self.show_stats(interaction)
        elif action == "setup":
            await self.setup_announcements(interaction, channel)
        elif action == "announce":
            await self.post_announcement(interaction)
        elif action == "refresh":
            await self.refresh_stats(interaction)
        else:
            await interaction.response.send_message(
                "❌ Invalid action. Use: `stats`, `setup`, `announce`, or `refresh`",
                ephemeral=True
            )
    
    async def show_stats(self, interaction: discord.Interaction):
        """Show current Extra-Life statistics."""
        await interaction.response.defer()
        
        try:
            # Try to get cached data first
            cached_data = self.data_manager.load_extralife_cache()
            if cached_data:
                data = cached_data
            else:
                data = await self.fetch_extralife_data()
                if data:
                    self.data_manager.save_extralife_cache(data)
            
            if not data:
                await interaction.followup.send("❌ Unable to fetch Extra-Life data. Check configuration.", ephemeral=True)
                return
            
            embed = self.create_stats_embed(data)
            await interaction.followup.send(embed=embed)
            
        except Exception as e:
            await interaction.followup.send(f"❌ Error fetching stats: {str(e)}", ephemeral=True)
    
    async def setup_announcements(self, interaction: discord.Interaction, channel: Optional[discord.TextChannel]):
        """Setup announcement channel (admin only)."""
        if not interaction.user.guild_permissions.administrator:
            await interaction.response.send_message("❌ Administrator permissions required.", ephemeral=True)
            return
        
        if not channel:
            channel = interaction.channel
        
        self.announcement_channel = channel
        
        embed = discord.Embed(
            title="🎮 Extra-Life Setup Complete",
            description=f"Announcements will be posted in {channel.mention}",
            color=discord.Color.green()
        )
        
        await interaction.response.send_message(embed=embed)
    
    async def post_announcement(self, interaction: discord.Interaction):
        """Post Extra-Life event announcement."""
        if not self.announcement_channel:
            await interaction.response.send_message(
                "❌ No announcement channel set. Use `/extralife setup` first.",
                ephemeral=True
            )
            return
        
        await interaction.response.defer()
        
        try:
            data = await self.fetch_extralife_data()
            if not data:
                await interaction.followup.send("❌ Unable to fetch Extra-Life data.", ephemeral=True)
                return
            
            embed = self.create_announcement_embed(data)
            
            # Post to announcement channel
            message = await self.announcement_channel.send(embed=embed)
            
            # Try to pin the message
            try:
                await message.pin()
                self.pinned_message = message
            except discord.Forbidden:
                pass  # No permission to pin
            
            await interaction.followup.send(f"✅ Announcement posted in {self.announcement_channel.mention}")
            
        except Exception as e:
            await interaction.followup.send(f"❌ Error posting announcement: {str(e)}", ephemeral=True)
    
    async def refresh_stats(self, interaction: discord.Interaction):
        """Manually refresh Extra-Life statistics."""
        await interaction.response.defer()
        
        try:
            data = await self.fetch_extralife_data()
            if data:
                self.data_manager.save_extralife_cache(data)
                embed = self.create_stats_embed(data)
                await interaction.followup.send("✅ Stats refreshed!", embed=embed)
            else:
                await interaction.followup.send("❌ Unable to fetch fresh data.", ephemeral=True)
                
        except Exception as e:
            await interaction.followup.send(f"❌ Error refreshing: {str(e)}", ephemeral=True)
    
    async def fetch_extralife_data(self) -> Optional[Dict[str, Any]]:
        """Fetch data from Extra-Life API."""
        if not self.session:
            self.session = aiohttp.ClientSession()
        
        data = {}
        
        try:
            # Fetch team data
            if Config.EXTRALIFE_TEAM_ID:
                team_url = Config.get_extralife_team_url()
                async with self.session.get(team_url) as response:
                    if response.status == 200:
                        data['team'] = await response.json()
            
            # Fetch participant data
            if Config.EXTRALIFE_PARTICIPANT_ID:
                participant_url = Config.get_extralife_participant_url()
                async with self.session.get(participant_url) as response:
                    if response.status == 200:
                        data['participant'] = await response.json()
            
            return data if data else None
            
        except Exception as e:
            print(f"Error fetching Extra-Life data: {e}")
            return None
    
    def create_stats_embed(self, data: Dict[str, Any]) -> discord.Embed:
        """Create embed showing current statistics."""
        embed = discord.Embed(
            title="🎮 Extra-Life Statistics",
            color=discord.Color.blue(),
            timestamp=datetime.utcnow()
        )
        
        # Team stats
        if 'team' in data:
            team = data['team']
            embed.add_field(
                name="👥 Team Stats",
                value=(
                    f"**Name:** {team.get('name', 'Unknown')}\n"
                    f"**Goal:** ${team.get('fundraisingGoal', 0):,.2f}\n"
                    f"**Raised:** ${team.get('sumDonations', 0):,.2f}\n"
                    f"**Members:** {team.get('numMembers', 0)}"
                ),
                inline=True
            )
        
        # Participant stats
        if 'participant' in data:
            participant = data['participant']
            embed.add_field(
                name="🎯 Participant Stats",
                value=(
                    f"**Name:** {participant.get('displayName', 'Unknown')}\n"
                    f"**Goal:** ${participant.get('fundraisingGoal', 0):,.2f}\n"
                    f"**Raised:** ${participant.get('sumDonations', 0):,.2f}\n"
                    f"**Donors:** {participant.get('numDonations', 0)}"
                ),
                inline=True
            )
        
        # Progress calculation
        if 'team' in data:
            team = data['team']
            goal = team.get('fundraisingGoal', 1)
            raised = team.get('sumDonations', 0)
            progress = min(100, (raised / goal) * 100) if goal > 0 else 0
            
            embed.add_field(
                name="📊 Progress",
                value=f"**{progress:.1f}%** of goal reached",
                inline=False
            )
        
        embed.set_footer(text="Data from Extra-Life API • Updates every 5 minutes")
        
        return embed
    
    def create_announcement_embed(self, data: Dict[str, Any]) -> discord.Embed:
        """Create announcement embed for events."""
        embed = discord.Embed(
            title="🎮 Extra-Life Charity Event!",
            description=(
                "Join us in supporting Children's Miracle Network Hospitals! "
                "Every donation helps kids in our local hospitals."
            ),
            color=discord.Color.gold()
        )
        
        if 'team' in data:
            team = data['team']
            embed.add_field(
                name="🎯 Our Goal",
                value=f"${team.get('fundraisingGoal', 0):,.2f}",
                inline=True
            )
            embed.add_field(
                name="💰 Raised So Far",
                value=f"${team.get('sumDonations', 0):,.2f}",
                inline=True
            )
            embed.add_field(
                name="👥 Team Members",
                value=f"{team.get('numMembers', 0)} heroes",
                inline=True
            )
        
        embed.add_field(
            name="🎮 How to Help",
            value=(
                "• Donate directly to our team\n"
                "• Share our fundraising page\n"
                "• Join our gaming events\n"
                "• Spread the word!"
            ),
            inline=False
        )
        
        if Config.EXTRALIFE_TEAM_ID:
            team_page = f"https://www.extra-life.org/team/{Config.EXTRALIFE_TEAM_ID}"
            embed.add_field(
                name="🔗 Donation Link",
                value=f"[Visit Our Team Page]({team_page})",
                inline=False
            )
        
        embed.set_footer(text="Thank you for supporting children's hospitals! 💙")
        
        return embed
    
    @tasks.loop(minutes=5)
    async def update_stats(self):
        """Background task to update statistics."""
        try:
            data = await self.fetch_extralife_data()
            if data:
                self.data_manager.save_extralife_cache(data)
                
                # Update pinned message if it exists
                if self.pinned_message and self.announcement_channel:
                    try:
                        embed = self.create_announcement_embed(data)
                        await self.pinned_message.edit(embed=embed)
                    except (discord.NotFound, discord.Forbidden):
                        self.pinned_message = None
                        
        except Exception as e:
            print(f"Error in background stats update: {e}")
    
    @update_stats.before_loop
    async def before_update_stats(self):
        """Wait for bot to be ready before starting background task."""
        await self.bot.wait_until_ready()
    
    @app_commands.command(name="extralife-help", description="Show Extra-Life integration help")
    async def extralife_help(self, interaction: discord.Interaction):
        """Show help for Extra-Life commands."""
        embed = discord.Embed(
            title="🎮 Extra-Life Integration Help",
            description="Commands for charity event support",
            color=discord.Color.blue()
        )
        
        embed.add_field(
            name="📊 `/extralife stats`",
            value="Show current fundraising statistics",
            inline=False
        )
        
        embed.add_field(
            name="⚙️ `/extralife setup`",
            value="Setup announcement channel (admin only)",
            inline=False
        )
        
        embed.add_field(
            name="📢 `/extralife announce`",
            value="Post event announcement with current stats",
            inline=False
        )
        
        embed.add_field(
            name="🔄 `/extralife refresh`",
            value="Manually refresh statistics from API",
            inline=False
        )
        
        embed.add_field(
            name="🔧 Configuration",
            value=(
                "Set these in your `.env` file:\n"
                "• `EXTRALIFE_TEAM_ID`\n"
                "• `EXTRALIFE_PARTICIPANT_ID`\n"
                "Stats auto-update every 5 minutes"
            ),
            inline=False
        )
        
        await interaction.response.send_message(embed=embed, ephemeral=True)

async def setup(bot):
    """Setup function for the cog."""
    await bot.add_cog(ExtraLife(bot))
