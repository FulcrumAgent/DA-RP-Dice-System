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
exports.BASIC_ARCHETYPES = void 0;
exports.handleArchetypeSelectButton = handleArchetypeSelectButton;
exports.handleArchetypeChoice = handleArchetypeChoice;
const discord_js_1 = require("discord.js");
const character_creation_state_1 = require("../utils/character-creation-state");
const logger_1 = require("../utils/logger");
exports.BASIC_ARCHETYPES = [
    {
        value: 'agent',
        name: 'Agent',
        description: 'Espionage and covert operations specialist',
        emoji: '🕵️‍♂️'
    },
    {
        value: 'bene_gesserit',
        name: 'Bene Gesserit',
        description: 'Sisterhood member with Voice and political skills',
        emoji: '🔮'
    },
    {
        value: 'courtier',
        name: 'Courtier',
        description: 'Imperial court diplomat and schemer',
        emoji: '🎭'
    },
    {
        value: 'duellist',
        name: 'Duellist',
        description: 'Master of personal combat and formal duels',
        emoji: '⚔️'
    },
    {
        value: 'envoy',
        name: 'Envoy',
        description: 'Skilled negotiator between factions',
        emoji: '🤝'
    },
    {
        value: 'face_dancer',
        name: 'Face Dancer',
        description: 'Shape-shifting Bene Tleilax agent',
        emoji: '🎭'
    },
    {
        value: 'fremen',
        name: 'Fremen',
        description: 'Desert warrior and sandrider',
        emoji: '🏜️'
    },
    {
        value: 'guild_agent',
        name: 'Guild Agent',
        description: 'Spacing Guild representative',
        emoji: '🌌'
    },
    {
        value: 'mentat',
        name: 'Mentat',
        description: 'Human computer and strategist',
        emoji: '🧠'
    },
    {
        value: 'noble',
        name: 'Noble',
        description: 'Member of a Great House',
        emoji: '👑'
    },
    {
        value: 'swordmaster',
        name: 'Swordmaster',
        description: 'Elite warrior and bodyguard',
        emoji: '⚔️'
    },
    {
        value: 'trooper',
        name: 'Trooper',
        description: 'Professional military fighter',
        emoji: '🪖'
    },
    {
        value: 'smuggler',
        name: 'Smuggler',
        description: 'Black market trader and rogue',
        emoji: '🚀'
    },
    {
        value: 'planetologist',
        name: 'Planetologist',
        description: 'Planetary scientist and ecologist',
        emoji: '🔬'
    }
];
async function handleArchetypeSelectButton(interaction, member) {
    try {
        await interaction.deferUpdate();
        const message = await interaction.fetchReply();
        const embed = message.embeds?.[0];
        const selectMenu = new discord_js_1.ActionRowBuilder()
            .addComponents(new discord_js_1.StringSelectMenuBuilder()
            .setCustomId('archetype_choice')
            .setPlaceholder('Choose your character\'s archetype...')
            .addOptions(exports.BASIC_ARCHETYPES.map(archetype => new discord_js_1.StringSelectMenuOptionBuilder()
            .setLabel(`${archetype.emoji} ${archetype.name}`)
            .setDescription(archetype.description)
            .setValue(archetype.value))));
        await interaction.editReply({
            content: '\n\n**Choose your character\'s archetype:**',
            embeds: embed ? [embed] : [],
            components: [selectMenu.toJSON()]
        });
    }
    catch (error) {
        logger_1.logger.error('Error in handleArchetypeSelectButton:', error);
        await interaction.editReply({
            content: '❌ An error occurred while showing archetype options.',
            components: [],
            embeds: interaction.message.embeds ? interaction.message.embeds : []
        });
    }
}
async function handleArchetypeChoice(interaction, member) {
    try {
        const selectedValue = interaction.values[0];
        const selectedArchetype = exports.BASIC_ARCHETYPES.find(arch => arch.value === selectedValue);
        if (!selectedArchetype) {
            await interaction.editReply({
                content: '❌ Invalid archetype selection. Please try again.',
                components: [],
                embeds: interaction.message.embeds ? interaction.message.embeds : []
            });
            return;
        }
        await character_creation_state_1.characterCreationState.updateState(member.id, interaction.guild.id, {
            data: { archetypes: [selectedArchetype.name] }
        });
        try {
            await interaction.deferUpdate();
            await interaction.editReply({
                content: selectedArchetype ? `✅ **${selectedArchetype.emoji} ${selectedArchetype.name}** selected!` : '❌ Invalid archetype selection.',
                embeds: interaction.message.embeds ? interaction.message.embeds : [],
                components: []
            });
            const { CREATION_STEPS, showCreationPanel } = await Promise.resolve().then(() => __importStar(require('./character-creation-flow')));
            await showCreationPanel(interaction, member, CREATION_STEPS.SKILLS, selectedArchetype ? `✅ **${selectedArchetype.emoji} ${selectedArchetype.name}** selected!` : '❌ Invalid archetype selection.');
        }
        catch (error) {
            logger_1.logger.error('Error showing updated creation panel:', error);
            await interaction.editReply({
                content: '❌ Failed to update character creation panel. Please try again.',
                components: [],
                embeds: interaction.message.embeds ? interaction.message.embeds : []
            });
            return;
        }
    }
    catch (error) {
        logger_1.logger.error('Error in handleArchetypeChoice:', error);
        await interaction.editReply({
            content: '❌ An error occurred while selecting the archetype.',
            components: [],
            embeds: interaction.message.embeds ? interaction.message.embeds : []
        });
    }
}
