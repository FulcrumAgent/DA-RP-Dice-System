"""Core dice rolling engines for different RPG systems."""

import random
from typing import List, Tuple, Dict, Any
from dataclasses import dataclass
from enum import Enum

class DiceSystem(Enum):
    """Supported dice systems."""
    STANDARD = "standard"
    EXPLODING = "exploding"
    WORLD_OF_DARKNESS = "wod"
    DUNE_2D20 = "dune"

@dataclass
class DiceResult:
    """Result of a dice roll."""
    rolls: List[int]
    total: int
    successes: int = 0
    complications: int = 0
    botch: bool = False
    exploded_dice: List[int] = None
    system: DiceSystem = DiceSystem.STANDARD
    details: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.exploded_dice is None:
            self.exploded_dice = []
        if self.details is None:
            self.details = {}

class DiceEngine:
    """Core dice rolling engine."""
    
    @staticmethod
    def roll_dice(count: int, sides: int) -> List[int]:
        """Roll a number of dice with specified sides."""
        return [random.randint(1, sides) for _ in range(count)]
    
    @staticmethod
    def standard_roll(count: int, sides: int, modifier: int = 0) -> DiceResult:
        """Standard dice roll with optional modifier."""
        rolls = DiceEngine.roll_dice(count, sides)
        total = sum(rolls) + modifier
        
        return DiceResult(
            rolls=rolls,
            total=total,
            system=DiceSystem.STANDARD,
            details={'modifier': modifier}
        )
    
    @staticmethod
    def exploding_roll(count: int, sides: int, modifier: int = 0) -> DiceResult:
        """Exploding dice roll - reroll and add maximum results."""
        rolls = []
        exploded = []
        
        for _ in range(count):
            die_total = 0
            while True:
                roll = random.randint(1, sides)
                die_total += roll
                
                if roll == sides:
                    exploded.append(roll)
                else:
                    break
            
            rolls.append(die_total)
        
        total = sum(rolls) + modifier
        
        return DiceResult(
            rolls=rolls,
            total=total,
            exploded_dice=exploded,
            system=DiceSystem.EXPLODING,
            details={'modifier': modifier, 'exploded_count': len(exploded)}
        )
    
    @staticmethod
    def world_of_darkness_roll(count: int, difficulty: int = 6, specialty: bool = False) -> DiceResult:
        """World of Darkness dice roll - count successes, handle botches."""
        rolls = DiceEngine.roll_dice(count, 10)
        
        successes = 0
        ones = 0
        
        for roll in rolls:
            if roll >= difficulty:
                successes += 1
                # Specialty: 10s count as 2 successes
                if specialty and roll == 10:
                    successes += 1
            elif roll == 1:
                ones += 1
        
        # Botch: no successes and at least one 1
        botch = successes == 0 and ones > 0
        
        # Net successes (1s subtract from successes in some WoD variants)
        net_successes = max(0, successes - ones) if not specialty else successes
        
        return DiceResult(
            rolls=rolls,
            total=sum(rolls),
            successes=net_successes,
            botch=botch,
            system=DiceSystem.WORLD_OF_DARKNESS,
            details={
                'difficulty': difficulty,
                'ones': ones,
                'raw_successes': successes,
                'specialty': specialty
            }
        )
    
    @staticmethod
    def dune_2d20_roll(target: int, bonus_dice: int = 0) -> DiceResult:
        """Dune 2d20 system roll - count successes and complications."""
        # Roll 2d20 + bonus dice
        total_dice = 2 + bonus_dice
        rolls = DiceEngine.roll_dice(total_dice, 20)
        
        successes = 0
        complications = 0
        
        # Count successes (rolls <= target) and complications (20s)
        for roll in rolls:
            if roll <= target:
                successes += 1
            if roll == 20:
                complications += 1
        
        # For bonus dice, only count the best results
        if bonus_dice > 0:
            # Sort rolls to identify which are the "main" 2d20
            sorted_rolls = sorted(rolls)
            main_rolls = sorted_rolls[:2]  # Take the two lowest (best) rolls
            
            # Recalculate with only main rolls for final result
            main_successes = sum(1 for roll in main_rolls if roll <= target)
            main_complications = sum(1 for roll in main_rolls if roll == 20)
            
            return DiceResult(
                rolls=rolls,
                total=sum(rolls),
                successes=main_successes,
                complications=main_complications,
                system=DiceSystem.DUNE_2D20,
                details={
                    'target': target,
                    'bonus_dice': bonus_dice,
                    'main_rolls': main_rolls,
                    'all_successes': successes,
                    'all_complications': complications
                }
            )
        
        return DiceResult(
            rolls=rolls,
            total=sum(rolls),
            successes=successes,
            complications=complications,
            system=DiceSystem.DUNE_2D20,
            details={
                'target': target,
                'bonus_dice': bonus_dice
            }
        )

class DiceParser:
    """Parse dice notation strings."""
    
    @staticmethod
    def parse_standard_notation(notation: str) -> Tuple[int, int, int]:
        """Parse standard dice notation like '3d6+2' or '2d10-1'."""
        # Remove spaces
        notation = notation.replace(' ', '').lower()
        
        # Handle modifier
        modifier = 0
        if '+' in notation:
            parts = notation.split('+')
            notation = parts[0]
            modifier = int(parts[1])
        elif '-' in notation:
            parts = notation.split('-')
            notation = parts[0]
            modifier = -int(parts[1])
        
        # Parse dice notation
        if 'd' not in notation:
            raise ValueError("Invalid dice notation - must contain 'd'")
        
        count_str, sides_str = notation.split('d')
        count = int(count_str) if count_str else 1
        sides = int(sides_str)
        
        return count, sides, modifier
    
    @staticmethod
    def validate_dice_parameters(count: int, sides: int) -> bool:
        """Validate dice parameters are reasonable."""
        if count < 1 or count > 100:
            raise ValueError("Dice count must be between 1 and 100")
        if sides < 2 or sides > 1000:
            raise ValueError("Dice sides must be between 2 and 1000")
        return True
