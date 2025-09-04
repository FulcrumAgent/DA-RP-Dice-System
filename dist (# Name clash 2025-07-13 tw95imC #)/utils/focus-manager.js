"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SKILL_FOCUSES = exports.FocusManager = void 0;
const talents_assets_1 = require("../data/talents-assets");
Object.defineProperty(exports, "SKILL_FOCUSES", { enumerable: true, get: function () { return talents_assets_1.SKILL_FOCUS_SUGGESTIONS; } });
const discord_js_1 = require("discord.js");
class FocusManager {
    static getSkillFocuses(skill) {
        return talents_assets_1.SKILL_FOCUS_SUGGESTIONS[skill] || [];
    }
    static isValidFocus(skill, focus) {
        const validFocuses = this.getSkillFocuses(skill);
        return validFocuses.includes(focus);
    }
    static validateFocuses(skill, focuses) {
        const validFocuses = this.getSkillFocuses(skill);
        if (focuses.length === 0) {
            return { valid: false, error: `❌ **No focuses selected** - You must select at least one focus for ${skill}` };
        }
        const uniqueFocuses = [...new Set(focuses)];
        if (uniqueFocuses.length !== focuses.length) {
            return { valid: false, error: `❌ **Duplicate focuses** - Each focus can only be selected once for ${skill}` };
        }
        for (const focus of focuses) {
            if (!validFocuses.includes(focus)) {
                return { valid: false, error: `❌ **Invalid focus "${focus}"** - Not available for ${skill}\\n\\n**Valid focuses:** ${validFocuses.join(', ')}` };
            }
        }
        return { valid: true };
    }
    static createFocusSelectMenu(skill, customId, maxValues = 3) {
        const focuses = this.getSkillFocuses(skill);
        const selectMenu = new discord_js_1.StringSelectMenuBuilder()
            .setCustomId(customId)
            .setPlaceholder(`Select focuses for ${skill} (max ${maxValues})`)
            .setMinValues(1)
            .setMaxValues(Math.min(maxValues, focuses.length));
        focuses.forEach(focus => {
            selectMenu.addOptions(new discord_js_1.StringSelectMenuOptionBuilder()
                .setLabel(focus)
                .setValue(focus)
                .setDescription(`${skill} focus: ${focus}`));
        });
        return selectMenu;
    }
    static getMultiSkillFocusOptions(skills) {
        const options = {};
        skills.forEach(skill => {
            options[skill] = this.getSkillFocuses(skill);
        });
        return options;
    }
    static validateCharacterFocuses(skillFocuses, requiredSkills, maxFocusesPerSkill = 3) {
        for (const skill of requiredSkills) {
            if (!skillFocuses[skill] || skillFocuses[skill].length === 0) {
                return { valid: false, error: `❌ **Missing focuses** - You must select at least one focus for ${skill}` };
            }
            const validation = this.validateFocuses(skill, skillFocuses[skill]);
            if (!validation.valid) {
                return validation;
            }
            if (skillFocuses[skill].length > maxFocusesPerSkill) {
                return { valid: false, error: `❌ **Too many focuses** - Maximum ${maxFocusesPerSkill} focuses allowed per skill (${skill} has ${skillFocuses[skill].length})` };
            }
        }
        return { valid: true };
    }
    static formatFocusesForDisplay(skillFocuses) {
        const lines = [];
        Object.entries(skillFocuses).forEach(([skill, focuses]) => {
            if (focuses.length > 0) {
                lines.push(`**${skill}**: ${focuses.join(', ')}`);
            }
        });
        return lines.join('\n') || '*No focuses selected*';
    }
    static getAllSkillsWithFocuses() {
        return Object.keys(talents_assets_1.SKILL_FOCUS_SUGGESTIONS);
    }
}
exports.FocusManager = FocusManager;
