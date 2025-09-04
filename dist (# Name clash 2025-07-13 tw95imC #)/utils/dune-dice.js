"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiceEngine = exports.DuneDiceEngine = void 0;
class DuneDiceEngine {
    static performTest(character, attributeName, skillName, options = {}) {
        const { difficulty = 1, bonusDice = 0, assets = [], traits = [], useDetermination = false, complicationRange = 20 } = options;
        const attributeValue = character.attributes[attributeName];
        const skill = character.skills.find(s => s.name === skillName);
        const skillValue = skill?.value || 0;
        const targetNumber = attributeValue + skillValue;
        let totalDice = 2;
        totalDice += bonusDice;
        totalDice += assets.length;
        if (useDetermination)
            totalDice += 1;
        const rolls = [];
        for (let i = 0; i < totalDice; i++) {
            rolls.push(Math.floor(Math.random() * 20) + 1);
        }
        let successes = 0;
        let complications = 0;
        let criticalHits = 0;
        rolls.forEach(roll => {
            if (roll <= targetNumber) {
                successes++;
                if (roll === 1) {
                    criticalHits++;
                    successes++;
                }
            }
            if (roll >= complicationRange) {
                complications++;
            }
        });
        const testSuccess = successes >= difficulty;
        let momentum = 0;
        let threat = 0;
        if (testSuccess) {
            momentum = Math.max(0, successes - difficulty);
        }
        if (complications > 0) {
            threat = complications;
        }
        const narrative = this.generateNarrative(testSuccess, successes, difficulty, complications, criticalHits, attributeName, skillName);
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
    static generateNarrative(success, successes, difficulty, complications, criticalHits, attribute, skill) {
        let narrative = '';
        if (success) {
            if (criticalHits > 0) {
                narrative = `🎯 **Critical Success!** Your ${attribute} and ${skill} combine perfectly.`;
            }
            else if (successes >= difficulty + 2) {
                narrative = `✨ **Excellent Success!** You exceed expectations with your ${skill}.`;
            }
            else {
                narrative = `✅ **Success!** Your ${skill} proves adequate for the task.`;
            }
        }
        else {
            if (successes === difficulty - 1) {
                narrative = `⚠️ **Close Failure.** Your ${skill} almost succeeds, but falls just short.`;
            }
            else {
                narrative = `❌ **Failure.** Your ${skill} attempt doesn't achieve the desired result.`;
            }
        }
        if (complications > 0) {
            if (complications === 1) {
                narrative += ` However, a complication arises...`;
            }
            else {
                narrative += ` However, multiple complications emerge...`;
            }
        }
        return narrative;
    }
    static spendMomentumForDice(momentumSpent) {
        return momentumSpent;
    }
    static calculateAssistance(assistingCharacters, skill) {
        let bonusDice = 0;
        assistingCharacters.forEach(char => {
            const assistSkill = char.skills.find(s => s.name === skill);
            if (assistSkill && assistSkill.value > 0) {
                bonusDice += 1;
            }
        });
        return Math.min(bonusDice, 3);
    }
    static rollDamage(baseDamage, effects = 0, weaponQualities = []) {
        let totalDamage = baseDamage;
        let totalEffects = effects;
        const special = [];
        const damageDice = Math.floor(Math.random() * 6) + 1;
        const effectsDice = Math.floor(Math.random() * 6) + 1;
        totalDamage += damageDice;
        totalEffects += effectsDice;
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
    static generateNPCStats(tier, concept) {
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
    static calculateExtendedTest(results, targetSuccesses, timeLimit) {
        const totalSuccesses = results.reduce((sum, result) => sum + result.successes, 0);
        const totalComplications = results.reduce((sum, result) => sum + result.complications, 0);
        const progress = Math.min(100, (totalSuccesses / targetSuccesses) * 100);
        const complete = totalSuccesses >= targetSuccesses;
        let timeRemaining;
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
    static rollInitiative(character, skill = 'discipline') {
        const skillValue = character.skills.find(s => s.name === skill)?.value || 0;
        const roll = Math.floor(Math.random() * 20) + 1;
        return roll + skillValue;
    }
    static calculateRangeModifiers(range, cover) {
        let difficulty = 1;
        let description = '';
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
exports.DuneDiceEngine = DuneDiceEngine;
exports.DiceEngine = DuneDiceEngine;
