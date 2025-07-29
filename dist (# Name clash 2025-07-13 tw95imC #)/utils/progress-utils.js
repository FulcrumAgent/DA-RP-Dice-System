"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildProgressBar = buildProgressBar;
exports.buildCharacterSummary = buildCharacterSummary;
exports.canProceedToNext = canProceedToNext;
exports.buildActionRow = buildActionRow;
const discord_js_1 = require("discord.js");
const skills_1 = require("../data/skills");
const drives_1 = require("../data/drives");
const character_creation_state_1 = require("../utils/character-creation-state");
const ARCHETYPE_OPTIONS = Object.entries(character_creation_state_1.ARCHETYPE_DESCRIPTIONS).map(([id, description]) => ({
    id,
    name: id,
    description: description
}));
function buildProgressBar(current, total, length = 10) {
    const progress = Math.min(Math.max(Math.round((current / total) * length), 0), length);
    return `${'█'.repeat(progress)}${'░'.repeat(length - progress)}`;
}
function buildCharacterSummary(data) {
    const sections = [];
    if (data.name)
        sections.push(`**Name:** ${data.name}`);
    if (data.concepts?.length)
        sections.push(`**Concept:** ${data.concepts[0]}`);
    if (data.archetypes?.length)
        sections.push(`**Archetypes:** ${data.archetypes.join(', ')}`);
    if (data.skills && Object.keys(data.skills).length > 0) {
        const skillsList = Object.entries(data.skills)
            .map(([skill, value]) => `${skill}: ${value}`)
            .join(', ');
        sections.push(`**Skills:** ${skillsList}`);
    }
    if (data.focuses && Object.keys(data.focuses).length > 0) {
        const focusesList = Object.entries(data.focuses)
            .map(([skill, focus]) => `${skill} (${focus})`)
            .join(', ');
        sections.push(`**Focuses:** ${focusesList}`);
    }
    if (data.drives?.length)
        sections.push(`**Drives:** ${data.drives.join(', ')}`);
    if (data.talents?.length)
        sections.push(`**Talents:** ${data.talents.join(', ')}`);
    if (data.assets?.length)
        sections.push(`**Assets:** ${data.assets.join(', ')}`);
    if (data.traits?.length)
        sections.push(`**Traits:** ${data.traits.join(', ')}`);
    return sections.join('\n');
}
function canProceedToNext(step, data) {
    switch (step) {
        case 'NAME':
            return !!data.name && data.name.trim().length > 0;
        case 'CONCEPT':
            return !!data.concepts && data.concepts.length > 0;
        case 'ARCHETYPE':
            return !!data.archetypes && data.archetypes.length > 0 && data.archetypes.length <= 3;
        case 'SKILLS':
            return Object.values(skills_1.SKILLS).every(skill => data.skills && typeof data.skills[skill.id] === 'number');
        case 'FOCUSES':
            return !!data.focuses && Object.keys(data.focuses).length >= 1;
        case 'DRIVES':
            return !!data.drives && data.drives.length >= 2 && data.drives.length <= 3;
        case 'DRIVE_STATEMENTS':
            return !!(data.statements && Object.keys(data.statements).length > 0);
        case 'TALENTS':
            return !!data.talents && data.talents.length >= 2 && data.talents.length <= 3;
        case 'ASSETS':
            return !!(data.assets && data.assets.length > 0);
        case 'TRAITS':
            return !!(data.traits && data.traits.length > 0);
        case 'STARTING_POOLS':
            return !!(data.resourcePools &&
                typeof data.resourcePools.health === 'number' &&
                typeof data.resourcePools.resolve === 'number' &&
                typeof data.resourcePools.momentum === 'number');
        case 'SUMMARY':
        case 'FINALIZE':
            return true;
        default:
            return false;
    }
}
function buildActionRow(step, session) {
    const row = new discord_js_1.ActionRowBuilder();
    const { characterData } = session;
    switch (step) {
        case 'ARCHETYPE': {
            const selectMenu = new discord_js_1.StringSelectMenuBuilder()
                .setCustomId('select_archetypes')
                .setPlaceholder('Select 1-3 archetypes')
                .setMinValues(1)
                .setMaxValues(3);
            ARCHETYPE_OPTIONS.forEach(archetype => {
                selectMenu.addOptions({
                    label: archetype.name,
                    description: archetype.description.substring(0, 100),
                    value: archetype.id,
                    default: characterData.archetypes?.includes(archetype.id) || false
                });
            });
            row.addComponents(selectMenu);
            break;
        }
        case 'SKILLS': {
            const skillSelect = new discord_js_1.StringSelectMenuBuilder()
                .setCustomId('select_skills')
                .setPlaceholder('Select a skill to modify')
                .setMinValues(1)
                .setMaxValues(1);
            Object.values(skills_1.SKILLS).forEach(skill => {
                const currentValue = characterData.skills?.[skill.id] || 0;
                skillSelect.addOptions({
                    label: skill.name,
                    description: `Current: ${currentValue}`,
                    value: skill.id
                });
            });
            row.addComponents(skillSelect);
            break;
        }
        case 'FOCUSES': {
            const focusSelect = new discord_js_1.StringSelectMenuBuilder()
                .setCustomId('select_skill_for_focus')
                .setPlaceholder('Select a skill to add focus to')
                .setMinValues(1)
                .setMaxValues(1);
            Object.values(skills_1.SKILLS).forEach(skill => {
                focusSelect.addOptions({
                    label: skill.name,
                    description: `Add/change focus for ${skill.name}`,
                    value: `focus_${skill.id}`
                });
            });
            row.addComponents(focusSelect);
            break;
        }
        case 'DRIVES': {
            const driveSelect = new discord_js_1.StringSelectMenuBuilder()
                .setCustomId('select_drives')
                .setPlaceholder('Select 2-3 drives')
                .setMinValues(2)
                .setMaxValues(3);
            drives_1.DUNE_DRIVES.forEach((drive) => {
                driveSelect.addOptions({
                    label: drive.name,
                    description: drive.description.substring(0, 100),
                    value: drive.id,
                    default: characterData.drives?.includes(drive.id) || false
                });
            });
            row.addComponents(driveSelect);
            break;
        }
        default:
            break;
    }
    return row;
}
