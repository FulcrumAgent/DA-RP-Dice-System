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
exports.handleSelectConcept = handleSelectConcept;
exports.handleConceptSetButton = handleConceptSetButton;
exports.handleConceptSetModal = handleConceptSetModal;
exports.handleConceptRemoveButton = handleConceptRemoveButton;
exports.handleConceptContinueButton = handleConceptContinueButton;
exports.handleConceptBackButton = handleConceptBackButton;
const discord_js_1 = require("discord.js");
const character_creation_state_1 = require("../utils/character-creation-state");
const logger_1 = require("../utils/logger");
async function handleSelectConcept(interaction, member) {
    await interaction.deferReply();
    try {
        const state = character_creation_state_1.characterCreationState.getState(member.id, interaction.guild.id);
        if (!state || !state.data.name) {
            await interaction.editReply({
                content: '❌ No character creation in progress. Use `/sheet create` first!'
            });
            return;
        }
        if (!state.data.concepts) {
            await character_creation_state_1.characterCreationState.updateState(member.id, interaction.guild.id, {
                data: { concepts: [] }
            });
        }
        const currentConcepts = state.data.concepts || [];
        const hasConcept = currentConcepts.length > 0;
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0xD4AF37)
            .setTitle('🎭 Character Concept')
            .setDescription(`Your character concept is a single, descriptive phrase or sentence that captures their essence, background, or role.\n\n**Examples:** "Fremen desert warrior", "Noble house spy seeking revenge", "Smuggler with a code of honor"\n\n**Current Concept:**\n${hasConcept ? `**${currentConcepts[0]}**` : '*None selected*'}\n\n${hasConcept ? '✅ **Ready to continue!** Use the "Next Step" button to proceed to Archetype selection (where you can choose multiple traits).' : 'Use the "Set Concept" button to define your character.'}`);
        const buttonRow = new discord_js_1.ActionRowBuilder();
        buttonRow.addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId('concept_set')
            .setLabel(hasConcept ? 'Edit Concept' : 'Set Concept')
            .setStyle(discord_js_1.ButtonStyle.Primary));
        if (hasConcept) {
            buttonRow.addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId('concept_remove')
                .setLabel('Clear Concept')
                .setStyle(discord_js_1.ButtonStyle.Danger));
        }
        if (hasConcept) {
            buttonRow.addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId('concept_continue')
                .setLabel('Next Step: Archetype')
                .setStyle(discord_js_1.ButtonStyle.Success));
        }
        const components = buttonRow.components.length > 0 ? [buttonRow] : [];
        await interaction.editReply({
            embeds: [embed],
            components: components
        });
    }
    catch (error) {
        logger_1.logger.error('Error in handleSelectConcept:', error);
        await interaction.editReply({
            content: '❌ An error occurred while loading concept selection.'
        });
    }
}
async function handleConceptSetButton(interaction, member) {
    try {
        const state = character_creation_state_1.characterCreationState.getState(member.id, interaction.guild.id);
        const currentConcept = state?.data.concepts?.[0] || '';
        const modal = new discord_js_1.ModalBuilder()
            .setCustomId('concept_set_modal')
            .setTitle(currentConcept ? 'Edit Character Concept' : 'Set Character Concept');
        const conceptInput = new discord_js_1.TextInputBuilder()
            .setCustomId('concept_text')
            .setLabel('Character Concept')
            .setStyle(discord_js_1.TextInputStyle.Paragraph)
            .setPlaceholder('e.g., "Fremen desert warrior", "Noble house spy seeking revenge"')
            .setRequired(true)
            .setMaxLength(200)
            .setValue(currentConcept);
        const actionRow = new discord_js_1.ActionRowBuilder().addComponents(conceptInput);
        modal.addComponents(actionRow);
        await interaction.showModal(modal);
    }
    catch (error) {
        logger_1.logger.error('Error in handleConceptAddButton:', error);
        await interaction.reply({
            content: '❌ An error occurred while opening the concept input.',
            ephemeral: true
        });
    }
}
async function handleConceptSetModal(interaction, member) {
    try {
        const conceptText = interaction.fields.getTextInputValue('concept_text').trim();
        if (!conceptText) {
            await interaction.reply({
                content: '❌ Concept cannot be empty.',
                ephemeral: true
            });
            return;
        }
        const state = character_creation_state_1.characterCreationState.getState(member.id, interaction.guild.id);
        if (!state || !state.data.name) {
            await interaction.reply({
                content: '❌ No character creation in progress.',
                ephemeral: true
            });
            return;
        }
        await character_creation_state_1.characterCreationState.updateState(member.id, interaction.guild.id, {
            data: { concepts: [conceptText] }
        });
        await interaction.deferUpdate();
        try {
            const channel = interaction.channel;
            if (channel && 'messages' in channel) {
                const messages = await channel.messages.fetch({ limit: 20 });
                const characterCreationMessage = messages.find(msg => msg.author.id === interaction.client.user?.id &&
                    msg.embeds.length > 0 &&
                    (msg.embeds[0].title?.includes('Character Creation') ||
                        msg.embeds[0].title?.includes('Character Concept') ||
                        msg.embeds[0].title?.includes('Character Name')));
                if (characterCreationMessage) {
                    const guildId = interaction.guild?.id;
                    if (!guildId) {
                        await interaction.followUp({ content: 'This command must be used in a server.', ephemeral: true });
                        return;
                    }
                    const state = character_creation_state_1.characterCreationState.getState(member.id, guildId);
                    if (!state) {
                        await interaction.followUp({ content: 'No character creation in progress.', ephemeral: true });
                        return;
                    }
                    const creationFlow = await Promise.resolve().then(() => __importStar(require('./character-creation-flow')));
                    const session = {
                        ...state,
                        guildId,
                        userId: member.id,
                        channelId: interaction.channelId || undefined,
                        characterData: state.tempData || {},
                        currentStep: 'CONCEPT',
                        lastUpdated: Date.now(),
                        createdAt: state.createdAt || Date.now(),
                        step: 'CONCEPT',
                        data: state.data || {},
                        tempData: state.tempData || {}
                    };
                    const embed = await creationFlow.buildStepEmbed(interaction, 'CONCEPT', session);
                    const buttons = creationFlow.buildNavigationButtons('CONCEPT', session);
                    await characterCreationMessage.edit({
                        embeds: [embed],
                        components: buttons.components.length > 0 ? [buttons] : []
                    });
                }
            }
        }
        catch (updateError) {
            logger_1.logger.warn('Could not update original character creation message:', updateError);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '✅ Concept updated successfully!',
                    ephemeral: true
                });
            }
            else {
                await interaction.followUp({
                    content: '✅ Concept updated successfully!',
                    ephemeral: true
                });
            }
        }
    }
    catch (error) {
        logger_1.logger.error('Error in handleConceptSetModal:', error);
        await interaction.reply({
            content: '❌ An error occurred while setting the concept.',
            ephemeral: true
        });
    }
}
async function handleConceptRemoveButton(interaction, member) {
    try {
        const state = character_creation_state_1.characterCreationState.getState(member.id, interaction.guild.id);
        if (!state || !state.data.name) {
            await interaction.reply({
                content: '❌ No character creation in progress.',
                ephemeral: true
            });
            return;
        }
        const currentConcept = state.data.concepts?.[0];
        if (!currentConcept) {
            await interaction.reply({
                content: '❌ No concept to remove.',
                ephemeral: true
            });
            return;
        }
        await character_creation_state_1.characterCreationState.updateState(member.id, interaction.guild.id, {
            data: { concepts: [] }
        });
        const { showCreationPanel, CREATION_STEPS } = await Promise.resolve().then(() => __importStar(require('./character-creation-flow')));
        await showCreationPanel(interaction, member, CREATION_STEPS.CONCEPT);
    }
    catch (error) {
        logger_1.logger.error('Error in handleConceptRemoveButton:', error);
        await interaction.reply({
            content: '❌ An error occurred while clearing the concept.',
            ephemeral: true
        });
    }
}
async function handleConceptContinueButton(interaction, member) {
    const { showCreationPanel, CREATION_STEPS } = await Promise.resolve().then(() => __importStar(require('./character-creation-flow')));
    await showCreationPanel(interaction, member, CREATION_STEPS.ARCHETYPE);
}
async function handleConceptBackButton(interaction, member) {
    await handleSelectConcept(interaction, member);
}
