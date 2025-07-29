"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SKILL_FOCUS_SUGGESTIONS = exports.ALL_ASSETS = exports.ALL_TALENTS = exports.ASSETS = exports.TALENTS = void 0;
exports.TALENTS = {
    'Bene Gesserit': [
        { name: 'Voice Mastery', category: 'Bene Gesserit' },
        { name: 'Observation', category: 'Bene Gesserit' },
        { name: 'Secret Conditioning', category: 'Bene Gesserit' },
        { name: 'Truthsense', category: 'Bene Gesserit' },
        { name: 'Subtle Manipulation', category: 'Bene Gesserit' }
    ],
    'Mentat': [
        { name: 'Prana-Bindu Analysis', category: 'Mentat' },
        { name: 'Logic Engine', category: 'Mentat' },
        { name: 'Pattern Recognition', category: 'Mentat' },
        { name: 'Probabilistic Reasoning', category: 'Mentat' },
        { name: 'Memory Palace', category: 'Mentat' }
    ],
    'Planetologist': [
        { name: 'Spice Ecology', category: 'Planetologist' },
        { name: 'Terrain Master', category: 'Planetologist' },
        { name: 'Water Finder', category: 'Planetologist' },
        { name: 'Survivalist', category: 'Planetologist' },
        { name: 'Maker Bond', category: 'Planetologist' }
    ],
    'Swordmaster': [
        { name: 'Blade Dancing', category: 'Swordmaster' },
        { name: 'Shield Timing', category: 'Swordmaster' },
        { name: 'Master Duelist', category: 'Swordmaster' },
        { name: 'Battle Reflexes', category: 'Swordmaster' },
        { name: 'Finesse Fighter', category: 'Swordmaster' }
    ],
    'Trooper': [
        { name: 'Squad Tactics', category: 'Trooper' },
        { name: 'Heavy Weapons', category: 'Trooper' },
        { name: 'Field Fortification', category: 'Trooper' },
        { name: 'Steadfast', category: 'Trooper' },
        { name: 'Stimulant Training', category: 'Trooper' }
    ]
};
exports.ASSETS = {
    'Bene Gesserit': [
        { name: 'Poison Snooper', category: 'Bene Gesserit' },
        { name: 'Bene Gesserit Training Manual', category: 'Bene Gesserit' },
        { name: 'Concealed Crysknife', category: 'Bene Gesserit' },
        { name: 'Political Favor', category: 'Bene Gesserit' },
        { name: 'Contact: Sisterhood Ally', category: 'Bene Gesserit' }
    ],
    'Mentat': [
        { name: 'Calculation Slates', category: 'Mentat' },
        { name: 'Data Scrambler', category: 'Mentat' },
        { name: 'Contact: Noble House Analyst', category: 'Mentat' },
        { name: 'Security Codes', category: 'Mentat' },
        { name: 'Mentat Notebooks', category: 'Mentat' }
    ],
    'Planetologist': [
        { name: 'Spice Sampler Kit', category: 'Planetologist' },
        { name: 'Water Purifier', category: 'Planetologist' },
        { name: 'Ornithopter License', category: 'Planetologist' },
        { name: 'Ecological Survey Maps', category: 'Planetologist' },
        { name: 'Contact: Fremen Ecologist', category: 'Planetologist' }
    ],
    'Swordmaster': [
        { name: 'Mastercrafted Sword', category: 'Swordmaster' },
        { name: 'Defensive Shield', category: 'Swordmaster' },
        { name: 'Practice Dummy', category: 'Swordmaster' },
        { name: 'Duelling Cape', category: 'Swordmaster' },
        { name: 'Contact: Sparring Partner', category: 'Swordmaster' }
    ],
    'Trooper': [
        { name: 'Infantry Rifle', category: 'Trooper' },
        { name: 'Armour Vest', category: 'Trooper' },
        { name: 'Rations Pack', category: 'Trooper' },
        { name: 'Desert Survival Manual', category: 'Trooper' },
        { name: 'Contact: Veteran Sergeant', category: 'Trooper' }
    ]
};
exports.ALL_TALENTS = Object.values(exports.TALENTS).flat();
exports.ALL_ASSETS = Object.values(exports.ASSETS).flat();
exports.SKILL_FOCUS_SUGGESTIONS = {
    'Battle': ['Melee Combat', 'Ranged Combat', 'Tactics', 'Leadership', 'Intimidation'],
    'Communicate': ['Persuasion', 'Deception', 'Diplomacy', 'Performance', 'Languages'],
    'Discipline': ['Mental Resistance', 'Fear Control', 'Pain Tolerance', 'Meditation', 'Focus'],
    'Move': ['Stealth', 'Athletics', 'Acrobatics', 'Piloting', 'Parkour'],
    'Understand': ['Investigation', 'Lore', 'Technology', 'Medicine', 'Analysis']
};
