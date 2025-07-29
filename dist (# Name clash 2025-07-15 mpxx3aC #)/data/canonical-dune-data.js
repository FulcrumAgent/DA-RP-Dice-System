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
        name: 'Trooper',
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
        'Ambushes',
        'Swordmastery',
        'Military History',
        'Shield Fighting'
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
        'Leadership',
        'Social Manipulation',
        'Etiquette',
        'Bargaining'
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
        'Faith Endurance',
        'Psychological Warfare',
        'Conditioning',
        'Mindfulness'
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
        'Evasion',
        'Climbing',
        'Sprinting',
        'Sandwalking'
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
        'Engineering',
        'Cryptography',
        'Planetology'
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
    },
    {
        name: 'Wary',
        description: 'Enhanced awareness of danger'
    },
    {
        name: 'Calm Under Pressure',
        description: 'Maintain composure in stressful situations'
    },
    {
        name: 'Danger Sense',
        description: 'Instinctive awareness of threats'
    }
];
exports.ARCHETYPE_TALENTS = {
    'Bene Gesserit': [
        { name: 'Voice', description: 'Command through Voice' },
        { name: 'Prana-Bindu Mastery', description: 'Superior body control' },
        { name: 'Truthsayer', description: 'Detect lies and deception' },
        { name: 'Memory of Many Lives', description: 'Access ancestral memories' }
    ],
    'Mentat': [
        { name: 'Calculating Machine', description: 'Enhanced computation' },
        { name: 'Data Recall', description: 'Perfect memory recall' },
        { name: 'Pattern Recognition', description: 'Identify complex patterns' },
        { name: 'Logical Leap', description: 'Make intuitive logical connections' }
    ],
    'Fremen': [
        { name: 'Sandrider', description: 'Ride sandworms' },
        { name: 'Water Discipline', description: 'Survive on minimal water' },
        { name: 'Desert Ghost', description: 'Move unseen in the desert' },
        { name: 'Spice Trance', description: 'Enter prescient trance states' }
    ],
    'Smuggler': [
        { name: "Smuggler's Network", description: 'Access black markets' },
        { name: 'Underworld Connections', description: 'Criminal contacts and favors' },
        { name: 'Hidden Cache', description: 'Secret stashes of goods' },
        { name: 'Escape Artist', description: 'Evade capture and pursuit' }
    ],
    'Guild Agent': [
        { name: "Navigator's Eye", description: 'Enhanced spatial awareness' },
        { name: 'Guild Secrets', description: 'Navigation/trade insight' },
        { name: 'Safe Passage', description: 'Guarantee safe travel' },
        { name: 'Zero-G Training', description: 'Expert in zero gravity' }
    ],
    'Planetologist': [
        { name: 'Ecologist', description: 'Understand planetary ecosystems' },
        { name: 'Survivalist', description: 'Thrive in harsh environments' },
        { name: 'Sand Analysis', description: 'Read desert conditions' },
        { name: 'Adaptation', description: 'Quickly adapt to new environments' }
    ],
    'Swordmaster': [
        { name: "Swordmaster's Training", description: 'Superior swordsmanship' },
        { name: 'Shield Mastery', description: 'Expert shield combat' },
        { name: 'Perfect Stance', description: 'Optimal combat positioning' },
        { name: 'Blade Dance', description: 'Fluid, artistic combat style' }
    ],
    'Face Dancer': [
        { name: 'Masquerade', description: 'Impersonate others' },
        { name: 'Identity Theft', description: 'Steal and assume identities' },
        { name: 'Unnerving Presence', description: 'Disturb others instinctively' },
        { name: 'Rapid Healing', description: 'Accelerated recovery' }
    ],
    'Noble': [
        { name: 'Commanding Presence', description: 'Command respect through presence' },
        { name: 'Wealth', description: 'Access to significant resources' },
        { name: 'Political Savvy', description: 'Navigate political intrigue' },
        { name: 'Public Image', description: 'Maintain reputation and influence' }
    ],
    'Trooper': [
        { name: 'Iron Discipline', description: 'Resist fear and shock in combat' },
        { name: 'Battlefield Reflexes', description: 'React quickly in combat' },
        { name: 'Weapon Specialist', description: 'Expert with military weapons' },
        { name: 'Squad Leader', description: 'Lead and coordinate troops' }
    ],
    'Agent': [
        { name: 'Shadow Step', description: 'Move unseen and unheard' },
        { name: 'Master Spy', description: 'Expert in espionage' },
        { name: 'Infiltrator', description: 'Penetrate secure locations' },
        { name: 'Poison Master', description: 'Expert with toxins and antidotes' }
    ],
    'Courtier': [
        { name: 'Etiquette Expert', description: 'Master of social protocols' },
        { name: 'Social Web', description: 'Network of social connections' },
        { name: 'Court Secrets', description: 'Knowledge of hidden agendas' },
        { name: 'Flawless Presentation', description: 'Always appear perfect' }
    ],
    'Envoy': [
        { name: 'Mediation', description: 'Resolve conflicts peacefully' },
        { name: 'Multilingual', description: 'Speak many languages fluently' },
        { name: 'Reading the Room', description: 'Understand group dynamics' },
        { name: 'Neutral Ground', description: 'Create safe negotiation spaces' }
    ],
    'Duellist': [
        { name: 'Riposte', description: 'Counter-attack after defense' },
        { name: 'Quick Draw', description: 'Lightning-fast weapon draw' },
        { name: 'Showmanship', description: 'Intimidate through style' },
        { name: 'Intense Focus', description: 'Complete concentration in combat' }
    ]
};
exports.GENERAL_ASSETS = [
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
    },
    {
        name: 'Guild Datacard',
        description: 'Access to Guild information networks'
    },
    {
        name: 'Stillsuit',
        description: 'Desert survival suit'
    },
    {
        name: 'Personal Shield',
        description: 'Holtzman defensive field'
    },
    {
        name: 'Money Belt',
        description: 'Hidden currency storage'
    },
    {
        name: 'Trusted Retainer',
        description: 'Loyal personal servant'
    },
    {
        name: 'Secret Correspondence',
        description: 'Hidden messages and intelligence'
    }
];
exports.ARCHETYPE_ASSETS = {
    'Fremen': [
        { name: 'Crysknife', description: 'Sacred Fremen blade' },
        { name: 'Maker Hooks', description: 'Tools for riding sandworms' },
        { name: 'Stilltent', description: 'Desert survival shelter' },
        { name: 'Water Reservoir', description: 'Hidden water storage' },
        { name: 'Camouflage Cloak', description: 'Desert camouflage gear' },
        { name: 'Water Rings', description: 'Fremen water debt tokens' }
    ],
    'Bene Gesserit': [
        { name: 'Sisterhood Ring', description: 'Sisterhood identification and tool' },
        { name: 'Secret Doctrine', description: 'Hidden Bene Gesserit teachings' },
        { name: 'Herbal Kit', description: 'Medicinal herbs and poisons' }
    ],
    'Mentat': [
        { name: 'Computation Tablets', description: 'Sapho juice and computation aids' },
        { name: 'Data Library', description: 'Vast information repository' },
        { name: 'Logic Engine', description: 'Mechanical calculation device' }
    ],
    'Smuggler': [
        { name: 'Contraband', description: 'Illegal goods for trade' },
        { name: 'Bribery Funds', description: 'Money for corruption' },
        { name: 'Forged Documents', description: 'False identification papers' }
    ],
    'Guild Agent': [
        { name: 'Heighliner Pass', description: 'Access to Guild transport' },
        { name: 'Guild Contract', description: 'Official Guild agreement' },
        { name: 'Navigation Charts', description: 'Space travel routes' }
    ],
    'Planetologist': [
        { name: 'Sand Sensor', description: 'Desert analysis equipment' },
        { name: 'Soil Sampler', description: 'Geological testing tools' },
        { name: 'Field Journal', description: 'Research notes and data' }
    ],
    'Swordmaster': [
        { name: 'Masterwork Blade', description: 'Superior crafted weapon' },
        { name: 'Practice Automaton', description: 'Training combat dummy' },
        { name: 'Ceremonial Armor', description: 'Formal combat protection' }
    ],
    'Face Dancer': [
        { name: 'Disguise Kit', description: 'Tools for impersonation' },
        { name: 'Tleilaxu Toxin', description: 'Biological weapon' },
        { name: 'Identity Papers', description: 'Forged documents for various personas' }
    ],
    'Noble': [
        { name: 'Family Seal', description: 'Symbol of noble authority' },
        { name: 'Estate', description: 'Noble property and holdings' },
        { name: 'Entourage', description: 'Personal staff and retainers' },
        { name: 'Private Vault', description: 'Secure storage facility' }
    ],
    'Trooper': [
        { name: 'Military Rifle', description: 'Professional combat weapon' },
        { name: 'Combat Drugs', description: 'Battle enhancement substances' },
        { name: 'Command Whistle', description: 'Military coordination tool' }
    ],
    'Agent': [
        { name: 'Listening Device', description: 'Surveillance equipment' },
        { name: 'Lockpicks', description: 'Tools for bypassing security' },
        { name: 'Safe Route Map', description: 'Secret passage information' }
    ],
    'Courtier': [
        { name: 'Gift of Favour', description: 'Valuable diplomatic present' },
        { name: 'Expensive Outfit', description: 'Fine clothing for formal occasions' },
        { name: 'Court Invitation', description: 'Access to exclusive events' }
    ],
    'Envoy': [
        { name: 'Translation Device', description: 'Universal language converter' },
        { name: 'Official Papers', description: 'Diplomatic credentials' },
        { name: 'Treaty Draft', description: 'Preliminary agreement document' }
    ],
    'Duellist': [
        { name: 'Engraved Pistol', description: 'Ornate dueling weapon' },
        { name: "Duelist's Cape", description: 'Formal combat attire' },
        { name: 'Heirloom Weapon', description: 'Ancestral combat implement' }
    ]
};
exports.CREATION_STEPS = [
    { id: 0, name: 'NAME', title: '📝 Set Your Character Name', description: 'Choose a name that fits the Dune universe.' },
    { id: 1, name: 'CONCEPT', title: '💭 Define Your Character Concept', description: 'Describe your character in a single phrase.' },
    { id: 2, name: 'ARCHETYPES', title: '🎭 Select Your Archetypes', description: 'Choose 1-3 archetypes to mix and match.' },
    { id: 3, name: 'DRIVES', title: '🎯 Assign Drive Values', description: 'Assign the values 4, 5, 6, 7, 8 to your five drives (each value used once).' },
    { id: 4, name: 'SKILLS', title: '⚔️ Assign Skill Values', description: 'Assign the values 4, 5, 6, 7, 8 to your five skills (each value used once).' },
    { id: 5, name: 'FOCUSES', title: '🎯 Select Skill Focuses', description: 'Choose focuses for your skills based on your archetypes.' },
    { id: 6, name: 'TALENTS', title: '✨ Choose Talents', description: 'Select 3 talents from general or archetype-specific lists.' },
    { id: 7, name: 'ASSETS', title: '🎒 Choose Assets', description: 'Select 3 assets from general or archetype-specific lists.' },
    { id: 8, name: 'COMPLETE', title: '✅ Character Creation Complete', description: 'Your character has been created successfully!' }
];
exports.POINT_BUY_RULES = {
    DRIVES: {
        TOTAL_POINTS: 30,
        MIN_PER_DRIVE: 4,
        MAX_PER_DRIVE: 12
    },
    SKILLS: {
        TOTAL_POINTS: 20,
        MIN_PER_SKILL: 4,
        MAX_PER_SKILL: 8
    },
    FOCUSES_PER_SKILL: 1,
    TALENT_COUNT: 3,
    ASSET_COUNT: 3,
    MIN_ARCHETYPES: 1,
    MAX_ARCHETYPES: 3
};
