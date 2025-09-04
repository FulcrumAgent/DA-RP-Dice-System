"use strict";
/**
 * Reference and Lookup Commands
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const character_manager_1 = require("../utils/character-manager");
const logger_1 = require("../utils/logger");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('lookup')
    .setDescription('Look up game references and information')
    .addSubcommand(subcommand => subcommand
    .setName('npc')
    .setDescription('Look up an NPC')
    .addStringOption(option => option
    .setName('name')
    .setDescription('NPC name to search for')
    .setRequired(true)))
    .addSubcommand(subcommand => subcommand
    .setName('asset')
    .setDescription('Search for assets')
    .addStringOption(option => option
    .setName('query')
    .setDescription('Asset name or description to search for')
    .setRequired(true)))
    .addSubcommand(subcommand => subcommand
    .setName('skill')
    .setDescription('Get information about a skill')
    .addStringOption(option => option
    .setName('name')
    .setDescription('Skill name')
    .setRequired(true)
    .addChoices({ name: 'Battle', value: 'Battle' }, { name: 'Command', value: 'Command' }, { name: 'Discipline', value: 'Discipline' }, { name: 'Drive', value: 'Drive' }, { name: 'Infiltrate', value: 'Infiltrate' }, { name: 'Investigate', value: 'Investigate' }, { name: 'Lore', value: 'Lore' }, { name: 'Medicine', value: 'Medicine' }, { name: 'Mentat', value: 'Mentat' }, { name: 'Persuade', value: 'Persuade' }, { name: 'Pilot', value: 'Pilot' }, { name: 'Spice', value: 'Spice' }, { name: 'Stealth', value: 'Stealth' }, { name: 'Survival', value: 'Survival' }, { name: 'Tech', value: 'Tech' }, { name: 'Understand', value: 'Understand' })))
    .addSubcommand(subcommand => subcommand
    .setName('rules')
    .setDescription('Get quick rules references')
    .addStringOption(option => option
    .setName('topic')
    .setDescription('Rules topic to look up')
    .setRequired(true)
    .addChoices({ name: 'Basic Test', value: 'basic_test' }, { name: 'Momentum', value: 'momentum' }, { name: 'Threat', value: 'threat' }, { name: 'Determination', value: 'determination' }, { name: 'Complications', value: 'complications' }, { name: 'Extended Tests', value: 'extended_tests' }, { name: 'Conflict', value: 'conflict' }, { name: 'Damage', value: 'damage' })));
async function execute(interaction) {
    if (!interaction.guild) {
        await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
        return;
    }
    const subcommand = interaction.options.getSubcommand();
    try {
        switch (subcommand) {
            case 'npc':
                await handleNPCLookup(interaction);
                break;
            case 'asset':
                await handleAssetSearch(interaction);
                break;
            case 'skill':
                await handleSkillInfo(interaction);
                break;
            case 'rules':
                await handleRulesReference(interaction);
                break;
            default:
                await interaction.reply({ content: 'Unknown subcommand.', ephemeral: true });
        }
    }
    catch (error) {
        logger_1.logger.error('Lookup command error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: `❌ ${errorMessage}`, ephemeral: true });
        }
        else {
            await interaction.reply({ content: `❌ ${errorMessage}`, ephemeral: true });
        }
    }
}
async function handleNPCLookup(interaction) {
    const npcName = interaction.options.getString('name');
    const npc = await character_manager_1.characterManager.getNPCByName(npcName, interaction.guild.id);
    if (!npc) {
        await interaction.reply({
            content: `❌ NPC "${npcName}" not found. Use \`/npc create\` to add new NPCs.`,
            ephemeral: true
        });
        return;
    }
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(0x8B4513)
        .setTitle(`👤 ${npc.name}`)
        .setDescription(`*${npc.concept}*\n\n${npc.description}`)
        .setFooter({ text: `Created by ${npc.createdBy} • ${new Date(npc.createdAt).toLocaleDateString()}` })
        .setTimestamp();
    // Add attributes if present
    if (npc.attributes) {
        const attrs = Object.entries(npc.attributes)
            .map(([name, value]) => `**${name.charAt(0).toUpperCase() + name.slice(1)}:** ${value}`)
            .join('\n');
        embed.addFields({ name: '⚡ Attributes', value: attrs, inline: true });
    }
    // Add skills if present
    if (npc.skills && npc.skills.length > 0) {
        const skills = npc.skills
            .filter(skill => skill.value > 0)
            .map(skill => `**${skill.name}:** ${skill.value}`)
            .join('\n');
        if (skills) {
            embed.addFields({ name: '🎯 Skills', value: skills, inline: true });
        }
    }
    // Add assets if present
    if (npc.assets && npc.assets.length > 0) {
        const assets = npc.assets
            .map(asset => `**${asset.name}** (${asset.type}): ${asset.description}`)
            .join('\n');
        embed.addFields({ name: '🎒 Assets', value: assets.length > 1024 ? assets.substring(0, 1020) + '...' : assets, inline: false });
    }
    await interaction.reply({ embeds: [embed] });
}
async function handleAssetSearch(interaction) {
    const query = interaction.options.getString('query');
    const assets = await character_manager_1.characterManager.searchAssets(query, interaction.guild.id);
    if (assets.length === 0) {
        await interaction.reply({
            content: `❌ No assets found matching "${query}".`,
            ephemeral: true
        });
        return;
    }
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(0x4169E1)
        .setTitle(`🔍 Asset Search: "${query}"`)
        .setDescription(`Found ${assets.length} matching asset(s):`)
        .setTimestamp();
    // Group assets by type
    const assetsByType = {};
    assets.forEach(asset => {
        if (!assetsByType[asset.type]) {
            assetsByType[asset.type] = [];
        }
        assetsByType[asset.type].push(asset);
    });
    // Add fields for each type
    Object.entries(assetsByType).forEach(([type, typeAssets]) => {
        const assetList = typeAssets
            .map(asset => `**${asset.name}**: ${asset.description}`)
            .join('\n');
        embed.addFields({
            name: `${type.charAt(0).toUpperCase() + type.slice(1)}s`,
            value: assetList.length > 1024 ? assetList.substring(0, 1020) + '...' : assetList,
            inline: false
        });
    });
    await interaction.reply({ embeds: [embed] });
}
async function handleSkillInfo(interaction) {
    const skillName = interaction.options.getString('name');
    const skillInfo = getSkillInformation(skillName);
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(0xFFD700)
        .setTitle(`🎯 ${skillName}`)
        .setDescription(skillInfo.description)
        .addFields({ name: '🎲 Common Uses', value: skillInfo.uses, inline: false }, { name: '🔗 Typical Attributes', value: skillInfo.attributes, inline: true }, { name: '💡 Example Focuses', value: skillInfo.focuses, inline: true })
        .setTimestamp();
    await interaction.reply({ embeds: [embed] });
}
async function handleRulesReference(interaction) {
    const topic = interaction.options.getString('topic');
    const rulesInfo = getRulesInformation(topic);
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(0x32CD32)
        .setTitle(`📚 ${rulesInfo.title}`)
        .setDescription(rulesInfo.description)
        .setTimestamp();
    if (rulesInfo.fields) {
        rulesInfo.fields.forEach(field => {
            embed.addFields(field);
        });
    }
    await interaction.reply({ embeds: [embed] });
}
function getSkillInformation(skillName) {
    const skillData = {
        'Battle': {
            description: 'Combat prowess, weapon handling, and tactical awareness in fights.',
            uses: '• Melee and ranged attacks\n• Combat maneuvers\n• Weapon maintenance\n• Tactical assessment',
            attributes: 'Muscle, Move, Awareness',
            focuses: 'Blades, Projectiles, Unarmed, Tactics'
        },
        'Command': {
            description: 'Leadership, inspiration, and directing others in various situations.',
            uses: '• Leading groups\n• Inspiring allies\n• Military tactics\n• Organizational management',
            attributes: 'Communication, Discipline, Intellect',
            focuses: 'Military, Inspiration, Strategy, Politics'
        },
        'Discipline': {
            description: 'Mental fortitude, self-control, and resistance to external influences.',
            uses: '• Resisting fear or intimidation\n• Maintaining composure\n• Mental defense\n• Concentration',
            attributes: 'Discipline, Intellect, Communication',
            focuses: 'Fear, Pain, Temptation, Concentration'
        },
        'Drive': {
            description: 'Operating and controlling various vehicles and mounts.',
            uses: '• Piloting ground vehicles\n• Riding animals\n• Vehicle maintenance\n• Racing and stunts',
            attributes: 'Move, Awareness, Intellect',
            focuses: 'Groundcars, Ornithopters, Animals, Racing'
        },
        'Infiltrate': {
            description: 'Stealth, breaking and entering, and covert operations.',
            uses: '• Sneaking and hiding\n• Lock picking\n• Security bypass\n• Covert movement',
            attributes: 'Move, Intellect, Awareness',
            focuses: 'Urban, Wilderness, Security, Disguise'
        },
        'Investigate': {
            description: 'Gathering information, research, and analytical thinking.',
            uses: '• Searching for clues\n• Research and study\n• Analysis and deduction\n• Interrogation',
            attributes: 'Intellect, Awareness, Communication',
            focuses: 'Research, Deduction, Forensics, Interrogation'
        },
        'Lore': {
            description: 'Knowledge of history, culture, religion, and academic subjects.',
            uses: '• Historical knowledge\n• Cultural understanding\n• Religious practices\n• Academic research',
            attributes: 'Intellect, Communication, Discipline',
            focuses: 'History, Religion, Culture, Science'
        },
        'Medicine': {
            description: 'Healing, medical knowledge, and understanding of biology.',
            uses: '• Treating injuries\n• Diagnosing illness\n• Surgery and medical procedures\n• Biological knowledge',
            attributes: 'Intellect, Move, Discipline',
            focuses: 'Surgery, Diagnosis, Pharmacology, Biology'
        },
        'Mentat': {
            description: 'Advanced mental computation, logic, and human computer abilities.',
            uses: '• Complex calculations\n• Logical analysis\n• Pattern recognition\n• Strategic planning',
            attributes: 'Intellect, Discipline, Awareness',
            focuses: 'Computation, Logic, Analysis, Strategy'
        },
        'Persuade': {
            description: 'Social interaction, negotiation, and influencing others.',
            uses: '• Negotiation and bargaining\n• Social manipulation\n• Diplomacy\n• Seduction and charm',
            attributes: 'Communication, Intellect, Awareness',
            focuses: 'Negotiation, Deception, Seduction, Diplomacy'
        },
        'Pilot': {
            description: 'Operating aircraft, spacecraft, and complex flying vehicles.',
            uses: '• Flying ornithopters\n• Spacecraft operation\n• Aerial combat\n• Navigation',
            attributes: 'Move, Awareness, Intellect',
            focuses: 'Ornithopters, Spacecraft, Combat, Navigation'
        },
        'Spice': {
            description: 'Understanding and using the spice melange and its effects.',
            uses: '• Spice harvesting\n• Prescient visions\n• Spice addiction management\n• Melange trade',
            attributes: 'Discipline, Awareness, Intellect',
            focuses: 'Harvesting, Prescience, Trade, Addiction'
        },
        'Stealth': {
            description: 'Moving unseen, hiding, and avoiding detection.',
            uses: '• Sneaking and hiding\n• Silent movement\n• Camouflage\n• Avoiding detection',
            attributes: 'Move, Awareness, Discipline',
            focuses: 'Urban, Wilderness, Crowds, Shadows'
        },
        'Survival': {
            description: 'Wilderness skills, environmental adaptation, and basic survival.',
            uses: '• Desert survival\n• Finding food and water\n• Weather prediction\n• Animal handling',
            attributes: 'Muscle, Awareness, Discipline',
            focuses: 'Desert, Arctic, Urban, Animals'
        },
        'Tech': {
            description: 'Understanding and operating technology and machinery.',
            uses: '• Equipment repair\n• Technology operation\n• Engineering\n• Computer systems',
            attributes: 'Intellect, Move, Awareness',
            focuses: 'Repair, Engineering, Computers, Weapons'
        },
        'Understand': {
            description: 'Empathy, reading people, and understanding motivations.',
            uses: '• Reading body language\n• Understanding emotions\n• Detecting lies\n• Empathic connection',
            attributes: 'Awareness, Communication, Intellect',
            focuses: 'Emotions, Deception, Motivation, Empathy'
        }
    };
    return skillData[skillName] || {
        description: 'Skill information not available.',
        uses: 'Various applications',
        attributes: 'Multiple',
        focuses: 'Various'
    };
}
function getRulesInformation(topic) {
    const rulesData = {
        'basic_test': {
            title: 'Basic Test',
            description: 'The core mechanic of Dune 2d20. Roll 2d20, add attribute + skill, compare to difficulty.',
            fields: [
                { name: '🎲 Dice Pool', value: '2d20 base + bonus dice from assets, determination, momentum', inline: false },
                { name: '🎯 Target Number', value: 'Attribute + Skill value', inline: true },
                { name: '📊 Difficulty', value: 'Number of successes needed (usually 1-3)', inline: true },
                { name: '✅ Success', value: 'Roll ≤ Target Number', inline: true },
                { name: '🎯 Critical Hit', value: 'Rolling a 1 = 2 successes', inline: true },
                { name: '⚠️ Complication', value: 'Rolling 20 adds 1 Threat', inline: true }
            ]
        },
        'momentum': {
            title: 'Momentum',
            description: 'Shared resource representing the group\'s advantage and forward progress.',
            fields: [
                { name: '📈 Gaining', value: 'Extra successes beyond difficulty generate Momentum', inline: false },
                { name: '💰 Spending', value: '• 1 Momentum = 1 bonus die\n• 2 Momentum = Obtain information\n• 3 Momentum = Create opportunity', inline: false },
                { name: '🔄 Maximum', value: 'Usually 6, resets between scenes', inline: true }
            ]
        },
        'threat': {
            title: 'Threat',
            description: 'GM resource representing mounting danger and complications.',
            fields: [
                { name: '📈 Gaining', value: 'Complications (rolling 20) add Threat', inline: false },
                { name: '💀 Spending', value: '• 1 Threat = Add die to NPC pool\n• 2 Threat = Introduce complication\n• 3+ Threat = Escalate danger', inline: false },
                { name: '⚠️ Accumulation', value: 'Persists between scenes, building tension', inline: true }
            ]
        },
        'determination': {
            title: 'Determination',
            description: 'Personal resource representing character drive and willpower.',
            fields: [
                { name: '💪 Uses', value: '• Add 1 bonus die to any test\n• Activate certain talents\n• Push through adversity', inline: false },
                { name: '🔄 Recovery', value: 'Regain by acting on Drives or achieving goals', inline: true },
                { name: '📊 Maximum', value: 'Usually 3, varies by character', inline: true }
            ]
        },
        'complications': {
            title: 'Complications',
            description: 'Negative consequences that arise from rolling 20s on tests.',
            fields: [
                { name: '🎲 Occurrence', value: 'Any die showing 20 generates a complication', inline: false },
                { name: '⚠️ Effects', value: '• Adds 1 Threat to GM pool\n• May cause immediate problems\n• Can occur even on successful tests', inline: false },
                { name: '🎭 Narrative', value: 'Should create interesting story complications', inline: true }
            ]
        },
        'extended_tests': {
            title: 'Extended Tests',
            description: 'Complex tasks requiring multiple successful tests over time.',
            fields: [
                { name: '🎯 Structure', value: 'Set target number of total successes needed', inline: false },
                { name: '⏱️ Time Limit', value: 'Optional limit on number of attempts', inline: true },
                { name: '📊 Progress', value: 'Track cumulative successes toward goal', inline: true },
                { name: '⚠️ Complications', value: 'Accumulate and may cause setbacks', inline: true }
            ]
        },
        'conflict': {
            title: 'Conflict',
            description: 'Structured scenes for combat and other dramatic confrontations.',
            fields: [
                { name: '🎲 Initiative', value: 'Roll d20 + relevant skill (usually Discipline)', inline: false },
                { name: '⚡ Actions', value: '• Minor Action: Move, aim, simple task\n• Major Action: Attack, complex action\n• Reaction: Respond to others', inline: false },
                { name: '🛡️ Defense', value: 'Passive defense or active dodge/parry tests', inline: true }
            ]
        },
        'damage': {
            title: 'Damage',
            description: 'Physical and mental harm in conflicts.',
            fields: [
                { name: '💥 Rolling', value: 'Roll damage dice + weapon rating', inline: false },
                { name: '🛡️ Soak', value: 'Armor and toughness reduce damage', inline: true },
                { name: '❤️ Vigor', value: 'Physical health and stamina', inline: true },
                { name: '🧠 Resolve', value: 'Mental fortitude and composure', inline: true },
                { name: '💀 Consequences', value: 'Injuries impose penalties and complications', inline: false }
            ]
        }
    };
    return rulesData[topic] || {
        title: 'Unknown Topic',
        description: 'Rules information not available for this topic.'
    };
}
