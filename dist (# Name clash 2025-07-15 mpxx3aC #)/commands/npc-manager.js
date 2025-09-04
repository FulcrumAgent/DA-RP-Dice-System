"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
exports.autocomplete = autocomplete;
exports.handleSaveGeneratedNPC = handleSaveGeneratedNPC;
exports.handleSaveNPCNameModal = handleSaveNPCNameModal;
const discord_js_1 = require("discord.js");
const character_manager_1 = require("../utils/character-manager");
const dune_dice_1 = require("../utils/dune-dice");
const logger_1 = require("../utils/logger");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('npc')
    .setDescription('NPC management commands')
    .addSubcommand(subcommand => subcommand
    .setName('create')
    .setDescription('Create a new NPC')
    .addStringOption(option => option
    .setName('name')
    .setDescription('NPC name')
    .setRequired(true))
    .addStringOption(option => option
    .setName('concept')
    .setDescription('NPC concept (e.g., "Harkonnen Guard", "Fremen Warrior")')
    .setRequired(true))
    .addStringOption(option => option
    .setName('description')
    .setDescription('Detailed description of the NPC')
    .setRequired(true))
    .addStringOption(option => option
    .setName('tier')
    .setDescription('NPC tier/power level')
    .setRequired(false)
    .addChoices({ name: 'Minion', value: 'minion' }, { name: 'Toughened', value: 'toughened' }, { name: 'Nemesis', value: 'nemesis' })))
    .addSubcommand(subcommand => subcommand
    .setName('list')
    .setDescription('List all NPCs in this server'))
    .addSubcommand(subcommand => subcommand
    .setName('view')
    .setDescription('View detailed NPC information')
    .addStringOption(option => option
    .setName('name')
    .setDescription('NPC name to view')
    .setRequired(true)))
    .addSubcommand(subcommand => subcommand
    .setName('edit')
    .setDescription('Edit an existing NPC')
    .addStringOption(option => option
    .setName('name')
    .setDescription('NPC name to edit')
    .setRequired(true))
    .addStringOption(option => option
    .setName('field')
    .setDescription('Field to edit')
    .setRequired(true)
    .addChoices({ name: 'Name', value: 'name' }, { name: 'Concept', value: 'concept' }, { name: 'Description', value: 'description' }, { name: 'Tier', value: 'tier' }))
    .addStringOption(option => option
    .setName('value')
    .setDescription('New value (for Tier: minion, toughened, or nemesis)')
    .setRequired(true)
    .setAutocomplete(true)))
    .addSubcommand(subcommand => subcommand
    .setName('roll')
    .setDescription('Make a roll for an NPC')
    .addStringOption(option => option
    .setName('name')
    .setDescription('NPC name')
    .setRequired(true))
    .addStringOption(option => option
    .setName('attribute')
    .setDescription('Attribute to use')
    .setRequired(true)
    .addChoices({ name: 'Muscle', value: 'muscle' }, { name: 'Move', value: 'move' }, { name: 'Intellect', value: 'intellect' }, { name: 'Awareness', value: 'awareness' }, { name: 'Communication', value: 'communication' }, { name: 'Discipline', value: 'discipline' }))
    .addStringOption(option => option
    .setName('skill')
    .setDescription('Skill to use')
    .setRequired(true))
    .addIntegerOption(option => option
    .setName('difficulty')
    .setDescription('Test difficulty')
    .setRequired(false)
    .setMinValue(0)
    .setMaxValue(5))
    .addStringOption(option => option
    .setName('description')
    .setDescription('What is the NPC attempting?')
    .setRequired(false)))
    .addSubcommand(subcommand => subcommand
    .setName('generate')
    .setDescription('Generate quick NPC stats')
    .addStringOption(option => option
    .setName('tier')
    .setDescription('NPC tier/power level')
    .setRequired(true)
    .addChoices({ name: 'Minion', value: 'minion' }, { name: 'Toughened', value: 'toughened' }, { name: 'Nemesis', value: 'nemesis' }))
    .addStringOption(option => option
    .setName('concept')
    .setDescription('NPC concept for stat generation')
    .setRequired(true)))
    .addSubcommand(subcommand => subcommand
    .setName('delete')
    .setDescription('Delete an NPC (requires manage server permission)')
    .addStringOption(option => option
    .setName('name')
    .setDescription('NPC name to delete')
    .setRequired(true)));
async function execute(interaction) {
    if (!interaction.guild || !interaction.member) {
        await interaction.reply({ content: 'This command can only be used in a server.', flags: discord_js_1.MessageFlags.Ephemeral });
        return;
    }
    const subcommand = interaction.options.getSubcommand();
    const member = interaction.member;
    try {
        switch (subcommand) {
            case 'create':
                await handleCreateNPC(interaction, member);
                break;
            case 'list':
                await handleListNPCs(interaction);
                break;
            case 'view':
                await handleViewNPC(interaction);
                break;
            case 'edit':
                await handleEditNPC(interaction, member);
                break;
            case 'roll':
                await handleNPCRoll(interaction);
                break;
            case 'generate':
                await handleGenerateNPC(interaction);
                break;
            case 'delete':
                await handleDeleteNPC(interaction, member);
                break;
            default:
                await interaction.reply({ content: 'Unknown subcommand.', flags: discord_js_1.MessageFlags.Ephemeral });
        }
    }
    catch (error) {
        logger_1.logger.error('NPC command error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: `❌ ${errorMessage}`, flags: discord_js_1.MessageFlags.Ephemeral });
        }
        else {
            await interaction.reply({ content: `❌ ${errorMessage}`, flags: discord_js_1.MessageFlags.Ephemeral });
        }
    }
}
async function autocomplete(interaction) {
    const focusedOption = interaction.options.getFocused(true);
    if (focusedOption.name === 'value') {
        const fieldOption = interaction.options.getString('field');
        if (fieldOption === 'tier') {
            const choices = [
                { name: 'Minion', value: 'minion' },
                { name: 'Toughened', value: 'toughened' },
                { name: 'Nemesis', value: 'nemesis' }
            ];
            const filtered = choices.filter(choice => choice.name.toLowerCase().includes(focusedOption.value.toLowerCase()));
            await interaction.respond(filtered.slice(0, 25));
        }
        else {
            await interaction.respond([]);
        }
    }
}
async function handleCreateNPC(interaction, member) {
    const name = interaction.options.getString('name');
    const concept = interaction.options.getString('concept');
    const description = interaction.options.getString('description');
    const tier = interaction.options.getString('tier') || 'minion';
    if (!name) {
        await interaction.reply({ content: 'Please provide an NPC name.', ephemeral: true });
        return;
    }
    if (!concept) {
        await interaction.reply({ content: 'Please provide an NPC concept.', ephemeral: true });
        return;
    }
    await interaction.deferReply();
    try {
        const baseStats = dune_dice_1.DuneDiceEngine.generateNPCStats(tier);
        const npc = await character_manager_1.characterManager.createNPC(name, interaction.guild.id, [concept], description || '', member.id, {
            tier: tier,
            attributes: baseStats.attributes,
            skills: Object.entries(baseStats.skills).map(([skillName, value]) => ({
                name: skillName,
                value: value
            }))
        });
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0x8B4513)
            .setTitle('👤 NPC Created!')
            .setDescription(`**${npc.name}** has been added to the server.`)
            .addFields({ name: '🎯 Concepts', value: npc.concepts.join(', '), inline: true }, { name: '⭐ Tier', value: tier.charAt(0).toUpperCase() + tier.slice(1), inline: true }, { name: '👤 Created By', value: `<@${member.id}>`, inline: true }, { name: '📝 Description', value: npc.description, inline: false })
            .setFooter({ text: 'Use /npc view to see full stats' })
            .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
    }
    catch (error) {
        await interaction.editReply({ content: `Failed to create NPC: ${error}` });
    }
}
async function handleListNPCs(interaction) {
    const npcs = await character_manager_1.characterManager.getGuildNPCs(interaction.guild.id);
    if (npcs.length === 0) {
        await interaction.reply({ content: 'No NPCs found in this server. Use `/npc create` to add some!', flags: discord_js_1.MessageFlags.Ephemeral });
        return;
    }
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(0x9370DB)
        .setTitle('👥 Server NPCs')
        .setDescription(`Found ${npcs.length} NPC(s):`)
        .setTimestamp();
    const npcList = npcs.map((npc, index) => `**${index + 1}. ${npc.name}**\n*${npc.concepts.join(', ')}*\nCreated by <@${npc.createdBy}>`).join('\n\n');
    if (npcList.length > 4096) {
        const chunks = npcList.match(/.{1,1000}/g) || [npcList];
        chunks.forEach((chunk, index) => {
            embed.addFields({
                name: index === 0 ? 'NPCs' : `NPCs (continued ${index + 1})`,
                value: chunk,
                inline: false
            });
        });
    }
    else {
        embed.setDescription(`Found ${npcs.length} NPC(s):\n\n${npcList}`);
    }
    await interaction.reply({ embeds: [embed] });
}
async function handleViewNPC(interaction) {
    const npcName = interaction.options.getString('name');
    if (!npcName) {
        await interaction.reply({ content: 'Please provide an NPC name.', ephemeral: true });
        return;
    }
    const npc = await character_manager_1.characterManager.getNPCByName(npcName, interaction.guild.id);
    if (!npc) {
        await interaction.reply({
            content: `❌ NPC "${npcName}" not found.`,
            flags: discord_js_1.MessageFlags.Ephemeral
        });
        return;
    }
    const embed = createNPCEmbed(npc);
    await interaction.reply({ embeds: [embed] });
}
async function handleEditNPC(interaction, member) {
    const npcName = interaction.options.getString('name');
    const field = interaction.options.getString('field');
    const value = interaction.options.getString('value');
    if (!npcName) {
        await interaction.reply({ content: 'Please provide an NPC name.', flags: discord_js_1.MessageFlags.Ephemeral });
        return;
    }
    if (!field) {
        await interaction.reply({ content: 'Please provide a field to edit.', flags: discord_js_1.MessageFlags.Ephemeral });
        return;
    }
    if (!value) {
        await interaction.reply({ content: 'Please provide a value.', flags: discord_js_1.MessageFlags.Ephemeral });
        return;
    }
    const npc = await character_manager_1.characterManager.getNPCByName(npcName, interaction.guild.id);
    if (!npc) {
        await interaction.reply({
            content: `❌ NPC "${npcName}" not found.`,
            flags: discord_js_1.MessageFlags.Ephemeral
        });
        return;
    }
    if (npc.createdBy !== member.id && !member.permissions.has(discord_js_1.PermissionFlagsBits.ManageGuild)) {
        await interaction.reply({
            content: '❌ You can only edit NPCs you created, or you need Manage Server permission.',
            flags: discord_js_1.MessageFlags.Ephemeral
        });
        return;
    }
    await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
    try {
        if (field === 'tier') {
            const validTiers = ['minion', 'toughened', 'nemesis'];
            if (!validTiers.includes(value.toLowerCase())) {
                await interaction.editReply({
                    content: `❌ Invalid tier. Must be one of: ${validTiers.join(', ')}`
                });
                return;
            }
        }
        await character_manager_1.characterManager.updateNPC(npc.id, field, value, member.id);
        await interaction.editReply({
            content: `✅ Successfully updated **${field}** of **${npcName}** to "**${value}**"`
        });
    }
    catch (error) {
        await interaction.editReply({ content: `Failed to edit NPC: ${error}` });
    }
}
async function handleNPCRoll(interaction) {
    const npcName = interaction.options.getString('name');
    const attributeName = interaction.options.getString('attribute');
    const skillName = interaction.options.getString('skill');
    const difficulty = interaction.options.getInteger('difficulty') || 1;
    const description = interaction.options.getString('description');
    if (!npcName) {
        await interaction.reply({ content: 'Please provide an NPC name.', ephemeral: true });
        return;
    }
    if (!attributeName) {
        await interaction.reply({ content: 'Please provide an attribute name.', ephemeral: true });
        return;
    }
    if (!skillName) {
        await interaction.reply({ content: 'Please provide a skill name.', ephemeral: true });
        return;
    }
    const npc = await character_manager_1.characterManager.getNPCByName(npcName, interaction.guild.id);
    if (!npc) {
        await interaction.reply({
            content: `❌ NPC "${npcName}" not found.`,
            flags: discord_js_1.MessageFlags.Ephemeral
        });
        return;
    }
    await interaction.deferReply();
    try {
        const attributeValue = npc.attributes?.[attributeName] || 8;
        const skill = npc.skills?.find(s => s.name.toLowerCase() === skillName.toLowerCase());
        const skillValue = skill?.value || 0;
        const mockCharacter = {
            id: 'mock-npc',
            userId: 'npc',
            guildId: interaction.guild.id,
            name: npc.name,
            concepts: npc.concepts || ['NPC'],
            attributes: {
                muscle: attributeName === 'muscle' ? attributeValue : 8,
                move: attributeName === 'move' ? attributeValue : 8,
                intellect: attributeName === 'intellect' ? attributeValue : 8,
                awareness: attributeName === 'awareness' ? attributeValue : 8,
                communication: attributeName === 'communication' ? attributeValue : 8,
                discipline: attributeName === 'discipline' ? attributeValue : 8
            },
            skills: [{ name: skillName, value: skillValue, focus: [] }],
            drives: [],
            assets: [],
            traits: [],
            determination: 0,
            maxDetermination: 0,
            experience: { total: 0, spent: 0, available: 0 },
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            isActive: true
        };
        const result = dune_dice_1.DuneDiceEngine.performTest(mockCharacter, attributeName, skillName, { difficulty });
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(result.success ? 0x00FF00 : 0xFF0000)
            .setTitle(`🎲 ${npc.name} - ${skillName} Test`)
            .setDescription(description || `${npc.name} attempts a ${skillName} test`)
            .addFields({
            name: '🎯 Test Details',
            value: `**Target:** ${attributeValue + skillValue}\n**Difficulty:** ${difficulty}\n**Dice Pool:** ${result.rolls.length}d20`,
            inline: true
        }, {
            name: '📊 Results',
            value: `**Successes:** ${result.successes}\n**Complications:** ${result.complications}\n**Critical Hits:** ${result.criticalHits}`,
            inline: true
        }, {
            name: '⚡ Resources',
            value: `**Momentum:** +${result.momentum}\n**Threat:** +${result.threat}`,
            inline: true
        });
        const diceDisplay = result.rolls.map((roll) => {
            let emoji = '⚪';
            if (roll <= attributeValue + skillValue) {
                emoji = roll === 1 ? '🎯' : '✅';
            }
            if (roll >= 20) {
                emoji = '⚠️';
            }
            return `${emoji}${roll}`;
        }).join(' ');
        embed.addFields({
            name: '🎲 Dice Rolls',
            value: diceDisplay,
            inline: false
        });
        embed.addFields({
            name: '📖 Result',
            value: result.narrative,
            inline: false
        });
        embed.setFooter({ text: `${npc.concepts.join(', ')}` })
            .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
    }
    catch (error) {
        await interaction.editReply({ content: `Failed to roll for NPC: ${error}` });
    }
}
async function handleGenerateNPC(interaction) {
    const tier = interaction.options.getString('tier');
    const concept = interaction.options.getString('concept');
    if (!concept) {
        await interaction.reply({ content: 'Please provide a concept for the NPC.', ephemeral: true });
        return;
    }
    const stats = dune_dice_1.DuneDiceEngine.generateNPCStats(tier);
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(0x4169E1)
        .setTitle(`🎲 Generated ${tier.charAt(0).toUpperCase() + tier.slice(1)} Stats`)
        .setDescription(`*${concept}*`)
        .addFields({
        name: '⚡ Attributes',
        value: Object.entries(stats.attributes)
            .map(([name, value]) => `**${name.charAt(0).toUpperCase() + name.slice(1)}:** ${value}`)
            .join('\n'),
        inline: true
    }, {
        name: '🎯 Skills',
        value: Object.entries(stats.skills)
            .map(([name, value]) => `**${name.charAt(0).toUpperCase() + name.slice(1)}:** ${value}`)
            .join('\n'),
        inline: true
    }, {
        name: '❤️ Health',
        value: `**Vigor:** ${stats.vigor}\n**Resolve:** ${stats.resolve}`,
        inline: true
    })
        .setFooter({ text: 'Click "Save as NPC" to save this as a permanent NPC' })
        .setTimestamp();
    const saveButton = new discord_js_1.ButtonBuilder()
        .setCustomId(`save_generated_npc_${tier}_${Date.now()}`)
        .setLabel('Save as NPC')
        .setStyle(discord_js_1.ButtonStyle.Success);
    const row = new discord_js_1.ActionRowBuilder()
        .addComponents(saveButton);
    const tempData = {
        tier,
        concept,
        stats,
        timestamp: Date.now()
    };
    if (!global.tempNPCData)
        global.tempNPCData = new Map();
    global.tempNPCData.set(`${tier}_${Date.now()}`, tempData);
    await interaction.reply({
        embeds: [embed],
        components: [row]
    });
}
async function handleDeleteNPC(interaction, member) {
    const npcName = interaction.options.getString('name');
    if (!npcName) {
        await interaction.reply({ content: 'Please provide an NPC name.', flags: discord_js_1.MessageFlags.Ephemeral });
        return;
    }
    const npc = await character_manager_1.characterManager.getNPCByName(npcName, interaction.guild.id);
    if (!npc) {
        await interaction.reply({
            content: `❌ NPC "${npcName}" not found.`,
            flags: discord_js_1.MessageFlags.Ephemeral
        });
        return;
    }
    if (npc.createdBy !== member.id && !member.permissions.has(discord_js_1.PermissionFlagsBits.ManageGuild)) {
        await interaction.reply({
            content: '❌ You can only delete NPCs you created, or you need Manage Server permission.',
            flags: discord_js_1.MessageFlags.Ephemeral
        });
        return;
    }
    await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
    try {
        await character_manager_1.characterManager.deleteNPC(npc.id, member.id);
        await interaction.editReply({
            content: `✅ Successfully deleted NPC "**${npcName}**".`
        });
    }
    catch (error) {
        await interaction.editReply({ content: `Failed to delete NPC: ${error}` });
    }
}
function createNPCEmbed(npc) {
    const tierText = npc.tier ? ` (${npc.tier.charAt(0).toUpperCase() + npc.tier.slice(1)})` : '';
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(0x8B4513)
        .setTitle(`👤 ${npc.name}${tierText}`)
        .setDescription(`*${npc.concepts.join(', ')}*\n\n${npc.description}`)
        .setFooter({ text: `Created by ${npc.createdBy} • ${new Date(npc.createdAt).toLocaleDateString()}` })
        .setTimestamp();
    if (npc.attributes) {
        const attrs = Object.entries(npc.attributes)
            .map(([name, value]) => `**${name.charAt(0).toUpperCase() + name.slice(1)}:** ${value}`)
            .join('\n');
        embed.addFields({ name: '⚡ Attributes', value: attrs, inline: true });
    }
    if (npc.skills && npc.skills.length > 0) {
        const skills = npc.skills
            .filter(skill => skill.value > 0)
            .map(skill => `**${skill.name}:** ${skill.value}`)
            .join('\n');
        if (skills) {
            embed.addFields({ name: '🎯 Skills', value: skills, inline: true });
        }
    }
    if (npc.assets && npc.assets.length > 0) {
        const assets = npc.assets
            .map(asset => `**${asset.name}** (${asset.type}): ${asset.description}`)
            .join('\n');
        embed.addFields({ name: '🎒 Assets', value: assets.length > 1024 ? assets.substring(0, 1020) + '...' : assets, inline: false });
    }
    if (npc.traits && npc.traits.length > 0) {
        const traits = npc.traits
            .map(trait => `**${trait.name}** (${trait.type}): ${trait.description}`)
            .join('\n');
        embed.addFields({ name: '✨ Traits', value: traits.length > 1024 ? traits.substring(0, 1020) + '...' : traits, inline: false });
    }
    return embed;
}
async function handleSaveGeneratedNPC(interaction) {
    const customId = interaction.customId;
    const keyMatch = customId.match(/save_generated_npc_(.+)/);
    if (!keyMatch) {
        await interaction.reply({
            content: '❌ Invalid save request.',
            flags: discord_js_1.MessageFlags.Ephemeral
        });
        return;
    }
    const key = keyMatch[1];
    const tempData = global.tempNPCData?.get(key);
    if (!tempData) {
        await interaction.reply({
            content: '❌ Generated NPC data has expired. Please generate a new NPC.',
            flags: discord_js_1.MessageFlags.Ephemeral
        });
        return;
    }
    const modal = new discord_js_1.ModalBuilder()
        .setCustomId(`save_npc_name_${key}`)
        .setTitle('Save Generated NPC');
    const nameInput = new discord_js_1.TextInputBuilder()
        .setCustomId('npc_name')
        .setLabel('NPC Name')
        .setStyle(discord_js_1.TextInputStyle.Short)
        .setPlaceholder('Enter a name for this NPC')
        .setRequired(true)
        .setMaxLength(50);
    const actionRow = new discord_js_1.ActionRowBuilder().addComponents(nameInput);
    modal.addComponents(actionRow);
    await interaction.showModal(modal);
}
async function handleSaveNPCNameModal(interaction, member) {
    const customId = interaction.customId;
    const keyMatch = customId.match(/save_npc_name_(.+)/);
    if (!keyMatch) {
        await interaction.reply({
            content: '❌ Invalid save request.',
            flags: discord_js_1.MessageFlags.Ephemeral
        });
        return;
    }
    const key = keyMatch[1];
    const tempData = global.tempNPCData?.get(key);
    if (!tempData) {
        await interaction.reply({
            content: '❌ Generated NPC data has expired. Please generate a new NPC.',
            flags: discord_js_1.MessageFlags.Ephemeral
        });
        return;
    }
    await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral });
    try {
        const npcName = interaction.fields.getTextInputValue('npc_name').trim();
        if (!npcName) {
            await interaction.editReply({
                content: '❌ NPC name cannot be empty.'
            });
            return;
        }
        const { tier, concept, stats } = tempData;
        const skills = Object.entries(stats.skills).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value: value
        }));
        await character_manager_1.characterManager.createNPC(npcName, interaction.guild.id, [concept], `Auto-generated ${tier} NPC with concept: ${concept}`, member.id, {
            tier: tier,
            attributes: stats.attributes,
            skills: skills
        });
        global.tempNPCData?.delete(key);
        await interaction.editReply({
            content: `✅ Successfully saved NPC as "**${npcName}**"!\n\n📝 Use \`/npc edit name:${npcName}\` to customize further.\n🔍 Use \`/npc view name:${npcName}\` to see the full NPC details.`
        });
    }
    catch (error) {
        await interaction.editReply({
            content: `❌ Failed to save NPC: ${error}`
        });
    }
}
