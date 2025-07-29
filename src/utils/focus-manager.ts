/**
 * Focus Management System - Fixed focus lists with validation
 */

import { SKILL_FOCUS_SUGGESTIONS } from '../data/talents-assets';
import { StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js';

export class FocusManager {
  /**
   * Get all available focuses for a skill
   */
  static getSkillFocuses(skill: string): string[] {
    return SKILL_FOCUS_SUGGESTIONS[skill] || [];
  }

  /**
   * Validate if a focus is valid for a skill
   */
  static isValidFocus(skill: string, focus: string): boolean {
    const validFocuses = this.getSkillFocuses(skill);
    return validFocuses.includes(focus);
  }

  /**
   * Validate multiple focuses for a skill
   */
  static validateFocuses(skill: string, focuses: string[]): { valid: boolean; error?: string } {
    const validFocuses = this.getSkillFocuses(skill);
    
    if (focuses.length === 0) {
      return { valid: false, error: `❌ **No focuses selected** - You must select at least one focus for ${skill}` };
    }

    // Check for duplicates
    const uniqueFocuses = [...new Set(focuses)];
    if (uniqueFocuses.length !== focuses.length) {
      return { valid: false, error: `❌ **Duplicate focuses** - Each focus can only be selected once for ${skill}` };
    }

    // Check if all focuses are valid
    for (const focus of focuses) {
      if (!validFocuses.includes(focus)) {
        return { valid: false, error: `❌ **Invalid focus "${focus}"** - Not available for ${skill}\\n\\n**Valid focuses:** ${validFocuses.join(', ')}` };
      }
    }

    return { valid: true };
  }

  /**
   * Create a select menu for skill focuses
   */
  static createFocusSelectMenu(skill: string, customId: string, maxValues: number = 3): StringSelectMenuBuilder {
    const focuses = this.getSkillFocuses(skill);
    
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(customId)
      .setPlaceholder(`Select focuses for ${skill} (max ${maxValues})`)
      .setMinValues(1)
      .setMaxValues(Math.min(maxValues, focuses.length));

    // Add options for each focus
    focuses.forEach(focus => {
      selectMenu.addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel(focus)
          .setValue(focus)
          .setDescription(`${skill} focus: ${focus}`)
      );
    });

    return selectMenu;
  }

  /**
   * Get focus options for multiple skills (for character creation)
   */
  static getMultiSkillFocusOptions(skills: string[]): { [skill: string]: string[] } {
    const options: { [skill: string]: string[] } = {};
    
    skills.forEach(skill => {
      options[skill] = this.getSkillFocuses(skill);
    });

    return options;
  }

  /**
   * Validate character focus assignments
   */
  static validateCharacterFocuses(
    skillFocuses: { [skill: string]: string[] },
    requiredSkills: string[],
    maxFocusesPerSkill: number = 3
  ): { valid: boolean; error?: string } {
    
    // Check that all required skills have focuses
    for (const skill of requiredSkills) {
      if (!skillFocuses[skill] || skillFocuses[skill].length === 0) {
        return { valid: false, error: `❌ **Missing focuses** - You must select at least one focus for ${skill}` };
      }

      // Validate individual skill focuses
      const validation = this.validateFocuses(skill, skillFocuses[skill]);
      if (!validation.valid) {
        return validation;
      }

      // Check max focuses per skill
      if (skillFocuses[skill].length > maxFocusesPerSkill) {
        return { valid: false, error: `❌ **Too many focuses** - Maximum ${maxFocusesPerSkill} focuses allowed per skill (${skill} has ${skillFocuses[skill].length})` };
      }
    }

    return { valid: true };
  }

  /**
   * Format focuses for display
   */
  static formatFocusesForDisplay(skillFocuses: { [skill: string]: string[] }): string {
    const lines: string[] = [];
    
    Object.entries(skillFocuses).forEach(([skill, focuses]) => {
      if (focuses.length > 0) {
        lines.push(`**${skill}**: ${focuses.join(', ')}`);
      }
    });

    return lines.join('\n') || '*No focuses selected*';
  }

  /**
   * Get all skills that have focuses defined
   */
  static getAllSkillsWithFocuses(): string[] {
    return Object.keys(SKILL_FOCUS_SUGGESTIONS);
  }
}

export { SKILL_FOCUS_SUGGESTIONS as SKILL_FOCUSES };
