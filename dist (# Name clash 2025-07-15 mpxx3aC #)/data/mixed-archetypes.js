"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ARCHETYPE_NAMES = exports.ARCHETYPES = exports.DRIVE_POINT_VALUES = exports.SKILL_POINT_VALUES = exports.DUNE_DRIVES = exports.DUNE_SKILLS = void 0;
const character_manager_1 = require("../utils/character-manager");
exports.DUNE_SKILLS = character_manager_1.CharacterManager.DUNE_SKILLS;
exports.DUNE_DRIVES = character_manager_1.CharacterManager.DUNE_DRIVES;
exports.SKILL_POINT_VALUES = character_manager_1.CharacterManager.SKILL_POINT_VALUES;
exports.DRIVE_POINT_VALUES = character_manager_1.CharacterManager.DRIVE_POINT_VALUES;
exports.ARCHETYPES = {
    'Agent': {
        name: 'Agent',
        description: 'Covert operative skilled in espionage and infiltration',
        skillAdjustments: {
            'Battle': 0,
            'Communicate': +1,
            'Discipline': +1,
            'Move': +1,
            'Understand': 0
        },
        talents: [
            'Black Market Contacts',
            'Fast Talker',
            'Smuggler\'s Route',
            'Concealed Weapon',
            'Risky Deal'
        ],
        assets: [
            'Hidden Compartment',
            'Forged Documents',
            'Contraband Cache',
            'Fast Ornithopter',
            'Underworld Contact'
        ],
        suggestedFocuses: {
            'Battle': ['Ambush', 'Firearms', 'Improvised Weapons'],
            'Communicate': ['Deception', 'Intimidation', 'Streetwise'],
            'Discipline': ['Composure', 'Stealth', 'Subterfuge'],
            'Move': ['Climbing', 'Parkour', 'Stealth'],
            'Understand': ['Investigation', 'Security Systems', 'Criminal Networks']
        }
    },
    'Bene Gesserit': {
        name: 'Bene Gesserit',
        description: 'Member of the secretive sisterhood with mental and physical training',
        skillAdjustments: {
            'Battle': 0,
            'Communicate': +1,
            'Discipline': +2,
            'Move': 0,
            'Understand': 0
        },
        talents: [
            'Voice Mastery',
            'Observation',
            'Secret Conditioning',
            'Truthsense',
            'Subtle Manipulation'
        ],
        assets: [
            'Poison Snooper',
            'Bene Gesserit Training Manual',
            'Concealed Crysknife',
            'Political Favor',
            'Contact: Sisterhood Ally'
        ],
        suggestedFocuses: {
            'Battle': ['Martial Arts', 'Nerve Strikes', 'Defensive Combat'],
            'Communicate': ['Command Voice', 'Persuasion', 'Reading People'],
            'Discipline': ['Mental Conditioning', 'Pain Resistance', 'Emotional Control'],
            'Move': ['Acrobatics', 'Balance', 'Precise Movement'],
            'Understand': ['Human Nature', 'Politics', 'Ancient Lore']
        }
    },
    'Courtier': {
        name: 'Courtier',
        description: 'Noble court member skilled in politics and social manipulation',
        skillAdjustments: {
            'Battle': 0,
            'Communicate': +2,
            'Discipline': 0,
            'Move': 0,
            'Understand': +1
        },
        talents: [
            'Political Connections',
            'Social Grace',
            'Information Network',
            'Diplomatic Immunity',
            'Noble Bearing'
        ],
        assets: [
            'Noble Signet Ring',
            'Court Dress',
            'Political Favor',
            'Information Network',
            'Contact: Court Insider'
        ],
        suggestedFocuses: {
            'Battle': ['Dueling', 'Ceremonial Combat', 'Honor Duels'],
            'Communicate': ['Diplomacy', 'Etiquette', 'Negotiation'],
            'Discipline': ['Composure', 'Protocol', 'Social Graces'],
            'Move': ['Dancing', 'Ceremonial Movement', 'Grace'],
            'Understand': ['Politics', 'History', 'Noble Houses']
        }
    },
    'Duelist': {
        name: 'Duelist',
        description: 'Master of personal combat and the art of the blade',
        skillAdjustments: {
            'Battle': +2,
            'Communicate': 0,
            'Discipline': +1,
            'Move': +1,
            'Understand': 0
        },
        talents: [
            'Blade Dancing',
            'Shield Timing',
            'Master Duelist',
            'Battle Reflexes',
            'Finesse Fighter'
        ],
        assets: [
            'Mastercrafted Sword',
            'Defensive Shield',
            'Practice Dummy',
            'Duelling Cape',
            'Contact: Sparring Partner'
        ],
        suggestedFocuses: {
            'Battle': ['Blade Work', 'Shield Fighting', 'Combat Reflexes'],
            'Communicate': ['Intimidation', 'Honor Codes', 'Challenge'],
            'Discipline': ['Focus', 'Combat Meditation', 'Pain Tolerance'],
            'Move': ['Acrobatics', 'Combat Movement', 'Evasion'],
            'Understand': ['Combat Tactics', 'Weapon Lore', 'Fighting Styles']
        }
    },
    'Envoy': {
        name: 'Envoy',
        description: 'Diplomatic representative skilled in negotiation and communication',
        skillAdjustments: {
            'Battle': 0,
            'Communicate': +2,
            'Discipline': 0,
            'Move': 0,
            'Understand': +1
        },
        talents: [
            'Diplomatic Immunity',
            'Cultural Adaptation',
            'Negotiation Master',
            'Language Savant',
            'Information Broker'
        ],
        assets: [
            'Diplomatic Credentials',
            'Translation Device',
            'Cultural Database',
            'Secure Communications',
            'Contact: Foreign Diplomat'
        ],
        suggestedFocuses: {
            'Battle': ['Defensive Combat', 'Non-lethal Takedowns', 'Escape'],
            'Communicate': ['Diplomacy', 'Languages', 'Cultural Sensitivity'],
            'Discipline': ['Patience', 'Cultural Adaptation', 'Emotional Control'],
            'Move': ['Travel', 'Ceremonial Movement', 'Escape Routes'],
            'Understand': ['Cultures', 'Politics', 'Trade Routes']
        }
    },
    'Face Dancer': {
        name: 'Face Dancer',
        description: 'Shape-shifting infiltrator with mimicry abilities',
        skillAdjustments: {
            'Battle': +1,
            'Communicate': +2,
            'Discipline': +1,
            'Move': +1,
            'Understand': 0
        },
        talents: [
            'Perfect Mimicry',
            'Shape Shifting',
            'Identity Theft',
            'Cellular Control',
            'Memory Absorption'
        ],
        assets: [
            'Identity Documents',
            'Disguise Kit',
            'Memory Enhancer',
            'Cellular Modifier',
            'Contact: Tleilaxu Handler'
        ],
        suggestedFocuses: {
            'Battle': ['Surprise Attacks', 'Assassination', 'Unarmed Combat'],
            'Communicate': ['Impersonation', 'Voice Mimicry', 'Deception'],
            'Discipline': ['Identity Control', 'Mental Flexibility', 'Adaptation'],
            'Move': ['Infiltration', 'Stealth', 'Body Control'],
            'Understand': ['Psychology', 'Behavior Patterns', 'Identity Analysis']
        }
    },
    'Fremen': {
        name: 'Fremen',
        description: 'Desert warrior adapted to harsh Arrakis conditions',
        skillAdjustments: {
            'Battle': +1,
            'Communicate': 0,
            'Discipline': +1,
            'Move': +1,
            'Understand': 0
        },
        talents: [
            'Sandwalker',
            'Water Discipline',
            'Stillsuit Mastery',
            'Sand Camouflage',
            'Desert Hunter'
        ],
        assets: [
            'Crysknife',
            'Stillsuit (Superior Quality)',
            'Sietch Ally',
            'Desert Survival Kit',
            'Water Rings'
        ],
        suggestedFocuses: {
            'Battle': ['Crysknife Fighting', 'Guerrilla Warfare', 'Desert Combat'],
            'Communicate': ['Desert Signals', 'Fremen Cant', 'Tribal Customs'],
            'Discipline': ['Water Conservation', 'Desert Survival', 'Tribal Honor'],
            'Move': ['Desert Travel', 'Sand Walking', 'Climbing'],
            'Understand': ['Desert Lore', 'Spice Knowledge', 'Tribal History']
        }
    },
    'Guild Agent': {
        name: 'Guild Agent',
        description: 'Representative of the Spacing Guild with access to interstellar travel',
        skillAdjustments: {
            'Battle': 0,
            'Communicate': +1,
            'Discipline': +1,
            'Move': 0,
            'Understand': +2
        },
        talents: [
            'Guild Connections',
            'Spice Addiction Management',
            'Prescient Vision',
            'Navigator Training',
            'Trade Negotiation'
        ],
        assets: [
            'Guild Credentials',
            'Spice Allotment',
            'Navigation Computer',
            'Trade Contracts',
            'Contact: Guild Navigator'
        ],
        suggestedFocuses: {
            'Battle': ['Defensive Combat', 'Ship Combat', 'Tactical Withdrawal'],
            'Communicate': ['Trade Negotiation', 'Guild Protocol', 'Interstellar Commerce'],
            'Discipline': ['Spice Tolerance', 'Mental Clarity', 'Guild Loyalty'],
            'Move': ['Zero-G Movement', 'Ship Operations', 'Space Travel'],
            'Understand': ['Interstellar Trade', 'Navigation', 'Guild Politics']
        }
    },
    'Mentat': {
        name: 'Mentat',
        description: 'Human computer trained in logic and analysis',
        skillAdjustments: {
            'Battle': 0,
            'Communicate': 0,
            'Discipline': +1,
            'Move': 0,
            'Understand': +2
        },
        talents: [
            'Prana-Bindu Analysis',
            'Logic Engine',
            'Pattern Recognition',
            'Probabilistic Reasoning',
            'Memory Palace'
        ],
        assets: [
            'Calculation Slates',
            'Data Scrambler',
            'Contact: Noble House Analyst',
            'Security Codes',
            'Mentat Notebooks'
        ],
        suggestedFocuses: {
            'Battle': ['Tactical Analysis', 'Combat Prediction', 'Strategic Planning'],
            'Communicate': ['Logical Argument', 'Data Presentation', 'Analysis'],
            'Discipline': ['Mental Discipline', 'Logical Thinking', 'Concentration'],
            'Move': ['Calculated Movement', 'Efficiency', 'Precision'],
            'Understand': ['Analysis', 'Pattern Recognition', 'Data Processing']
        }
    },
    'Noble': {
        name: 'Noble',
        description: 'Aristocrat trained in leadership and politics',
        skillAdjustments: {
            'Battle': 0,
            'Communicate': +2,
            'Discipline': 0,
            'Move': 0,
            'Understand': +1
        },
        talents: [
            'Noble Bearing',
            'Political Connections',
            'Resource Access',
            'Command Presence',
            'House Loyalty'
        ],
        assets: [
            'House Signet Ring',
            'Noble Wardrobe',
            'Political Favor',
            'House Guards',
            'Contact: House Retainer'
        ],
        suggestedFocuses: {
            'Battle': ['Leadership', 'Tactical Command', 'Honor Combat'],
            'Communicate': ['Command', 'Diplomacy', 'Noble Protocol'],
            'Discipline': ['Leadership', 'Noble Bearing', 'House Honor'],
            'Move': ['Ceremonial Movement', 'Riding', 'Grace'],
            'Understand': ['Politics', 'House History', 'Strategic Planning']
        }
    },
    'Swordmaster': {
        name: 'Swordmaster',
        description: 'Elite warrior trained in the highest forms of combat',
        skillAdjustments: {
            'Battle': +3,
            'Communicate': 0,
            'Discipline': +1,
            'Move': +1,
            'Understand': 0
        },
        talents: [
            'Blade Dancing',
            'Shield Timing',
            'Master Duelist',
            'Battle Reflexes',
            'Finesse Fighter'
        ],
        assets: [
            'Mastercrafted Sword',
            'Defensive Shield',
            'Practice Dummy',
            'Duelling Cape',
            'Contact: Sparring Partner'
        ],
        suggestedFocuses: {
            'Battle': ['Sword Work', 'Shield Combat', 'Combat Mastery'],
            'Communicate': ['Combat Instruction', 'Warrior Code', 'Intimidation'],
            'Discipline': ['Combat Focus', 'Training Regimen', 'Warrior Discipline'],
            'Move': ['Combat Acrobatics', 'Weapon Forms', 'Battle Movement'],
            'Understand': ['Combat Theory', 'Weapon Mastery', 'Fighting Techniques']
        }
    },
    'Trooper': {
        name: 'Trooper',
        description: 'Professional trooper trained in military tactics and equipment',
        skillAdjustments: {
            'Battle': +2,
            'Communicate': 0,
            'Discipline': +1,
            'Move': +1,
            'Understand': 0
        },
        talents: [
            'Squad Tactics',
            'Heavy Weapons',
            'Field Fortification',
            'Steadfast',
            'Stimulant Training'
        ],
        assets: [
            'Infantry Rifle',
            'Armour Vest',
            'Rations Pack',
            'Desert Survival Manual',
            'Contact: Veteran Sergeant'
        ],
        suggestedFocuses: {
            'Battle': ['Firearms', 'Squad Tactics', 'Military Combat'],
            'Communicate': ['Military Protocol', 'Squad Communication', 'Orders'],
            'Discipline': ['Military Discipline', 'Following Orders', 'Endurance'],
            'Move': ['Military Movement', 'Tactical Positioning', 'Marching'],
            'Understand': ['Military Tactics', 'Equipment', 'Chain of Command']
        }
    },
    'Planetologist': {
        name: 'Planetologist',
        description: 'Scientist specializing in planetary ecology and environmental systems',
        skillAdjustments: {
            'Battle': 0,
            'Communicate': +1,
            'Discipline': +1,
            'Move': +1,
            'Understand': +2
        },
        talents: [
            'Spice Ecology',
            'Terrain Master',
            'Water Finder',
            'Survivalist',
            'Maker Bond'
        ],
        assets: [
            'Spice Sampler Kit',
            'Water Purifier',
            'Ornithopter License',
            'Ecological Survey Maps',
            'Contact: Fremen Ecologist'
        ],
        suggestedFocuses: {
            'Battle': ['Environmental Hazards', 'Survival Combat', 'Defensive Tactics'],
            'Communicate': ['Scientific Presentation', 'Environmental Advocacy', 'Research'],
            'Discipline': ['Scientific Method', 'Environmental Adaptation', 'Research Focus'],
            'Move': ['Terrain Navigation', 'Environmental Movement', 'Exploration'],
            'Understand': ['Ecology', 'Environmental Science', 'Planetary Systems']
        }
    }
};
exports.ARCHETYPE_NAMES = Object.keys(exports.ARCHETYPES);
