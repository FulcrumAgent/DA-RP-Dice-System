"""Dune 2d20 system cog with momentum and threat tracking."""

import discord
from discord.ext import commands
from discord import app_commands
from typing import Optional
from utils.dice_engines import DiceEngine, DiceResult
from utils.database import DataManager

class DuneSystem(commands.Cog):
    """Dune: Adventures in the Imperium 2d20 system."""
    
    def __init__(self, bot):
        self.bot = bot
        self.data_manager = DataManager()
    
    @app_commands.command(name="dune-roll", description="Roll dice using Dune 2d20 system")
    @app_commands.describe(
        skill="Skill name (e.g., Battle, Communicate)",
        drive="Drive name (e.g., Justice, Faith, Duty)",
        target="Target number for the roll",
        bonus="Bonus dice from momentum/assets",
        description="Description of the action"
    )
    async def dune_roll(
        self,
        interaction: discord.Interaction,
        skill: str,
        drive: str,
        target: int,
        bonus: int = 0,
        description: Optional[str] = None
    ):
        """Dune 2d20 system roll."""
        try:
            # Validate parameters
            if target < 1 or target > 20:
                await interaction.response.send_message("❌ Target must be between 1 and 20.", ephemeral=True)
                return
            
            if bonus < 0 or bonus > 5:
                await interaction.response.send_message("❌ Bonus dice must be between 0 and 5.", ephemeral=True)
                return
            
            # Perform the roll
            result = DiceEngine.dune_2d20_roll(target, bonus)
            
            # Get current momentum pool
            guild_id = interaction.guild_id if interaction.guild else 0
            channel_id = interaction.channel_id
            momentum_pool = self.data_manager.get_momentum_pool(guild_id, channel_id)
            
            # Create response embed
            embed = self.create_dune_embed(result, skill, drive, target, bonus, description, interaction.user)
            
            # Add momentum pool info
            embed.add_field(
                name="💫 Current Pools",
                value=f"Momentum: {momentum_pool.momentum} | Threat: {momentum_pool.threat}",
                inline=False
            )
            
            # Add momentum/threat buttons if there are complications or successes
            view = None
            if result.successes > 0 or result.complications > 0:
                view = DuneMomentumView(self.data_manager, guild_id, channel_id, result)
            
            await interaction.response.send_message(embed=embed, view=view)
            
        except Exception as e:
            await interaction.response.send_message(f"❌ Error: {str(e)}", ephemeral=True)
    
    def create_dune_embed(self, result: DiceResult, skill: str, drive: str, target: int, 
                         bonus: int, description: Optional[str], user: discord.User) -> discord.Embed:
        """Create formatted embed for Dune 2d20 results."""
        # Color based on success level
        if result.successes >= 2:
            color = discord.Color.gold()  # Critical success
        elif result.successes == 1:
            color = discord.Color.green()  # Success
        else:
            color = discord.Color.red()  # Failure
        
        embed = discord.Embed(
            title="⚔️ Dune 2d20 Roll",
            color=color,
            timestamp=discord.utils.utcnow()
        )
        
        embed.set_author(name=user.display_name, icon_url=user.display_avatar.url)
        
        # Action description
        if description:
            embed.description = f"*{description}*"
        
        # Roll details
        embed.add_field(name="🎯 Skill + Drive", value=f"{skill} + {drive}", inline=True)
        embed.add_field(name="🎲 Target", value=f"{target}", inline=True)
        embed.add_field(name="➕ Bonus Dice", value=f"{bonus}", inline=True)
        
        # Dice results
        rolls_display = self.format_dune_rolls(result, target)
        embed.add_field(name="🎲 Rolls", value=rolls_display, inline=False)
        
        # Success/Failure
        success_text = self.get_success_text(result.successes)
        embed.add_field(name="📊 Result", value=success_text, inline=True)
        
        # Complications
        if result.complications > 0:
            complication_text = f"⚠️ {result.complications} Complication{'s' if result.complications > 1 else ''}"
            embed.add_field(name="⚠️ Complications", value=complication_text, inline=True)
        
        return embed
    
    def format_dune_rolls(self, result: DiceResult, target: int) -> str:
        """Format Dune dice rolls for display."""
        formatted_rolls = []
        
        if result.details.get('bonus_dice', 0) > 0:
            # Show which rolls were used vs bonus
            main_rolls = result.details.get('main_rolls', result.rolls[:2])
            all_rolls = result.rolls
            
            for i, roll in enumerate(all_rolls):
                if roll in main_rolls and main_rolls.count(roll) > 0:
                    # This is a main roll
                    if roll <= target:
                        formatted_rolls.append(f"**{roll}**✅")
                    elif roll == 20:
                        formatted_rolls.append(f"**{roll}**⚠️")
                    else:
                        formatted_rolls.append(f"**{roll}**")
                    # Remove one instance from main_rolls to handle duplicates
                    main_rolls.remove(roll)
                else:
                    # This is a bonus roll (not used)
                    if roll <= target:
                        formatted_rolls.append(f"~~{roll}~~✅")
                    elif roll == 20:
                        formatted_rolls.append(f"~~{roll}~~⚠️")
                    else:
                        formatted_rolls.append(f"~~{roll}~~")
        else:
            # Standard 2d20 roll
            for roll in result.rolls:
                if roll <= target:
                    formatted_rolls.append(f"**{roll}**✅")
                elif roll == 20:
                    formatted_rolls.append(f"**{roll}**⚠️")
                else:
                    formatted_rolls.append(f"**{roll}**")
        
        return f"[{', '.join(formatted_rolls)}]"
    
    def get_success_text(self, successes: int) -> str:
        """Get descriptive text for success level."""
        if successes >= 2:
            return f"🌟 **Critical Success!** ({successes} successes)"
        elif successes == 1:
            return f"✅ **Success!** ({successes} success)"
        else:
            return "❌ **Failure** (0 successes)"
    
    @app_commands.command(name="momentum", description="Manage momentum and threat pools")
    @app_commands.describe(
        action="Action to perform",
        amount="Amount to add/subtract"
    )
    async def momentum_command(
        self,
        interaction: discord.Interaction,
        action: Optional[str] = "show",
        amount: Optional[int] = 1
    ):
        """Manage momentum and threat pools."""
        guild_id = interaction.guild_id if interaction.guild else 0
        channel_id = interaction.channel_id
        
        if action == "show" or action is None:
            pool = self.data_manager.get_momentum_pool(guild_id, channel_id)
            embed = discord.Embed(
                title="💫 Momentum & Threat Pools",
                color=discord.Color.blue()
            )
            embed.add_field(name="Momentum", value=f"**{pool.momentum}**", inline=True)
            embed.add_field(name="Threat", value=f"**{pool.threat}**", inline=True)
            embed.set_footer(text=f"Last updated: {pool.last_updated}")
            
        elif action == "reset":
            pool = self.data_manager.reset_momentum_pool(guild_id, channel_id)
            embed = discord.Embed(
                title="💫 Pools Reset",
                description="Momentum and Threat pools have been reset to 0.",
                color=discord.Color.green()
            )
            
        else:
            await interaction.response.send_message("❌ Invalid action. Use 'show' or 'reset'.", ephemeral=True)
            return
        
        await interaction.response.send_message(embed=embed)
    
    @app_commands.command(name="dune-help", description="Show help for Dune 2d20 system")
    async def dune_help(self, interaction: discord.Interaction):
        """Show help for Dune 2d20 system."""
        embed = discord.Embed(
            title="⚔️ Dune 2d20 System Help",
            description="Guide to using the Dune: Adventures in the Imperium system",
            color=discord.Color.orange()
        )
        
        embed.add_field(
            name="🎲 Basic Roll",
            value=(
                "`/dune-roll skill:Battle drive:Justice target:12`\n"
                "Rolls 2d20, counts successes (≤ target)\n"
                "20s are complications, 2+ successes = critical"
            ),
            inline=False
        )
        
        embed.add_field(
            name="➕ Bonus Dice",
            value=(
                "`/dune-roll skill:Move drive:Duty target:10 bonus:2`\n"
                "Adds extra d20s, uses best 2 results\n"
                "Spend momentum or use assets for bonus dice"
            ),
            inline=False
        )
        
        embed.add_field(
            name="💫 Momentum & Threat",
            value=(
                "Momentum: Player resource pool\n"
                "Threat: GM resource pool\n"
                "Use `/momentum show` to check current pools\n"
                "Use buttons after rolls to adjust pools"
            ),
            inline=False
        )
        
        embed.add_field(
            name="📊 Success Levels",
            value=(
                "**0 successes:** Failure\n"
                "**1 success:** Success\n"
                "**2+ successes:** Critical Success\n"
                "**20s:** Complications (GM gains Threat)"
            ),
            inline=False
        )
        
        await interaction.response.send_message(embed=embed, ephemeral=True)

class DuneMomentumView(discord.ui.View):
    """Interactive buttons for managing momentum and threat."""
    
    def __init__(self, data_manager: DataManager, guild_id: int, channel_id: int, result: DiceResult):
        super().__init__(timeout=300)  # 5 minute timeout
        self.data_manager = data_manager
        self.guild_id = guild_id
        self.channel_id = channel_id
        self.result = result
    
    @discord.ui.button(label="Spend Momentum", style=discord.ButtonStyle.primary, emoji="💫")
    async def spend_momentum(self, interaction: discord.Interaction, button: discord.ui.Button):
        """Spend momentum for additional effects."""
        pool = self.data_manager.update_momentum(self.guild_id, self.channel_id, momentum_change=-1)
        
        embed = discord.Embed(
            title="💫 Momentum Spent",
            description="1 Momentum spent for additional effect",
            color=discord.Color.blue()
        )
        embed.add_field(name="Current Momentum", value=f"{pool.momentum}", inline=True)
        embed.add_field(name="Current Threat", value=f"{pool.threat}", inline=True)
        
        await interaction.response.send_message(embed=embed, ephemeral=True)
    
    @discord.ui.button(label="Add Threat", style=discord.ButtonStyle.danger, emoji="⚠️")
    async def add_threat(self, interaction: discord.Interaction, button: discord.ui.Button):
        """Add threat from complications."""
        threat_to_add = self.result.complications
        pool = self.data_manager.update_momentum(self.guild_id, self.channel_id, threat_change=threat_to_add)
        
        embed = discord.Embed(
            title="⚠️ Threat Added",
            description=f"{threat_to_add} Threat added from complications",
            color=discord.Color.red()
        )
        embed.add_field(name="Current Momentum", value=f"{pool.momentum}", inline=True)
        embed.add_field(name="Current Threat", value=f"{pool.threat}", inline=True)
        
        await interaction.response.send_message(embed=embed, ephemeral=True)
    
    @discord.ui.button(label="Generate Momentum", style=discord.ButtonStyle.success, emoji="✨")
    async def generate_momentum(self, interaction: discord.Interaction, button: discord.ui.Button):
        """Generate momentum from unused successes."""
        if self.result.successes > 1:
            momentum_to_add = self.result.successes - 1  # Keep 1 success, convert rest to momentum
            pool = self.data_manager.update_momentum(self.guild_id, self.channel_id, momentum_change=momentum_to_add)
            
            embed = discord.Embed(
                title="✨ Momentum Generated",
                description=f"{momentum_to_add} Momentum generated from excess successes",
                color=discord.Color.green()
            )
            embed.add_field(name="Current Momentum", value=f"{pool.momentum}", inline=True)
            embed.add_field(name="Current Threat", value=f"{pool.threat}", inline=True)
            
            await interaction.response.send_message(embed=embed, ephemeral=True)
        else:
            await interaction.response.send_message("❌ Need 2+ successes to generate momentum.", ephemeral=True)

async def setup(bot):
    """Setup function for the cog."""
    await bot.add_cog(DuneSystem(bot))
