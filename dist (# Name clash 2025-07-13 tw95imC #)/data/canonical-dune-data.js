"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POINT_BUY_RULES = exports.CREATION_STEPS = exports.ARCHETYPE_ASSETS = exports.GENERAL_ASSETS = exports.ARCHETYPE_TALENTS = exports.GENERAL_TALENTS = exports.SKILL_FOCUSES = exports.SKILLS = exports.DRIVES = exports.ARCHETYPES = void 0;
exports.ARCHETYPES = [
    {
        name: 'Noble',
        description: 'Born to power and privilege, skilled in politics and leadership.'
    },
    {
        name: 'Mentat',
        description: 'Human computer with advanced logic and calculation abilities.'
    },
    {
        name: 'Bene Gesserit',
        description: 'Prana-bindu Sisterhood expert in Voice and subtlety.'
    },
    {
        name: 'Fremen',
        description: 'Desert survivor and guerrilla fighter of Arrakis.'
    },
    {
        name: 'Smuggler',
        description: 'Independent trader navigating official and unofficial channels.'
    },
    {
        name: 'Soldier',
        description: 'Professional warrior trained in tactics and combat.'
    },
    {
        name: 'Agent',
        description: 'Spy, assassin, or covert operator adept at infiltration and intrigue.'
    },
    {
        name: 'Planetologist',
        description: 'Scientist-explorer, master of ecology and survival.'
    },
    {
        name: 'Swordmaster',
        description: 'Elite swordfighter and martial artist.'
    },
    {
        name: 'Guild Agent',
        description: 'Emissary of the Spacing Guild, expert in travel and logistics.'
    },
    {
        name: 'Face Dancer',
        description: 'Tleilaxu shapeshifter skilled in impersonation and subterfuge.'
    },
    {
        name: 'Courtier',
        description: 'Master of etiquette, social maneuvering, and diplomacy.'
    },
    {
        name: 'Envoy',
        description: 'Skilled negotiator, diplomat, and mediator.'
    },
    {
        name: 'Duellist',
        description: 'Specialist in personal combat and formal duels.'
    }
];
exports.DRIVES = [
    {
        name: 'Duty',
        description: 'Loyalty to your House or cause above all else.'
    },
    {
        name: 'Faith',
        description: 'Trust in religion, tradition, or a higher power.'
    },
    {
        name: 'Justice',
        description: 'Belief in fairness, law, and moral order.'
    },
    {
        name: 'Power',
        description: 'Ambition, influence, and the will to rule or control.'
    },
    {
        name: 'Truth',
        description: 'Pursuit of knowledge, honesty, and understanding.'
    }
];
exports.SKILLS = [
    {
        name: 'Battle',
        description: 'Combat prowess and tactics, both armed and unarmed.'
    },
    {
        name: 'Communicate',
        description: 'Diplomacy, persuasion, negotiation, and deception.'
    },
    {
        name: 'Discipline',
        description: 'Willpower, self-control, and mental fortitude.'
    },
    {
        name: 'Move',
        description: 'Physical agility, mobility, piloting, and survival.'
    },
    {
        name: 'Understand',
        description: 'Perception, investigation, deduction, analysis.'
    }
];
exports.SKILL_FOCUSES = {
    'Battle': [
        'Blades',
        'Projectiles',
        'Unarmed',
        'Tactics',
        'Dueling',
        'Desert Combat',
        'Urban Combat',
        'Ambushes'
    ],
    'Communicate': [
        'Politics',
        'Inspiration',
        'Persuasion',
        'Deception',
        'Seduction',
        'Diplomacy',
        'Intimidation',
        'Strategy',
        'Fast Talk',
        'Leadership'
    ],
    'Discipline': [
        'Fear',
        'Pain',
        'Temptation',
        'Concentration',
        'Meditation',
        'Interrogation Resistance',
        'Self-Control',
        'Poison Tolerance',
        'Faith Endurance'
    ],
    'Move': [
        'Groundcars',
        'Ornithopters',
        'Animals',
        'Racing',
        'Desert Survival',
        'Wilderness Navigation',
        'Stealth',
        'Urban Stealth',
        'Piloting',
        'Evasion'
    ],
    'Understand': [
        'Research',
        'Deduction',
        'Forensics',
        'Interrogation',
        'Computation (Mentat)',
        'Logic',
        'Analysis',
        'Lore (History, Culture, Science)',
        'Spice Analysis',
        'Pharmacology',
        'Espionage',
        'Engineering'
    ]
};
exports.GENERAL_TALENTS = [
    {
        name: 'Quick Study',
        description: 'Learn new skills rapidly'
    },
    {
        name: 'Tough as Sand',
        description: 'Endure hardship'
    },
    {
        name: 'Master of Disguise',
        description: 'Assume false identities'
    },
    {
        name: 'Resilient Will',
        description: 'Resist mental attack'
    },
    {
        name: 'Silver Tongue',
        description: 'Persuasion bonus'
    },
    {
        name: 'Rapid Healer',
        description: 'Recover quickly from wounds'
    },
    {
        name: 'Sandwalker',
        description: 'Move quietly on Arrakis'
    }
];
exports.ARCHETYPE_TALENTS = {
    'Bene Gesserit': [
        { name: 'Voice', description: 'Command through Voice' },
        { name: 'Prana-Bindu Mastery', description: 'Superior body control' }
    ],
    'Mentat': [
        { name: 'Calculating Machine', description: 'Enhanced computation' }
    ],
    'Fremen': [
        { name: 'Sandrider', description: 'Ride sandworms' },
        { name: 'Water Discipline', description: 'Survive on minimal water' }
    ],
    'Smuggler': [
        { name: "Smuggler's Network", description: 'Access black markets' }
    ],
    'Guild Agent': [
        { name: 'Guild Secrets', description: 'Navigation/trade insight' }
    ],
    'Face Dancer': [
        { name: "Face Dancer's Masquerade", description: 'Impersonate others' }
    ],
    'Swordmaster': [
        { name: 'Blade Mastery', description: 'Superior swordsmanship' }
    ],
    'Agent': [
        { name: 'Shadow Network', description: 'Access to spy contacts' }
    ],
    'Planetologist': [
        { name: 'Environmental Adaptation', description: 'Thrive in harsh environments' }
    ],
    'Noble': [
        { name: 'Noble Bearing', description: 'Command respect through presence' }
    ],
    'Soldier': [
        { name: 'Battle Hardened', description: 'Resist fear and shock in combat' }
    ],
    'Courtier': [
        { name: 'Court Intrigue', description: 'Navigate political schemes' }
    ],
    'Envoy': [
        { name: 'Diplomatic Immunity', description: 'Protection through status' }
    ],
    'Duellist': [
        { name: 'Formal Combat', description: 'Excel in structured duels' }
    ]
};
exports.GENERAL_ASSETS = [
    {
        name: 'Crysknife',
        description: 'Fremen blade'
    },
    {
        name: 'Ornithopter',
        description: 'Personal flier'
    },
    {
        name: 'Political Favor',
        description: 'Owed favor from influential person'
    },
    {
        name: 'Safe House',
        description: 'Secure location for meetings'
    },
    {
        name: 'Spice Stash',
        description: 'Hidden cache of melange'
    },
    {
        name: "Water Seller's Token",
        description: 'Access to water markets'
    },
    {
        name: 'Poison Detector',
        description: 'Device to detect toxins'
    },
    {
        name: "Smuggler's Cache",
        description: 'Hidden storage for contraband'
    }
];
exports.ARCHETYPE_ASSETS = {
    'Bene Gesserit': [
        { name: 'Bene Gesserit Ring', description: 'Sisterhood identification and tool' }
    ],
    'Mentat': [
        { name: 'Mentat Tablets', description: 'Sapho juice and computation aids' }
    ],
    'Fremen': [
        { name: 'Stilltent', description: 'Desert survival shelter' }
    ],
    'Planetologist': [
        { name: 'Stilltent', description: 'Desert survival shelter' }
    ],
    'Guild Agent': [
        { name: 'Guild Datacard', description: 'Access to Guild information networks' }
    ],
    'Swordmaster': [
        { name: "Swordmaster's Blade", description: 'Masterwork weapon' }
    ],
    'Agent': [
        { name: "Agent's Disguise Kit", description: 'Tools for assuming false identities' }
    ],
    'Smuggler': [
        { name: 'Contraband Contacts', description: 'Network of black market dealers' }
    ],
    'Noble': [
        { name: 'House Signet', description: 'Symbol of noble authority' }
    ],
    'Soldier': [
        { name: 'Military Gear', description: 'Professional combat equipment' }
    ],
    'Courtier': [
        { name: 'Court Attire', description: 'Fine clothing for formal occasions' }
    ],
    'Envoy': [
        { name: 'Diplomatic Credentials', description: 'Official papers and seals' }
    ],
    'Duellist': [
        { name: 'Dueling Blade', description: 'Weapon suited for formal combat' }
    ],
    'Face Dancer': [
        { name: 'Identity Papers', description: 'Forged documents for various personas' }
    ]
};
exports.CREATION_STEPS = [
    { id: 0, name: 'NAME', title: '📝 Set Your Character Name', description: 'Choose a name that fits the Dune universe.' },
    { id: 1, name: 'CONCEPT', title: '💭 Define Your Character Concept', description: 'Describe your character in a single phrase.' },
    { id: 2, name: 'ARCHETYPES', title: '🎭 Select Your Archetypes', description: 'Choose 1-3 archetypes to mix and match.' },
    { id: 3, name: 'DRIVES', title: '🎯 Assign Drive Points', description: 'Distribute points among your five drives.' },
    { id: 4, name: 'SKILLS', title: '⚔️ Assign Skill Points', description: 'Distribute points among your five skills.' },
    { id: 5, name: 'FOCUSES', title: '🎯 Select Skill Focuses', description: 'Choose focuses for your skills based on your archetypes.' },
    { id: 6, name: 'TALENTS', title: '✨ Choose Talents', description: 'Select 3 talents from general or archetype-specific lists.' },
    { id: 7, name: 'ASSETS', title: '🎒 Choose Assets', description: 'Select 3 assets from general or archetype-specific lists.' },
    { id: 8, name: 'COMPLETE', title: '✅ Character Creation Complete', description: 'Your character has been created successfully!' }
];
exports.POINT_BUY_RULES = {
    DRIVES: {
        TOTAL_POINTS: 15,
        MIN_PER_DRIVE: 6,
        MAX_PER_DRIVE: 12
    },
    SKILLS: {
        TOTAL_POINTS: 15,
        MIN_PER_SKILL: 4,
        MAX_PER_SKILL: 12
    },
    FOCUSES_PER_SKILL: 1,
    TALENT_COUNT: 3,
    ASSET_COUNT: 3,
    MIN_ARCHETYPES: 1,
    MAX_ARCHETYPES: 3
};
