"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleFocusesSelect = handleFocusesSelect;
exports.handleFocusSelect = handleFocusSelect;
const discord_js_1 = require("discord.js");
const character_creation_state_1 = require("../utils/character-creation-state");
const character_creation_flow_1 = require("./character-creation-flow");
const logger_1 = require("../utils/logger");
const character_creation_flow_2 = require("./character-creation-flow");
const FOCUS_OPTIONS = {
    Battle: [
        { skill: 'Battle', focus: 'Blades', description: 'Expertise with melee weapons' },
        { skill: 'Battle', focus: 'Projectiles', description: 'Proficiency with ranged weapons' },
        { skill: 'Battle', focus: 'Unarmed', description: 'Mastery of hand-to-hand combat' },
        { skill: 'Battle', focus: 'Tactics', description: 'Strategic battlefield thinking' }
    ],
    Communicate: [
        { skill: 'Communicate', focus: 'Negotiation', description: 'Reaching agreements through discussion' },
        { skill: 'Communicate', focus: 'Deception', description: 'Manipulating others' },
        { skill: 'Communicate', focus: 'Diplomacy', description: 'Formal negotiations and treaties' },
        { skill: 'Communicate', focus: 'Seduction', description: 'Romantic persuasion' }
    ],
    Discipline: [
        { skill: 'Discipline', focus: 'Fear', description: 'Resistance to fear and intimidation' },
        { skill: 'Discipline', focus: 'Pain', description: 'Endurance of physical pain' },
        { skill: 'Discipline', focus: 'Temptation', description: 'Resistance to temptation and corruption' },
        { skill: 'Discipline', focus: 'Concentration', description: 'Mental focus and clarity' }
    ],
    Move: [
        { skill: 'Move', focus: 'Ornithopters', description: 'Piloting ornithopters' },
        { skill: 'Move', focus: 'Groundcars', description: 'Expertise with ground vehicles' },
        { skill: 'Move', focus: 'Animals', description: 'Handling and riding animals' },
        { skill: 'Move', focus: 'Stealth', description: 'Moving unseen' },
        { skill: 'Move', focus: 'Desert', description: 'Surviving in arid environments' },
        { skill: 'Move', focus: 'Urban', description: 'Navigating cities' },
        { skill: 'Move', focus: 'Wilderness', description: 'Surviving in natural environments' }
    ],
    Understand: [
        { skill: 'Understand', focus: 'Emotions', description: 'Understanding emotional states' },
        { skill: 'Understand', focus: 'Deception', description: 'Detecting lies and manipulation' },
        { skill: 'Understand', focus: 'Motivation', description: 'Understanding what drives people' },
        { skill: 'Understand', focus: 'Empathy', description: 'Feeling and sharing emotions' },
        { skill: 'Understand', focus: 'History', description: 'Knowledge of past events and cultures' },
        { skill: 'Understand', focus: 'Religion', description: 'Understanding religious practices' },
        { skill: 'Understand', focus: 'Culture', description: 'Knowledge of social customs' },
        { skill: 'Understand', focus: 'Science', description: 'Scientific knowledge and principles' },
        { skill: 'Understand', focus: 'Medicine', description: 'Medical knowledge and practice' },
        { skill: 'Understand', focus: 'Technology', description: 'Understanding and working with technology' },
        { skill: 'Understand', focus: 'Spice', description: 'Understanding spice and its effects' }
    ]
};
async function handleFocusesSelect(interaction, member) {
    try {
        if (!interaction.guildId) {
            await interaction.reply({
                content: '❌ This command must be used in a server channel.',
                ephemeral: true
            });
            return;
        }
        const state = character_creation_state_1.characterCreationState.getState(member.id, interaction.guildId);
        if (!state) {
            await interaction.reply({
                content: '❌ No character creation in progress. Use `/character create` to start.',
                ephemeral: true
            });
            return;
        }
        if (!state.data) {
            await interaction.reply({
                content: '❌ Invalid character data. Please start a new character creation.',
                ephemeral: true
            });
            return;
        }
        await interaction.deferUpdate();
        const panel = await buildFocusPanel(member, state);
        if (!panel) {
            const { showCreationPanel } = await Promise.resolve().then(() => __importStar(require('./character-creation-flow')));
            const skills = state.data.skills || {};
            const focuses = state.data.focuses || {};
            const allSkillsHaveFocuses = Object.entries(skills).every(([skill, value]) => {
                const skillValue = typeof value === 'number' ? value : 0;
                return skillValue === 0 || (focuses && typeof focuses[skill] === 'string');
            });
            if (allSkillsHaveFocuses) {
                await showCreationPanel(interaction, member, character_creation_flow_2.CREATION_STEPS.DRIVES, '✅ All focuses have been selected! Moving to the next step.');
            }
            else {
                logger_1.logger.error('Failed to build focus panel but not all skills have focuses');
                await interaction.editReply({
                    content: '❌ An error occurred while building the focus selection panel. Please try again.',
                    components: [],
                    embeds: []
                });
            }
            return;
        }
        await interaction.editReply({
            embeds: [panel.embed],
            components: [panel.menu]
        });
    }
    catch (error) {
        logger_1.logger.error('Error in handleFocusesSelect:', error);
        if (interaction.replied || interaction.deferred) {
            await interaction.editReply({
                content: '❌ An error occurred while showing the focus selection panel.',
                components: [],
                embeds: []
            });
        }
        else {
            await interaction.reply({
                content: '❌ An error occurred while showing the focus selection panel.',
                ephemeral: true
            });
        }
    }
}
async function buildFocusPanel(member, state) {
    try {
        if (!state.data) {
            logger_1.logger.warn('No character data found in state');
            return null;
        }
        const characterData = state.data;
        const skills = characterData.skills || {};
        const focuses = characterData.focuses || {};
        const nextSkill = Object.entries(skills).find(([skill, value]) => {
            const skillValue = typeof value === 'number' ? value : 0;
            return skillValue > 0 && !focuses[skill];
        });
        if (!nextSkill) {
            return null;
        }
        const [skill, value] = nextSkill;
        const currentFocuses = Object.entries(focuses);
        const availableFocuses = FOCUS_OPTIONS[skill] || [];
        const usedFocuses = new Set(currentFocuses.map(([, f]) => f));
        const filteredFocuses = availableFocuses.filter((f) => {
            return typeof f === 'object' &&
                f !== null &&
                'focus' in f &&
                typeof f.focus === 'string' &&
                !usedFocuses.has(f.focus);
        });
        if (filteredFocuses.length === 0) {
            logger_1.logger.warn(`No available focuses for skill: ${skill}`);
            return null;
        }
        if (!filteredFocuses || filteredFocuses.length === 0) {
            logger_1.logger.warn(`No valid focuses available for skill: ${skill}`);
            return null;
        }
        const selectMenu = new discord_js_1.StringSelectMenuBuilder()
            .setCustomId('focus_select')
            .setPlaceholder(`Select a focus for ${skill} (${value})`)
            .addOptions(filteredFocuses
            .filter((f) => !!f && typeof f === 'object' && 'focus' in f && 'description' in f)
            .map(focus => ({
            label: focus.focus.slice(0, 100),
            description: (focus.description || '').slice(0, 100),
            value: `${skill}:${focus.focus}`.slice(0, 100),
        })));
        const row = new discord_js_1.ActionRowBuilder().addComponents(selectMenu);
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('Select Focus')
            .setDescription(`### Select a focus for ${skill} (${value})\n\nEach skill can have one focus. Choose carefully as this represents your character's area of expertise.`)
            .setColor('#0099ff');
        if (currentFocuses.length > 0) {
            const validFocuses = currentFocuses.filter(([, f]) => f);
            if (validFocuses.length > 0) {
                embed.addFields({
                    name: 'Current Focuses',
                    value: validFocuses.map(([s, f]) => `• **${s}**: ${f}`).join('\n'),
                    inline: false
                });
            }
        }
        return {
            embed,
            menu: row,
            skill,
            value: typeof value === 'number' ? value : 0
        };
    }
    catch (error) {
        logger_1.logger.error('Error in buildFocusPanel:', error);
        return null;
    }
}
async function handleFocusSelect(interaction, member) {
    try {
        if (!interaction.guildId) {
            await interaction.reply({
                content: '❌ This command must be used in a server channel.',
                ephemeral: true
            });
            return;
        }
        await interaction.deferUpdate();
        const state = character_creation_state_1.characterCreationState.getState(member.id, interaction.guildId);
        if (!state || !state.data) {
            await interaction.editReply({
                content: '❌ No character creation in progress or invalid state.',
                components: [],
                embeds: []
            });
            return;
        }
        const selectedValue = interaction.values[0];
        if (typeof selectedValue !== 'string') {
            await interaction.editReply({
                content: '❌ Invalid focus selection. Please try again.',
                components: [],
                embeds: []
            });
            return;
        }
        const [skill, focus] = selectedValue.split(':');
        if (!skill || !focus) {
            await interaction.editReply({
                content: '❌ Invalid focus format. Please try again.',
                components: [],
                embeds: []
            });
            return;
        }
        const currentData = state.data;
        const updatedFocuses = {
            ...(currentData.focuses || {})
        };
        updatedFocuses[skill] = focus;
        await character_creation_state_1.characterCreationState.updateState(member.id, interaction.guildId, {
            data: {
                ...currentData,
                focuses: updatedFocuses
            }
        });
        const updatedState = character_creation_state_1.characterCreationState.getState(member.id, interaction.guildId);
        if (!updatedState) {
            await interaction.editReply({
                content: '❌ Error: Failed to get updated state.',
                components: [],
                embeds: []
            });
            return;
        }
        const updatedData = updatedState.data;
        const currentSkills = updatedData.skills || {};
        const currentFocuses = updatedData.focuses || {};
        const skillsNeedingFocus = Object.entries(currentSkills).reduce((count, [, value]) => {
            const skillValue = typeof value === 'number' ? value : 0;
            return count + (skillValue > 0 ? 1 : 0);
        }, 0);
        const selectedFocusesCount = Object.values(currentFocuses).filter(f => typeof f === 'string' && f.trim() !== '').length;
        if (selectedFocusesCount >= skillsNeedingFocus) {
            await (0, character_creation_flow_1.showCreationPanel)(interaction, member, 'DRIVES', `✅ Selected focus: ${focus} (${skill})`);
            return;
        }
        await (0, character_creation_flow_1.showCreationPanel)(interaction, member, 'FOCUSES', `✅ Selected ${skill} focus: ${focus}!`);
    }
    catch (error) {
        logger_1.logger.error('Error in handleFocusSelect:', error);
        if (interaction.replied || interaction.deferred) {
            await interaction.editReply({
                content: '❌ An error occurred while processing your focus selection. Please try again.',
                components: [],
                embeds: []
            });
        }
        else {
            await interaction.reply({
                content: '❌ An error occurred while processing your focus selection. Please try again.',
                ephemeral: true
            });
        }
    }
}
