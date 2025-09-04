"""Universal dice roller cog supporting multiple RPG systems."""

import discord
from discord.ext import commands
from discord import app_commands
from typing import Optional, Literal
from utils.dice_engines import DiceEngine, DiceParser, DiceSystem, DiceResult

class DiceRoller(commands.Cog):
    """Universal dice rolling commands."""
    
    def __init__(self, bot):
        self.bot = bot
    
    @app_commands.command(name="roll", description="Roll dice using various RPG systems")
    @app_commands.describe(
        dice="Dice notation (e.g., 3d6, 2d10+5)",
        system="Dice system to use",
        difficulty="Difficulty for WoD system (1-10)",
        specialty="Use specialty rules for WoD (10s count double)"
    )
    async def roll_dice(
        self,
        interaction: discord.Interaction,
        dice: str,
        system: Literal["standard", "exploding", "wod"] = "standard",
        difficulty: Optional[int] = 6,
        specialty: bool = False
    ):
        """Universal dice rolling command."""
        try:
            # Parse dice notation
            count, sides, modifier = DiceParser.parse_standard_notation(dice)
            DiceParser.validate_dice_parameters(count, sides)
            
            # Roll based on system
            if system == "standard":
                result = DiceEngine.standard_roll(count, sides, modifier)
            elif system == "exploding":
                result = DiceEngine.exploding_roll(count, sides, modifier)
            elif system == "wod":
                if difficulty < 1 or difficulty > 10:
                    await interaction.response.send_message("❌ WoD difficulty must be between 1 and 10.", ephemeral=True)
                    return
                result = DiceEngine.world_of_darkness_roll(count, difficulty, specialty)
            else:
                await interaction.response.send_message("❌ Invalid dice system.", ephemeral=True)
                return
            
            # Create response embed
            embed = self.create_dice_embed(result, dice, system, interaction.user)
            await interaction.response.send_message(embed=embed)
            
        except ValueError as e:
            await interaction.response.send_message(f"❌ Error: {str(e)}", ephemeral=True)
        except Exception as e:
            await interaction.response.send_message(f"❌ Unexpected error: {str(e)}", ephemeral=True)
    
    def create_dice_embed(self, result: DiceResult, dice_notation: str, system: str, user: discord.User) -> discord.Embed:
        """Create a formatted embed for dice roll results."""
        # Color based on result quality
        if result.system == DiceSystem.WORLD_OF_DARKNESS:
            if result.botch:
                color = discord.Color.red()
            elif result.successes >= 5:
                color = discord.Color.gold()
            elif result.successes >= 3:
                color = discord.Color.green()
            elif result.successes > 0:
                color = discord.Color.blue()
            else:
                color = discord.Color.light_grey()
        else:
            color = discord.Color.blue()
        
        embed = discord.Embed(
            title=f"🎲 {system.title()} Dice Roll",
            color=color,
            timestamp=discord.utils.utcnow()
        )
        
        embed.set_author(name=user.display_name, icon_url=user.display_avatar.url)
        
        # Dice notation and rolls
        embed.add_field(name="Dice", value=f"`{dice_notation}`", inline=True)
        
        # Format individual rolls
        rolls_display = self.format_rolls(result)
        embed.add_field(name="Rolls", value=rolls_display, inline=True)
        
        # System-specific results
        if result.system == DiceSystem.STANDARD:
            embed.add_field(name="Total", value=f"**{result.total}**", inline=True)
            if result.details.get('modifier', 0) != 0:
                mod = result.details['modifier']
                embed.add_field(name="Modifier", value=f"{mod:+d}", inline=True)
        
        elif result.system == DiceSystem.EXPLODING:
            embed.add_field(name="Total", value=f"**{result.total}**", inline=True)
            if result.exploded_dice:
                embed.add_field(name="Exploded", value=f"{len(result.exploded_dice)} dice", inline=True)
        
        elif result.system == DiceSystem.WORLD_OF_DARKNESS:
            embed.add_field(name="Successes", value=f"**{result.successes}**", inline=True)
            embed.add_field(name="Difficulty", value=f"{result.details['difficulty']}", inline=True)
            
            if result.botch:
                embed.add_field(name="Result", value="💀 **BOTCH!**", inline=False)
            elif result.successes >= 5:
                embed.add_field(name="Result", value="🌟 **Exceptional Success!**", inline=False)
            elif result.successes >= 3:
                embed.add_field(name="Result", value="✅ **Great Success!**", inline=False)
            elif result.successes > 0:
                embed.add_field(name="Result", value="✅ **Success**", inline=False)
            else:
                embed.add_field(name="Result", value="❌ **Failure**", inline=False)
            
            if result.details.get('ones', 0) > 0:
                embed.add_field(name="Ones", value=f"{result.details['ones']}", inline=True)
        
        return embed
    
    def format_rolls(self, result: DiceResult) -> str:
        """Format individual dice rolls for display."""
        if len(result.rolls) <= 10:
            # Show individual rolls
            formatted_rolls = []
            for roll in result.rolls:
                if result.system == DiceSystem.WORLD_OF_DARKNESS:
                    difficulty = result.details['difficulty']
                    if roll >= difficulty:
                        formatted_rolls.append(f"**{roll}**")  # Success
                    elif roll == 1:
                        formatted_rolls.append(f"~~{roll}~~")  # Botch
                    else:
                        formatted_rolls.append(str(roll))
                else:
                    formatted_rolls.append(str(roll))
            return f"[{', '.join(formatted_rolls)}]"
        else:
            # Too many rolls, show summary
            return f"[{len(result.rolls)} dice rolled]"
    
    @app_commands.command(name="roll-help", description="Show help for dice rolling systems")
    async def roll_help(self, interaction: discord.Interaction):
        """Show comprehensive help for dice rolling."""
        embed = discord.Embed(
            title="🎲 Dice Rolling Help",
            description="Comprehensive guide to using the dice roller",
            color=discord.Color.blue()
        )
        
        embed.add_field(
            name="📝 Dice Notation",
            value=(
                "`3d6` - Roll 3 six-sided dice\n"
                "`2d10+5` - Roll 2d10, add 5\n"
                "`1d20-2` - Roll 1d20, subtract 2\n"
                "`d6` - Roll 1 six-sided die"
            ),
            inline=False
        )
        
        embed.add_field(
            name="🎯 Standard System",
            value=(
                "Basic dice rolling with modifiers\n"
                "**Example:** `/roll 3d6+2 system:standard`\n"
                "Shows total of all dice plus modifier"
            ),
            inline=False
        )
        
        embed.add_field(
            name="💥 Exploding System",
            value=(
                "Dice explode on maximum roll\n"
                "**Example:** `/roll 3d6 system:exploding`\n"
                "Reroll and add when you roll max value"
            ),
            inline=False
        )
        
        embed.add_field(
            name="🌙 World of Darkness",
            value=(
                "Count successes vs difficulty\n"
                "**Example:** `/roll 5d10 system:wod difficulty:7`\n"
                "Rolls ≥ difficulty = success, 1s may cause botch\n"
                "Use `specialty:true` for 10s counting double"
            ),
            inline=False
        )
        
        embed.set_footer(text="For Dune 2d20 system, use /dune-roll command")
        
        await interaction.response.send_message(embed=embed, ephemeral=True)

async def setup(bot):
    """Setup function for the cog."""
    await bot.add_cog(DiceRoller(bot))
