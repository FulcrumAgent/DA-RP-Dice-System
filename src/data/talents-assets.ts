/**
 * Dune RPG Talents and Assets Data
 */

export interface TalentData {
  name: string;
  category: string;
  description?: string;
}

export interface AssetData {
  name: string;
  category: string;
  description?: string;
}

export const TALENTS: { [category: string]: TalentData[] } = {
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

export const ASSETS: { [category: string]: AssetData[] } = {
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

// Get all talents as a flat array
export const ALL_TALENTS: TalentData[] = Object.values(TALENTS).flat();

// Get all assets as a flat array  
export const ALL_ASSETS: AssetData[] = Object.values(ASSETS).flat();

// Skill focus suggestions
export const SKILL_FOCUS_SUGGESTIONS: { [skill: string]: string[] } = {
  'Battle': ['Melee Combat', 'Ranged Combat', 'Tactics', 'Leadership', 'Intimidation'],
  'Communicate': ['Persuasion', 'Deception', 'Diplomacy', 'Performance', 'Languages'],
  'Discipline': ['Mental Resistance', 'Fear Control', 'Pain Tolerance', 'Meditation', 'Focus'],
  'Move': ['Stealth', 'Athletics', 'Acrobatics', 'Piloting', 'Parkour'],
  'Understand': ['Investigation', 'Lore', 'Technology', 'Medicine', 'Analysis']
};
