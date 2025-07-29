/**
 * Advanced Dune 2d20 Dice System with proper mechanics
 */

import { DuneCharacter } from './character-manager';

export interface DuneRollResult {
  success: boolean;
  successes: number;
  complications: number;
  momentum: number;
  threat: number;
  criticalHits: number;
  rolls: number[];
  difficulty: number;
  narrative: string;
  details: {
    attribute: number;
    skill: number;
    bonusDice: number;
    assets: string[];
    traits: string[];
    determination: boolean;
  };
}

export interface DuneRollOptions {
  difficulty?: number;
  bonusDice?: number;
  assets?: string[];
  traits?: string[];
  useDetermination?: boolean;
  assistingCharacters?: string[];
  complicationRange?: number;
}

export class DuneDiceEngine {
  /**
   * Perform a Dune 2d20 test
   */
  static performTest(
    character: DuneCharacter,
    attributeName: keyof DuneCharacter['attributes'],
    skillName: string,
    options: DuneRollOptions = {}
  ): DuneRollResult {
    const {
      difficulty = 1,
      bonusDice = 0,
      assets = [],
      traits = [],
      useDetermination = false,
      complicationRange = 20
    } = options;

    // Get attribute and skill values
    const attributeValue = character.attributes[attributeName];
    const skill = character.skills.find(s => s.name === skillName);
    const skillValue = skill?.value || 0;

    // Calculate target number
    const targetNumber = attributeValue + skillValue;

    // Calculate total dice pool
    let totalDice = 2; // Base 2d20
    totalDice += bonusDice;
    totalDice += assets.length; // Each asset adds a die
    if (useDetermination) totalDice += 1;

    // Roll dice
    const rolls: number[] = [];
    for (let i = 0; i < totalDice; i++) {
      rolls.push(Math.floor(Math.random() * 20) + 1);
    }

    // Count successes and complications
    let successes = 0;
    let complications = 0;
    let criticalHits = 0;

    rolls.forEach(roll => {
      if (roll <= targetNumber) {
        successes++;
        if (roll === 1) {
          criticalHits++;
          successes++; // Critical hits count as 2 successes
        }
      }
      if (roll >= complicationRange) {
        complications++;
      }
    });

    // Check for success
    const testSuccess = successes >= difficulty;

    // Calculate momentum and threat
    let momentum = 0;
    let threat = 0;

    if (testSuccess) {
      momentum = Math.max(0, successes - difficulty);
    }

    if (complications > 0) {
      threat = complications;
    }

    // Generate narrative description
    const narrative = this.generateNarrative(
      testSuccess,
      successes,
      difficulty,
      complications,
      criticalHits,
      attributeName,
      skillName
    );

    return {
      success: testSuccess,
      successes,
      complications,
      momentum,
      threat,
      criticalHits,
      rolls,
      difficulty,
      narrative,
      details: {
        attribute: attributeValue,
        skill: skillValue,
        bonusDice,
        assets,
        traits,
        determination: useDetermination
      }
    };
  }

  /**
   * Generate narrative description of roll result
   */
  private static generateNarrative(
    success: boolean,
    successes: number,
    difficulty: number,
    complications: number,
    criticalHits: number,
    attribute: string,
    skill: string
  ): string {
    let narrative = '';

    if (success) {
      if (criticalHits > 0) {
        narrative = `🎯 **Critical Success!** Your ${attribute} and ${skill} combine perfectly.`;
      } else if (successes >= difficulty + 2) {
        narrative = `✨ **Excellent Success!** You exceed expectations with your ${skill}.`;
      } else {
        narrative = `✅ **Success!** Your ${skill} proves adequate for the task.`;
      }
    } else {
      if (successes === difficulty - 1) {
        narrative = `⚠️ **Close Failure.** Your ${skill} almost succeeds, but falls just short.`;
      } else {
        narrative = `❌ **Failure.** Your ${skill} attempt doesn't achieve the desired result.`;
      }
    }

    if (complications > 0) {
      if (complications === 1) {
        narrative += ` However, a complication arises...`;
      } else {
        narrative += ` However, multiple complications emerge...`;
      }
    }

    return narrative;
  }

  /**
   * Spend momentum for additional dice
   */
  static spendMomentumForDice(momentumSpent: number): number {
    // Each point of momentum = 1 additional die
    return momentumSpent;
  }

  /**
   * Calculate assistance bonus
   */
  static calculateAssistance(assistingCharacters: DuneCharacter[], skill: string): number {
    let bonusDice = 0;
    
    assistingCharacters.forEach(char => {
      const assistSkill = char.skills.find(s => s.name === skill);
      if (assistSkill && assistSkill.value > 0) {
        bonusDice += 1; // Each assisting character with the skill adds 1 die
      }
    });

    return Math.min(bonusDice, 3); // Maximum 3 bonus dice from assistance
  }

  /**
   * Perform damage roll
   */
  static rollDamage(
    baseDamage: number,
    effects: number = 0,
    weaponQualities: string[] = []
  ): { damage: number; effects: number; special: string[] } {
    let totalDamage = baseDamage;
    let totalEffects = effects;
    const special: string[] = [];

    // Roll damage dice
    const damageDice = Math.floor(Math.random() * 6) + 1;
    const effectsDice = Math.floor(Math.random() * 6) + 1;

    totalDamage += damageDice;
    totalEffects += effectsDice;

    // Apply weapon qualities
    weaponQualities.forEach(quality => {
      switch (quality.toLowerCase()) {
        case 'vicious':
          if (damageDice >= 5) {
            totalDamage += 1;
            special.push('Vicious effect triggered');
          }
          break;
        case 'intense':
          if (effectsDice >= 5) {
            totalEffects += 1;
            special.push('Intense effect triggered');
          }
          break;
        case 'piercing':
          special.push('Piercing - ignores armor');
          break;
      }
    });

    return {
      damage: totalDamage,
      effects: totalEffects,
      special
    };
  }

  /**
   * Generate quick NPC stats
   */
  static generateNPCStats(
    tier: 'minion' | 'toughened' | 'nemesis'
  ): {
    attributes: { [key: string]: number };
    skills: { [key: string]: number };
    vigor: number;
    resolve: number;
  } {
    const baseStats = {
      minion: { attr: 7, skill: 1, vigor: 3, resolve: 2 },
      toughened: { attr: 9, skill: 2, vigor: 5, resolve: 3 },
      nemesis: { attr: 11, skill: 3, vigor: 8, resolve: 5 }
    };

    const stats = baseStats[tier];
    
    return {
      attributes: {
        muscle: stats.attr,
        move: stats.attr,
        intellect: stats.attr,
        awareness: stats.attr,
        communication: stats.attr,
        discipline: stats.attr
      },
      skills: {
        battle: stats.skill,
        command: stats.skill,
        discipline: stats.skill,
        investigate: stats.skill,
        persuade: stats.skill,
        stealth: stats.skill
      },
      vigor: stats.vigor,
      resolve: stats.resolve
    };
  }

  /**
   * Calculate extended test progress
   */
  static calculateExtendedTest(
    results: DuneRollResult[],
    targetSuccesses: number,
    timeLimit?: number
  ): {
    totalSuccesses: number;
    progress: number;
    complete: boolean;
    timeRemaining?: number;
    complications: number;
  } {
    const totalSuccesses = results.reduce((sum, result) => sum + result.successes, 0);
    const totalComplications = results.reduce((sum, result) => sum + result.complications, 0);
    const progress = Math.min(100, (totalSuccesses / targetSuccesses) * 100);
    const complete = totalSuccesses >= targetSuccesses;

    let timeRemaining: number | undefined;
    if (timeLimit) {
      timeRemaining = Math.max(0, timeLimit - results.length);
    }

    return {
      totalSuccesses,
      progress,
      complete,
      timeRemaining,
      complications: totalComplications
    };
  }

  /**
   * Generate conflict initiative
   */
  static rollInitiative(
    character: DuneCharacter,
    skill: 'battle' | 'discipline' | 'move' = 'discipline'
  ): number {
    const skillValue = character.skills.find(s => s.name === skill)?.value || 0;
    const roll = Math.floor(Math.random() * 20) + 1;
    return roll + skillValue;
  }

  /**
   * Calculate range and cover modifiers
   */
  static calculateRangeModifiers(
    range: 'close' | 'medium' | 'long' | 'extreme',
    cover: 'none' | 'light' | 'heavy' | 'total'
  ): { difficulty: number; description: string } {
    let difficulty = 1;
    let description = '';

    // Range modifiers
    switch (range) {
      case 'close':
        difficulty += 0;
        description += 'Close range';
        break;
      case 'medium':
        difficulty += 1;
        description += 'Medium range (+1 difficulty)';
        break;
      case 'long':
        difficulty += 2;
        description += 'Long range (+2 difficulty)';
        break;
      case 'extreme':
        difficulty += 3;
        description += 'Extreme range (+3 difficulty)';
        break;
    }

    // Cover modifiers
    switch (cover) {
      case 'none':
        break;
      case 'light':
        difficulty += 1;
        description += ', light cover (+1 difficulty)';
        break;
      case 'heavy':
        difficulty += 2;
        description += ', heavy cover (+2 difficulty)';
        break;
      case 'total':
        difficulty += 3;
        description += ', total cover (+3 difficulty)';
        break;
    }

    return { difficulty, description };
  }
}

export { DuneDiceEngine as DiceEngine };
