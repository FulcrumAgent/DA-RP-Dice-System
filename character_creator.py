import discord
from discord import Interaction, Button, ButtonStyle, Select, SelectOption, Embed
from discord.ui import View, Button, Select

class CharacterCreator:
    def __init__(self, interaction: discord.Interaction):
        self.interaction = interaction
        self.current_step = 1
        self.character = {
            'name': None,
            'archetype': None,
            'skill_points': None,
            'skills': {},
            'talents': [],
            'assets': [],
            'drives': [],
            'traits': []
        }
        self.skill_points = {
            'default': 24,
            'Mentat': 26,
            'Fremen': 22,
            'Trooper': 24,
            'Swordsman': 24,
            'Bene Gesserit': 26,
            'Smuggler': 22
        }
        self.skills = ['Battle', 'Navigation', 'Survival', 'Influence', 'Knowledge']
        self.archetypes = ['Mentat', 'Fremen', 'Trooper', 'Swordsman', 'Bene Gesserit', 'Smuggler']
        self.assets = [
            'Water Still Suit', 'Personal Stillsuit', 'Water Still Suit',
            'Personal Stillsuit', 'Personal Stillsuit', 'Personal Stillsuit',
            'Personal Stillsuit', 'Personal Stillsuit', 'Personal Stillsuit',
            'Personal Stillsuit', 'Personal Stillsuit', 'Personal Stillsuit',
            'Personal Stillsuit', 'Personal Stillsuit', 'Personal Stillsuit'
        ]  # Add more assets as needed
        
    async def start(self):
        await self.show_step_1()
        
    async def show_step_1(self):
        embed = Embed(title="Character Creation - Step 1/8")
        embed.description = "What is your character's name?\n\nPlease enter a name that's 50 characters or less, using only letters, numbers, spaces, and these symbols: _ -"
        
        await self.interaction.followup.send(embed=embed, view=Step1View(self))
        
    async def show_step_2(self):
        embed = Embed(title="Character Creation - Step 2/8")
        embed.description = "Choose your character's archetype:\n\nEach archetype provides a unique bonus to your skill points."
        
        options = [SelectOption(label=archetype, value=archetype) for archetype in self.archetypes]
        await self.interaction.followup.send(embed=embed, view=Step2View(self, options))
        
    async def show_step_3(self):
        embed = Embed(title="Character Creation - Step 3/8")
        embed.description = f"Distribute {self.skill_points[self.character['archetype']]} skill points among these skills:\n\n" + \
            "\n".join([f"• {skill}: 0" for skill in self.skills])
        embed.add_field(name="Instructions", value="Enter values for each skill separated by spaces.\n" +
            "Example: 5 6 7 6 5")
        
        await self.interaction.followup.send(embed=embed, view=Step3View(self))
        
    async def show_step_4(self):
        embed = Embed(title="Character Creation - Step 4/8")
        embed.description = "Enter two Talents for your character:\n\n" + \
            "Talents are special abilities or unique characteristics."
        
        await self.interaction.followup.send(embed=embed, view=Step4View(self))
        
    async def show_step_5(self):
        embed = Embed(title="Character Creation - Step 5/8")
        embed.description = "Choose three Assets for your character:\n\n" + \
            "Assets are items or resources your character possesses."
        
        options = [SelectOption(label=asset, value=asset) for asset in self.assets]
        await self.interaction.followup.send(embed=embed, view=Step5View(self, options))
        
    async def show_step_6(self):
        embed = Embed(title="Character Creation - Step 6/8")
        embed.description = "Enter two Drives and a belief statement for each:\n\n" + \
            "Drives are your character's motivations and beliefs."
        
        await self.interaction.followup.send(embed=embed, view=Step6View(self))
        
    async def show_step_7(self):
        embed = Embed(title="Character Creation - Step 7/8")
        embed.description = "Enter three Traits that describe your character:\n\n" + \
            "Traits are personality traits or notable characteristics."
        
        await self.interaction.followup.send(embed=embed, view=Step7View(self))
        
    async def show_step_8(self):
        embed = Embed(title="Character Creation - Step 8/8")
        embed.description = "Review your character:\n\n" + \
            f"Name: {self.character['name']}\n" + \
            f"Archetype: {self.character['archetype']}\n\n" + \
            "Skills:\n" + \
            "\n".join([f"• {skill}: {value}" for skill, value in self.character['skills'].items()]) + \
            "\n\nTalents:\n" + \
            "\n".join([f"• {talent}" for talent in self.character['talents']]) + \
            "\n\nAssets:\n" + \
            "\n".join([f"• {asset}" for asset in self.character['assets']]) + \
            "\n\nDrives:\n" + \
            "\n".join([f"• {drive}: {belief}" for drive, belief in self.character['drives']]) + \
            "\n\nTraits:\n" + \
            "\n".join([f"• {trait}" for trait in self.character['traits']])
        
        await self.interaction.followup.send(embed=embed, view=Step8View(self))

class Step1View(View):
    def __init__(self, creator: CharacterCreator):
        super().__init__()
        self.creator = creator
        
    @discord.ui.button(label="Next", style=ButtonStyle.green)
    async def next_button(self, interaction: discord.Interaction):
        await interaction.response.defer()
        await self.creator.show_step_2()

class Step2View(View):
    def __init__(self, creator: CharacterCreator):
        super().__init__()
        self.creator = creator
        self.archetype_select = Select(
            options=[
                SelectOption(label=archetype, value=archetype)
                for archetype in creator.archetypes
            ]
        )
        self.add_item(self.archetype_select)
        
    async def interaction_check(self, interaction: discord.Interaction) -> bool:
        if interaction.user.id != self.creator.interaction.user.id:
            await interaction.response.send_message("This isn't your character creation session!", ephemeral=True)
            return False
        return True
        
    @discord.ui.button(label="Back", style=ButtonStyle.gray)
    async def back_button(self, interaction: discord.Interaction):
        await interaction.response.defer()
        await self.creator.show_step_1()
        
    @discord.ui.button(label="Next", style=ButtonStyle.green)
    async def next_button(self, interaction: discord.Interaction):
        if not self.archetype_select.values:
            await interaction.response.send_message("Please select an archetype!", ephemeral=True)
            return
            
        self.creator.character['archetype'] = self.archetype_select.values[0]
        await interaction.response.defer()
        await self.creator.show_step_3()

class Step3View(View):
    def __init__(self, creator: CharacterCreator):
        super().__init__()
        self.creator = creator
        
    async def interaction_check(self, interaction: discord.Interaction) -> bool:
        if interaction.user.id != self.creator.interaction.user.id:
            await interaction.response.send_message("This isn't your character creation session!", ephemeral=True)
            return False
        return True
        
    @discord.ui.button(label="Back", style=ButtonStyle.gray)
    async def back_button(self, interaction: discord.Interaction):
        await interaction.response.defer()
        await self.creator.show_step_2()
        
    @discord.ui.button(label="Next", style=ButtonStyle.green)
    async def next_button(self, interaction: discord.Interaction):
        await interaction.response.defer()
        await self.creator.show_step_4()

class Step4View(View):
    def __init__(self, creator: CharacterCreator):
        super().__init__()
        self.creator = creator
        
    async def interaction_check(self, interaction: discord.Interaction) -> bool:
        if interaction.user.id != self.creator.interaction.user.id:
            await interaction.response.send_message("This isn't your character creation session!", ephemeral=True)
            return False
        return True
        
    @discord.ui.button(label="Back", style=ButtonStyle.gray)
    async def back_button(self, interaction: discord.Interaction):
        await interaction.response.defer()
        await self.creator.show_step_3()
        
    @discord.ui.button(label="Next", style=ButtonStyle.green)
    async def next_button(self, interaction: discord.Interaction):
        await interaction.response.defer()
        await self.creator.show_step_5()

class Step5View(View):
    def __init__(self, creator: CharacterCreator, options: list):
        super().__init__()
        self.creator = creator
        self.asset_select = Select(options=options, max_values=3)
        self.add_item(self.asset_select)
        
    async def interaction_check(self, interaction: discord.Interaction) -> bool:
        if interaction.user.id != self.creator.interaction.user.id:
            await interaction.response.send_message("This isn't your character creation session!", ephemeral=True)
            return False
        return True
        
    @discord.ui.button(label="Back", style=ButtonStyle.gray)
    async def back_button(self, interaction: discord.Interaction):
        await interaction.response.defer()
        await self.creator.show_step_4()
        
    @discord.ui.button(label="Next", style=ButtonStyle.green)
    async def next_button(self, interaction: discord.Interaction):
        if len(self.asset_select.values) < 3:
            await interaction.response.send_message("Please select 3 assets!", ephemeral=True)
            return
            
        self.creator.character['assets'] = self.asset_select.values
        await interaction.response.defer()
        await self.creator.show_step_6()

class Step6View(View):
    def __init__(self, creator: CharacterCreator):
        super().__init__()
        self.creator = creator
        
    async def interaction_check(self, interaction: discord.Interaction) -> bool:
        if interaction.user.id != self.creator.interaction.user.id:
            await interaction.response.send_message("This isn't your character creation session!", ephemeral=True)
            return False
        return True
        
    @discord.ui.button(label="Back", style=ButtonStyle.gray)
    async def back_button(self, interaction: discord.Interaction):
        await interaction.response.defer()
        await self.creator.show_step_5()
        
    @discord.ui.button(label="Next", style=ButtonStyle.green)
    async def next_button(self, interaction: discord.Interaction):
        await interaction.response.defer()
        await self.creator.show_step_7()

class Step7View(View):
    def __init__(self, creator: CharacterCreator):
        super().__init__()
        self.creator = creator
        
    async def interaction_check(self, interaction: discord.Interaction) -> bool:
        if interaction.user.id != self.creator.interaction.user.id:
            await interaction.response.send_message("This isn't your character creation session!", ephemeral=True)
            return False
        return True
        
    @discord.ui.button(label="Back", style=ButtonStyle.gray)
    async def back_button(self, interaction: discord.Interaction):
        await interaction.response.defer()
        await self.creator.show_step_6()
        
    @discord.ui.button(label="Next", style=ButtonStyle.green)
    async def next_button(self, interaction: discord.Interaction):
        await interaction.response.defer()
        await self.creator.show_step_8()

class Step8View(View):
    def __init__(self, creator: CharacterCreator):
        super().__init__()
        self.creator = creator
        
    async def interaction_check(self, interaction: discord.Interaction) -> bool:
        if interaction.user.id != self.creator.interaction.user.id:
            await interaction.response.send_message("This isn't your character creation session!", ephemeral=True)
            return False
        return True
        
    @discord.ui.button(label="Back", style=ButtonStyle.gray)
    async def back_button(self, interaction: discord.Interaction):
        await interaction.response.defer()
        await self.creator.show_step_7()
        
    @discord.ui.button(label="Finish", style=ButtonStyle.green)
    async def finish_button(self, interaction: discord.Interaction):
        try:
            await interaction.response.defer()
            # TODO: Implement character saving logic
            await interaction.followup.send("Character creation complete!", ephemeral=True)
        except Exception as e:
            await interaction.followup.send(
                f"❌ Error saving character: {str(e)}",
                ephemeral=True
            )
        await interaction.response.defer()
        # TODO: Save character to database
        await interaction.followup.send("Character creation complete!")
