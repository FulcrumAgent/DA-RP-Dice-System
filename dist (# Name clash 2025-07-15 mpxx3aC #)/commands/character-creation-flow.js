"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.characterCreationSessions = exports.CREATION_STEPS = void 0;
exports.buildNavigationButtons = buildNavigationButtons;
exports.showCreationPanel = showCreationPanel;
exports.handleNavigationButton = handleNavigation;
const discord_js_1 = require("discord.js");
const character_1 = require("../types/character");
Object.defineProperty(exports, "CREATION_STEPS", { enumerable: true, get: function () { return character_1.CREATION_STEPS; } });
const logger_1 = require("../utils/logger");
const DEFAULT_RESOURCE_POOLS = {
    health: 5,
    resolve: 5,
    momentum: 5
};
const characterCreationSessions = new Map();
exports.characterCreationSessions = characterCreationSessions;
function buildNavigationButtons(currentStep, session) {
    const currentIndex = Object.values(character_1.CREATION_STEPS).indexOf(currentStep);
    const isFirstStep = currentIndex === 0;
    const isLastStep = currentIndex === Object.values(character_1.CREATION_STEPS).length - 1;
    const canContinue = canProceedToNext(currentStep, session.characterData);
    const row = new discord_js_1.ActionRowBuilder();
    if (!isFirstStep) {
        row.addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId(`nav_prev_${session.userId}_${session.guildId}`)
            .setLabel('◀ Previous')
            .setStyle(discord_js_1.ButtonStyle.Secondary));
    }
    const nextButton = new discord_js_1.ButtonBuilder()
        .setCustomId(`nav_next_${session.userId}_${session.guildId}`)
        .setStyle(discord_js_1.ButtonStyle.Primary);
    if (isLastStep) {
        nextButton.setLabel('✅ Complete');
    }
    else {
        nextButton.setLabel('Next ▶');
        if (!canContinue) {
            nextButton.setDisabled(true);
        }
    }
    row.addComponents(nextButton);
    return row;
}
const STEP_DESCRIPTIONS = {
    [character_1.CREATION_STEPS.NAME]: '🏷️ **Set Your Character Name**\n\nChoose a name that fits the Dune universe. Consider names from various cultures and houses.',
    [character_1.CREATION_STEPS.CONCEPT]: '💭 **Define Your Character Concept**\n\nDescribe your character in a single phrase. Examples:\n• "Fremen desert warrior"\n• "Noble house spy seeking revenge"\n• "Guild navigator apprentice"',
    [character_1.CREATION_STEPS.ARCHETYPE]: '🎨 **Select Your Archetype**\n\nChoose the archetype that best represents your character\'s role and background in the Imperium.',
    [character_1.CREATION_STEPS.SKILLS]: '⚔️ **Assign Skill Points**\n\nDistribute points among the five core skills:\n• **Battle** - Combat and warfare\n• **Communicate** - Social interaction and manipulation\n• **Discipline** - Mental and physical self-control\n• **Move** - Physical movement and piloting\n• **Understand** - Knowledge and investigation',
    [character_1.CREATION_STEPS.FOCUSES]: '🎯 **Choose Skill Focuses**\n\nSelect specific areas of expertise within each skill you\'ve invested in. Each skill with points needs at least one focus.',
    [character_1.CREATION_STEPS.DRIVES]: '🔥 **Set Your Drives**\n\nChoose three drives that motivate your character. These represent your core beliefs and goals.',
    [character_1.CREATION_STEPS.DRIVE_STATEMENTS]: '📜 **Write Drive Statements**\n\nCreate specific statements for each of your drives that explain how they manifest in your character.',
    [character_1.CREATION_STEPS.TALENTS]: '✨ **Select Talents**\n\nChoose special abilities and talents that make your character unique.',
    [character_1.CREATION_STEPS.ASSETS]: '💼 **Choose Assets**\n\nSelect equipment, connections, and resources your character possesses.',
    [character_1.CREATION_STEPS.TRAITS]: '🎭 **Add Character Traits**\n\nDefine distinctive characteristics, flaws, and quirks that make your character memorable.',
    [character_1.CREATION_STEPS.STARTING_POOLS]: '📊 **Set Resource Pools**\n\nDetermine your starting Health, Resolve, and Momentum values.',
    [character_1.CREATION_STEPS.SUMMARY]: '📋 **Review Your Character**\n\nReview all your choices before finalizing your character.',
    [character_1.CREATION_STEPS.FINALIZE]: '✅ **Finalize Character**\n\nComplete the character creation process and save your character.'
};
function getResourcePools(characterData) {
    if (characterData.resourcePools) {
        const { health, resolve, momentum } = characterData.resourcePools;
        return {
            health: health || 5,
            resolve: resolve || 5,
            momentum: momentum || 2
        };
    }
    else {
        return DEFAULT_RESOURCE_POOLS;
    }
}
function getCurrentStepIndex(step) {
    return Object.keys(character_1.CREATION_STEPS).indexOf(step);
}
function getTotalSteps() {
    return Object.keys(character_1.CREATION_STEPS).length;
}
function buildProgressBar(currentStep) {
    const totalSteps = getTotalSteps();
    const currentStepIndex = getCurrentStepIndex(currentStep);
    const progress = Math.round(((currentStepIndex + 1) / totalSteps) * 10);
    return `[${'='.repeat(progress)}${' '.repeat(10 - progress)}] ${currentStepIndex + 1}/${totalSteps}`;
}
function canProceedToNext(step, characterData) {
    switch (step) {
        case character_1.CREATION_STEPS.NAME:
            return !!(characterData.name && characterData.name.trim().length > 0);
        case character_1.CREATION_STEPS.CONCEPT:
            return !!(characterData.concepts && characterData.concepts.length > 0);
        case character_1.CREATION_STEPS.ARCHETYPE:
            return !!(characterData.archetypes && characterData.archetypes.length > 0);
        case character_1.CREATION_STEPS.SKILLS: {
            const skills = characterData.skills || {};
            return Object.values(skills).filter(v => v > 0).length >= 4;
        }
        case character_1.CREATION_STEPS.FOCUSES: {
            const focuses = characterData.focuses || {};
            const skillsWithPoints = characterData.skills ? Object.entries(characterData.skills)
                .filter(([, value]) => value > 0)
                .map(([key]) => key) : [];
            return skillsWithPoints.every((skill) => focuses[skill]);
        }
        case character_1.CREATION_STEPS.DRIVES:
            return !!(characterData.drives && characterData.drives.length === 3);
        case character_1.CREATION_STEPS.TALENTS:
            return true;
        case character_1.CREATION_STEPS.ASSETS:
            return true;
        case character_1.CREATION_STEPS.TRAITS:
            return true;
        case character_1.CREATION_STEPS.STARTING_POOLS: {
            const pools = characterData.resourcePools;
            return !!(pools &&
                pools.health !== undefined &&
                pools.resolve !== undefined &&
                pools.momentum !== undefined);
        }
        case character_1.CREATION_STEPS.SUMMARY:
        case character_1.CREATION_STEPS.FINALIZE:
            return true;
        default:
            return false;
    }
}
async function buildStepEmbed(interaction, step, session) {
    const { characterData } = session;
    const currentStepIndex = Object.values(character_1.CREATION_STEPS).indexOf(step) + 1;
    const totalSteps = Object.values(character_1.CREATION_STEPS).length;
    const progressBar = buildProgressBar(step);
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('🎭 Character Creation')
        .setDescription(STEP_DESCRIPTIONS[step] || 'Complete this step to continue.')
        .setColor('#0099ff')
        .setFooter({ text: `${progressBar} • Step ${currentStepIndex} of ${totalSteps}` });
    switch (step) {
        case character_1.CREATION_STEPS.NAME:
            embed.setDescription(STEP_DESCRIPTIONS[character_1.CREATION_STEPS.NAME]);
            break;
        case character_1.CREATION_STEPS.CONCEPT:
            embed.setDescription(STEP_DESCRIPTIONS[character_1.CREATION_STEPS.CONCEPT]);
            if (characterData.concepts && characterData.concepts.length > 0) {
                embed.addFields({
                    name: 'Concept',
                    value: characterData.concepts[0],
                    inline: true
                });
            }
            break;
        case character_1.CREATION_STEPS.ARCHETYPE:
            embed.setDescription(STEP_DESCRIPTIONS[character_1.CREATION_STEPS.ARCHETYPE]);
            if (characterData.archetypes && characterData.archetypes.length > 0) {
                embed.addFields({
                    name: 'Archetype',
                    value: characterData.archetypes[0],
                    inline: true
                });
            }
            break;
        case character_1.CREATION_STEPS.SKILLS:
            embed.setDescription(STEP_DESCRIPTIONS[character_1.CREATION_STEPS.SKILLS]);
            if (characterData.skills) {
                const skillsList = Object.entries(characterData.skills)
                    .map(([skill, rank]) => `• ${skill}: ${rank}`)
                    .join('\n');
                if (skillsList) {
                    embed.addFields({
                        name: 'Selected Skills',
                        value: skillsList,
                        inline: false
                    });
                }
            }
            break;
        case character_1.CREATION_STEPS.FOCUSES:
            embed.setDescription(STEP_DESCRIPTIONS[character_1.CREATION_STEPS.FOCUSES]);
            if (characterData.focuses) {
                const focusesList = Object.entries(characterData.focuses)
                    .map(([skill, focus]) => `• ${skill}: ${focus}`)
                    .join('\n');
                if (focusesList) {
                    embed.addFields({
                        name: 'Selected Focuses',
                        value: focusesList,
                        inline: false
                    });
                }
            }
            break;
        case character_1.CREATION_STEPS.DRIVES:
            embed.setDescription(STEP_DESCRIPTIONS[character_1.CREATION_STEPS.DRIVES]);
            if (characterData.drives && characterData.drives.length > 0) {
                embed.addFields({
                    name: 'Selected Drives',
                    value: characterData.drives.map(d => `• ${d}`).join('\n'),
                    inline: false
                });
            }
            break;
        case character_1.CREATION_STEPS.DRIVE_STATEMENTS:
            embed.setDescription(STEP_DESCRIPTIONS[character_1.CREATION_STEPS.DRIVE_STATEMENTS]);
            if (characterData.statements && characterData.statements.length > 0) {
                embed.addFields({
                    name: 'Drive Statements',
                    value: characterData.statements.join('\n'),
                    inline: false
                });
            }
            break;
        case character_1.CREATION_STEPS.TALENTS: {
            const talents = characterData.talents || [];
            embed.setTitle('Character Talents')
                .setDescription(STEP_DESCRIPTIONS[character_1.CREATION_STEPS.TALENTS])
                .setColor('#0099ff');
            if (talents.length > 0) {
                embed.addFields({
                    name: 'Selected Talents',
                    value: talents.map(t => `• ${t}`).join('\n'),
                    inline: false
                });
            }
            break;
        }
        case character_1.CREATION_STEPS.ASSETS: {
            const assets = characterData.assets || [];
            embed.setTitle('Character Assets')
                .setDescription(STEP_DESCRIPTIONS[character_1.CREATION_STEPS.ASSETS])
                .setColor('#0099ff');
            if (assets.length > 0) {
                embed.addFields({
                    name: 'Selected Assets',
                    value: assets.map(a => `• ${a}`).join('\n'),
                    inline: false
                });
            }
            break;
        }
        case character_1.CREATION_STEPS.TRAITS: {
            const traits = characterData.traits || [];
            embed.setTitle('Character Traits')
                .setDescription(STEP_DESCRIPTIONS[character_1.CREATION_STEPS.TRAITS])
                .setColor('#0099ff');
            if (traits.length > 0) {
                embed.addFields({
                    name: 'Selected Traits',
                    value: traits.map(t => `• ${t}`).join('\n'),
                    inline: false
                });
            }
            break;
        }
        case character_1.CREATION_STEPS.STARTING_POOLS: {
            const resourcePools = getResourcePools(characterData);
            embed.setTitle('Starting Resource Pools')
                .setDescription(STEP_DESCRIPTIONS[character_1.CREATION_STEPS.STARTING_POOLS])
                .setColor('#0099ff')
                .addFields({ name: 'Health', value: resourcePools.health.toString(), inline: true }, { name: 'Resolve', value: resourcePools.resolve.toString(), inline: true }, { name: 'Momentum', value: resourcePools.momentum.toString(), inline: true });
            break;
        }
        case character_1.CREATION_STEPS.SUMMARY: {
            const summary = [
                `**Name**: ${characterData.name || 'Not set'}`,
                `**Concept**: ${characterData.concepts?.length ? characterData.concepts[0] : 'Not set'}`,
                `**Archetype**: ${characterData.archetypes ? characterData.archetypes[0] : 'Not set'}`,
                `**Skills**: ${characterData.skills ? Object.entries(characterData.skills).map(([k, v]) => `${k} (${v})`).join(', ') : 'Not set'}`,
                `**Focuses**: ${characterData.focuses ? Object.entries(characterData.focuses).map(([k, v]) => `${k} (${v})`).join(', ') : 'Not set'}`,
                `**Drives**: ${characterData.drives ? characterData.drives.join(', ') : 'Not set'}`,
                `**Talents**: ${characterData.talents ? characterData.talents.join(', ') : 'Not set'}`,
                `**Assets**: ${characterData.assets ? characterData.assets.join(', ') : 'Not set'}`,
                `**Traits**: ${characterData.traits ? characterData.traits.join(', ') : 'Not set'}`
            ].join('\n');
            embed.setTitle('Character Summary')
                .setDescription(summary)
                .setColor('#00ff00');
            break;
        }
        case character_1.CREATION_STEPS.FINALIZE:
            embed.setDescription(STEP_DESCRIPTIONS[character_1.CREATION_STEPS.FINALIZE]);
            break;
        default:
            embed.setDescription(STEP_DESCRIPTIONS[step] || 'Complete this step to continue.');
    }
    return embed;
}
function buildActionRow(step, session) {
    switch (step) {
        case character_1.CREATION_STEPS.NAME:
            return new discord_js_1.ActionRowBuilder()
                .addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId('name_edit')
                .setLabel('Edit Name')
                .setStyle(discord_js_1.ButtonStyle.Secondary));
        case character_1.CREATION_STEPS.CONCEPT:
            return new discord_js_1.ActionRowBuilder()
                .addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId('concept_set')
                .setLabel(session.characterData.concepts && session.characterData.concepts.length > 0 ? 'Edit Concept' : 'Set Concept')
                .setStyle(discord_js_1.ButtonStyle.Primary));
        case character_1.CREATION_STEPS.ARCHETYPE:
            return new discord_js_1.ActionRowBuilder()
                .addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId('archetype_select')
                .setLabel('Select Archetype')
                .setStyle(discord_js_1.ButtonStyle.Primary));
        case character_1.CREATION_STEPS.SKILLS:
            return new discord_js_1.ActionRowBuilder()
                .addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId('skills_assign')
                .setLabel('Assign Skills')
                .setStyle(discord_js_1.ButtonStyle.Primary));
        case character_1.CREATION_STEPS.FOCUSES:
            return new discord_js_1.ActionRowBuilder()
                .addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId('focuses_select')
                .setLabel('Select Focuses')
                .setStyle(discord_js_1.ButtonStyle.Primary));
        case character_1.CREATION_STEPS.DRIVES:
            return new discord_js_1.ActionRowBuilder()
                .addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId('drives_assign')
                .setLabel('Assign Drives')
                .setStyle(discord_js_1.ButtonStyle.Primary));
        case character_1.CREATION_STEPS.TALENTS:
            return new discord_js_1.ActionRowBuilder()
                .addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId('talents_select')
                .setLabel('Select Talents')
                .setStyle(discord_js_1.ButtonStyle.Primary));
        case character_1.CREATION_STEPS.ASSETS:
            return new discord_js_1.ActionRowBuilder()
                .addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId('assets_select')
                .setLabel('Select Assets')
                .setStyle(discord_js_1.ButtonStyle.Primary));
        case character_1.CREATION_STEPS.TRAITS:
            return new discord_js_1.ActionRowBuilder()
                .addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId('traits_select')
                .setLabel('Select Traits')
                .setStyle(discord_js_1.ButtonStyle.Primary));
        case character_1.CREATION_STEPS.STARTING_POOLS:
            return new discord_js_1.ActionRowBuilder()
                .addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId('pools_set')
                .setLabel('Set Resource Pools')
                .setStyle(discord_js_1.ButtonStyle.Primary));
        case character_1.CREATION_STEPS.SUMMARY:
            return new discord_js_1.ActionRowBuilder()
                .addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId('summary_review')
                .setLabel('Review Character')
                .setStyle(discord_js_1.ButtonStyle.Secondary));
        case character_1.CREATION_STEPS.FINALIZE:
            return new discord_js_1.ActionRowBuilder()
                .addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId('character_finalize')
                .setLabel('Finalize Character')
                .setStyle(discord_js_1.ButtonStyle.Success));
        default:
            return null;
    }
}
async function showCreationPanel(interaction, member, step = character_1.CREATION_STEPS.NAME, successMessage) {
    if (!interaction.guildId) {
        await interaction.reply({
            content: 'This command can only be used in a server.',
            ephemeral: true
        });
        return;
    }
    const session = characterCreationSessions.get(interaction.user.id);
    if (!session) {
        await interaction.reply({
            content: 'No active character creation session found. Please start a new one with `/sheet create`',
            ephemeral: true
        });
        return;
    }
    if (!session.channelId && interaction.channelId) {
        session.channelId = interaction.channelId;
    }
    const updatedSession = {
        ...session,
        currentStep: step,
        lastUpdated: Date.now()
    };
    characterCreationSessions.set(session.userId, updatedSession);
    try {
        const embed = await buildStepEmbed(interaction, step, updatedSession);
        const navigationRow = buildNavigationButtons(step, updatedSession);
        const actionRow = buildActionRow(step, updatedSession);
        const components = [];
        if (navigationRow && actionRow && actionRow.components[0] instanceof discord_js_1.ButtonBuilder) {
            const combinedRow = new discord_js_1.ActionRowBuilder();
            navigationRow.components.forEach(button => {
                combinedRow.addComponents(button);
            });
            if (navigationRow.components.length + actionRow.components.length <= 5) {
                actionRow.components.forEach(button => {
                    combinedRow.addComponents(button);
                });
                components.push(combinedRow);
            }
            else {
                components.push(navigationRow);
                components.push(actionRow);
            }
        }
        else {
            if (navigationRow) {
                components.push(navigationRow);
            }
            if (actionRow) {
                if (actionRow.components[0] instanceof discord_js_1.ButtonBuilder) {
                    components.push(actionRow);
                }
                else {
                    components.push(actionRow);
                }
            }
        }
        const response = {
            embeds: [embed],
            components
        };
        if (successMessage) {
            response.content = successMessage;
        }
        if (interaction.replied || interaction.deferred) {
            await interaction.editReply(response);
        }
        else if (interaction.isModalSubmit()) {
            await interaction.deferUpdate();
            await interaction.editReply(response);
        }
        else {
            await interaction.reply({
                ...response,
                ephemeral: true
            });
        }
        return;
    }
    catch (error) {
        logger_1.logger.error('Error showing creation panel:', error);
        const errorMessage = 'An error occurred while updating the character creation panel. Please try again.';
        if (interaction.replied || interaction.deferred) {
            await interaction.editReply({
                content: errorMessage,
                components: []
            });
        }
        else {
            await interaction.reply({
                content: errorMessage,
                ephemeral: true
            });
        }
    }
}
async function handleNavigation(interaction, direction, session) {
    const currentStep = session.currentStep;
    const currentIndex = getCurrentStepIndex(currentStep);
    const totalSteps = getTotalSteps();
    const newIndex = direction === 'next'
        ? Math.min(currentIndex + 1, totalSteps - 1)
        : Math.max(currentIndex - 1, 0);
    const newStep = Object.keys(character_1.CREATION_STEPS)[newIndex];
    const updatedSession = {
        ...session,
        currentStep: newStep,
        lastUpdated: Date.now()
    };
    characterCreationSessions.set(session.userId, updatedSession);
    if (interaction.isButton() || interaction.isStringSelectMenu()) {
        await showCreationPanel(interaction, interaction.member, newStep);
    }
}
