"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiceParser = exports.DiceEngine = exports.DiceSystem = void 0;
var DiceSystem;
(function (DiceSystem) {
    DiceSystem["STANDARD"] = "standard";
    DiceSystem["EXPLODING"] = "exploding";
    DiceSystem["WORLD_OF_DARKNESS"] = "wod";
    DiceSystem["DUNE_2D20"] = "dune";
})(DiceSystem || (exports.DiceSystem = DiceSystem = {}));
class DiceEngine {
    static rollDice(count, sides) {
        return Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
    }
    static standardRoll(count, sides, modifier = 0) {
        const rolls = this.rollDice(count, sides);
        const total = rolls.reduce((sum, roll) => sum + roll, 0) + modifier;
        return {
            rolls,
            total,
            successes: 0,
            complications: 0,
            botch: false,
            explodedDice: [],
            system: DiceSystem.STANDARD,
            details: { modifier }
        };
    }
    static explodingRoll(count, sides, modifier = 0) {
        const rolls = [];
        const exploded = [];
        for (let i = 0; i < count; i++) {
            let dieTotal = 0;
            let currentRoll;
            do {
                currentRoll = Math.floor(Math.random() * sides) + 1;
                dieTotal += currentRoll;
                if (currentRoll === sides) {
                    exploded.push(currentRoll);
                }
            } while (currentRoll === sides);
            rolls.push(dieTotal);
        }
        const total = rolls.reduce((sum, roll) => sum + roll, 0) + modifier;
        return {
            rolls,
            total,
            successes: 0,
            complications: 0,
            botch: false,
            explodedDice: exploded,
            system: DiceSystem.EXPLODING,
            details: { modifier, explodedCount: exploded.length }
        };
    }
    static worldOfDarknessRoll(count, difficulty = 6, specialty = false) {
        const rolls = this.rollDice(count, 10);
        let successes = 0;
        let ones = 0;
        for (const roll of rolls) {
            if (roll >= difficulty) {
                successes++;
                if (specialty && roll === 10) {
                    successes++;
                }
            }
            else if (roll === 1) {
                ones++;
            }
        }
        const botch = successes === 0 && ones > 0;
        const netSuccesses = specialty ? successes : Math.max(0, successes - ones);
        return {
            rolls,
            total: rolls.reduce((sum, roll) => sum + roll, 0),
            successes: netSuccesses,
            complications: 0,
            botch,
            explodedDice: [],
            system: DiceSystem.WORLD_OF_DARKNESS,
            details: {
                difficulty,
                ones,
                rawSuccesses: successes,
                specialty
            }
        };
    }
    static dune2d20Roll(target, bonusDice = 0) {
        const totalDice = 2 + bonusDice;
        const rolls = this.rollDice(totalDice, 20);
        let successes = 0;
        let complications = 0;
        for (const roll of rolls) {
            if (roll <= target) {
                successes++;
            }
            if (roll === 20) {
                complications++;
            }
        }
        if (bonusDice > 0) {
            const sortedRolls = [...rolls].sort((a, b) => a - b);
            const mainRolls = sortedRolls.slice(0, 2);
            const mainSuccesses = mainRolls.filter(roll => roll <= target).length;
            const mainComplications = mainRolls.filter(roll => roll === 20).length;
            return {
                rolls,
                total: rolls.reduce((sum, roll) => sum + roll, 0),
                successes: mainSuccesses,
                complications: mainComplications,
                botch: false,
                explodedDice: [],
                system: DiceSystem.DUNE_2D20,
                details: {
                    target,
                    bonusDice,
                    mainRolls,
                    allSuccesses: successes,
                    allComplications: complications
                }
            };
        }
        return {
            rolls,
            total: rolls.reduce((sum, roll) => sum + roll, 0),
            successes,
            complications,
            botch: false,
            explodedDice: [],
            system: DiceSystem.DUNE_2D20,
            details: {
                target,
                bonusDice
            }
        };
    }
}
exports.DiceEngine = DiceEngine;
class DiceParser {
    static parseStandardNotation(notation) {
        const cleanNotation = notation.replace(/\s/g, '').toLowerCase();
        let modifier = 0;
        let diceNotation = cleanNotation;
        if (cleanNotation.includes('+')) {
            const parts = cleanNotation.split('+');
            diceNotation = parts[0];
            modifier = parseInt(parts[1], 10);
        }
        else if (cleanNotation.includes('-')) {
            const parts = cleanNotation.split('-');
            diceNotation = parts[0];
            modifier = -parseInt(parts[1], 10);
        }
        if (!diceNotation.includes('d')) {
            throw new Error("Invalid dice notation - must contain 'd'");
        }
        const [countStr, sidesStr] = diceNotation.split('d');
        const count = countStr ? parseInt(countStr, 10) : 1;
        const sides = parseInt(sidesStr, 10);
        return { count, sides, modifier };
    }
    static validateDiceParameters(count, sides) {
        if (count < 1 || count > 100) {
            throw new Error('Dice count must be between 1 and 100');
        }
        if (sides < 2 || sides > 1000) {
            throw new Error('Dice sides must be between 2 and 1000');
        }
    }
}
exports.DiceParser = DiceParser;
