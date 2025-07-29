"use strict";
/**
 * Core dice rolling engines for different RPG systems
 */
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
    /**
     * Roll a number of dice with specified sides
     */
    static rollDice(count, sides) {
        return Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
    }
    /**
     * Standard dice roll with optional modifier
     */
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
    /**
     * Exploding dice roll - reroll and add maximum results
     */
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
    /**
     * World of Darkness dice roll - count successes, handle botches
     */
    static worldOfDarknessRoll(count, difficulty = 6, specialty = false) {
        const rolls = this.rollDice(count, 10);
        let successes = 0;
        let ones = 0;
        for (const roll of rolls) {
            if (roll >= difficulty) {
                successes++;
                // Specialty: 10s count as 2 successes
                if (specialty && roll === 10) {
                    successes++;
                }
            }
            else if (roll === 1) {
                ones++;
            }
        }
        // Botch: no successes and at least one 1
        const botch = successes === 0 && ones > 0;
        // Net successes (1s subtract from successes in some WoD variants)
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
    /**
     * Dune 2d20 system roll - count successes and complications
     */
    static dune2d20Roll(target, bonusDice = 0) {
        // Roll 2d20 + bonus dice
        const totalDice = 2 + bonusDice;
        const rolls = this.rollDice(totalDice, 20);
        let successes = 0;
        let complications = 0;
        // Count successes (rolls <= target) and complications (20s)
        for (const roll of rolls) {
            if (roll <= target) {
                successes++;
            }
            if (roll === 20) {
                complications++;
            }
        }
        // For bonus dice, only count the best results
        if (bonusDice > 0) {
            // Sort rolls to identify which are the "main" 2d20
            const sortedRolls = [...rolls].sort((a, b) => a - b);
            const mainRolls = sortedRolls.slice(0, 2); // Take the two lowest (best) rolls
            // Recalculate with only main rolls for final result
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
    /**
     * Parse standard dice notation like '3d6+2' or '2d10-1'
     */
    static parseStandardNotation(notation) {
        // Remove spaces and convert to lowercase
        const cleanNotation = notation.replace(/\s/g, '').toLowerCase();
        // Handle modifier
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
        // Parse dice notation
        if (!diceNotation.includes('d')) {
            throw new Error("Invalid dice notation - must contain 'd'");
        }
        const [countStr, sidesStr] = diceNotation.split('d');
        const count = countStr ? parseInt(countStr, 10) : 1;
        const sides = parseInt(sidesStr, 10);
        return { count, sides, modifier };
    }
    /**
     * Validate dice parameters are reasonable
     */
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
