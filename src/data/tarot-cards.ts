/**
 * Complete Dune Tarot deck data based on canonical sources
 */

import { TarotCard, TarotSuit, TarotRank } from '../types/tarot-types';

// Major Arcana Cards (22 cards)
export const MAJOR_ARCANA: TarotCard[] = [
  {
    id: 'ma_emperor',
    name: 'The Emperor',
    isMajorArcana: true,
    description: 'The God-Emperor of the Known Universe, seated upon the Golden Lion Throne.',
    symbolism: 'Ultimate authority, divine rule, stagnation vs stability',
    roleplayHints: ['Power and responsibility', 'The weight of absolute rule', 'Isolation of leadership']
  },
  {
    id: 'ma_great_worm',
    name: 'The Great Worm',
    isMajorArcana: true,
    description: 'Shai-Hulud, the Maker, coiled beneath the endless dunes of Arrakis.',
    symbolism: 'Transformation, cycles of life and death, the desert\'s power',
    roleplayHints: ['Ancient wisdom', 'Unstoppable force', 'Connection to the spice']
  },
  {
    id: 'ma_desolate_sand',
    name: 'Desolate Sand',
    isMajorArcana: true,
    description: 'Endless dunes stretching to the horizon under twin suns.',
    symbolism: 'Isolation, endurance, the harshness of survival',
    roleplayHints: ['Solitude and reflection', 'Testing one\'s limits', 'Desert wisdom']
  },
  {
    id: 'ma_discipline',
    name: 'Discipline',
    isMajorArcana: true,
    description: 'A Fremen warrior in a stillsuit, conserving every drop of water.',
    symbolism: 'Self-control, conservation, adapting to harsh conditions',
    roleplayHints: ['Resource management', 'Survival instincts', 'Inner strength']
  },
  {
    id: 'ma_prescience',
    name: 'Prescience',
    isMajorArcana: true,
    description: 'The Eyes of Ibad, blue within blue, seeing all possible futures.',
    symbolism: 'Foresight, burden of knowledge, the spice trance',
    roleplayHints: ['Knowing too much', 'The weight of prophecy', 'Seeing consequences']
  },
  {
    id: 'ma_crysknife',
    name: 'The Maker\'s Tooth',
    isMajorArcana: true,
    description: 'A sacred crysknife, milky white and never dulling.',
    symbolism: 'Sacred duty, honor, the bond between warrior and weapon',
    roleplayHints: ['Personal honor', 'Sacred oaths', 'Life and death decisions']
  },
  {
    id: 'ma_harvester',
    name: 'The Harvester',
    isMajorArcana: true,
    description: 'A massive spice harvester working the deep desert.',
    symbolism: 'Industry vs nature, exploitation, the spice must flow',
    roleplayHints: ['Economic necessity', 'Environmental cost', 'The price of progress']
  },
  {
    id: 'ma_ornithopter',
    name: 'Wings of Arrakis',
    isMajorArcana: true,
    description: 'An ornithopter soaring above the dunes, wings beating like a dragonfly.',
    symbolism: 'Freedom, perspective, rising above earthly concerns',
    roleplayHints: ['New viewpoints', 'Escape and mobility', 'Seeing the bigger picture']
  },
  {
    id: 'ma_thumper',
    name: 'The Summoner',
    isMajorArcana: true,
    description: 'A thumper device calling forth Shai-Hulud from the deep desert.',
    symbolism: 'Calling forth power, ritual summons, dangerous gambles',
    roleplayHints: ['Invoking greater forces', 'Calculated risks', 'Ancient protocols']
  },
  {
    id: 'ma_deathstill',
    name: 'Water of Life',
    isMajorArcana: true,
    description: 'A deathstill extracting the precious water from the deceased.',
    symbolism: 'Death and rebirth, honoring the fallen, practical necessity',
    roleplayHints: ['Accepting loss', 'Honoring sacrifice', 'Practical mourning']
  },
  {
    id: 'ma_stilltent',
    name: 'Desert Shelter',
    isMajorArcana: true,
    description: 'A stilltent providing refuge in the trackless waste.',
    symbolism: 'Temporary sanctuary, preparation, finding safety in danger',
    roleplayHints: ['Planning ahead', 'Creating safe spaces', 'Temporary solutions']
  },
  {
    id: 'ma_fremkit',
    name: 'Desert Survival',
    isMajorArcana: true,
    description: 'The essential tools for desert survival: Fremkit components spread on sand.',
    symbolism: 'Preparation, self-reliance, mastery of environment',
    roleplayHints: ['Being prepared', 'Self-sufficiency', 'Knowing the tools']
  },
  {
    id: 'ma_arrakeen',
    name: 'The Capital',
    isMajorArcana: true,
    description: 'The ancient city of Arrakeen, seat of planetary power.',
    symbolism: 'Civilization vs wilderness, political power, ancient foundations',
    roleplayHints: ['Political maneuvering', 'Urban vs desert culture', 'Centers of power']
  },
  {
    id: 'ma_guild_navigator',
    name: 'The Navigator',
    isMajorArcana: true,
    description: 'A Guild Navigator in his spice-filled tank, eyes of deepest blue.',
    symbolism: 'Transformation for purpose, sacrifice for ability, seeing the path',
    roleplayHints: ['Necessary transformation', 'Guiding others', 'The price of ability']
  },
  {
    id: 'ma_bene_gesserit',
    name: 'The Truthsayer',
    isMajorArcana: true,
    description: 'A Bene Gesserit Reverend Mother, keeper of ancient knowledge.',
    symbolism: 'Hidden knowledge, genetic memory, long-term planning',
    roleplayHints: ['Secret wisdom', 'Long-term thinking', 'Hidden agendas']
  },
  {
    id: 'ma_mentat',
    name: 'The Human Computer',
    isMajorArcana: true,
    description: 'A Mentat in deep computation, lips stained with sapho juice.',
    symbolism: 'Pure logic, human potential, calculated decisions',
    roleplayHints: ['Logical analysis', 'Suppressing emotion', 'Complex calculations']
  },
  {
    id: 'ma_swordmaster',
    name: 'The Blade Master',
    isMajorArcana: true,
    description: 'A Swordmaster of Ginaz in perfect combat stance.',
    symbolism: 'Martial excellence, dedication to craft, honor in combat',
    roleplayHints: ['Mastery through practice', 'Honor in conflict', 'Precision and skill']
  },
  {
    id: 'ma_sardaukar',
    name: 'Terror Troops',
    isMajorArcana: true,
    description: 'Sardaukar soldiers in formation, the Emperor\'s personal guard.',
    symbolism: 'Fanatic loyalty, military might, fear as a weapon',
    roleplayHints: ['Absolute loyalty', 'Military discipline', 'Intimidation']
  },
  {
    id: 'ma_fremen',
    name: 'Desert Power',
    isMajorArcana: true,
    description: 'Fremen warriors emerging from the deep desert, eyes blue within blue.',
    symbolism: 'Hidden strength, desert wisdom, fierce independence',
    roleplayHints: ['Hidden capabilities', 'Survival skills', 'Fierce loyalty']
  },
  {
    id: 'ma_spice_blow',
    name: 'Spice Blow',
    isMajorArcana: true,
    description: 'A great spice blow erupting from the deep desert, golden clouds rising.',
    symbolism: 'Sudden opportunity, dangerous wealth, natural forces',
    roleplayHints: ['Unexpected fortune', 'Natural power', 'Seizing opportunities']
  },
  {
    id: 'ma_paul_muaddib',
    name: 'The Chosen One',
    isMajorArcana: true,
    description: 'A figure in stillsuit and desert robes, bearing the mantle of prophecy.',
    symbolism: 'Fulfilled destiny, burden of leadership, transformation',
    roleplayHints: ['Accepting destiny', 'Leadership burdens', 'Personal transformation']
  },
  {
    id: 'ma_golden_path',
    name: 'The Golden Path',
    isMajorArcana: true,
    description: 'A shimmering path through time, showing humanity\'s future.',
    symbolism: 'Destiny, sacrifice for the greater good, long-term survival',
    roleplayHints: ['Difficult choices', 'Greater purpose', 'Long-term thinking']
  }
];

// Minor Arcana - Generated programmatically
export const MINOR_ARCANA: TarotCard[] = [];

// Generate minor arcana for each suit
Object.values(TarotSuit).forEach(suit => {
  // Number cards (1-10)
  Object.values(TarotRank).filter(rank => 
    !['Lord', 'Lady', 'Heir', 'Regent'].includes(rank)
  ).forEach(rank => {
    MINOR_ARCANA.push({
      id: `${suit.toLowerCase()}_${rank.toLowerCase()}`,
      name: `${rank} of ${suit}`,
      suit,
      rank: rank as TarotRank,
      isMajorArcana: false,
      description: `The ${rank} of ${suit} represents ${getSuitMeaning(suit, rank)}`,
      symbolism: getSuitSymbolism(suit),
      roleplayHints: getSuitRoleplayHints(suit)
    });
  });

  // Face cards
  ['Regent', 'Heir', 'Lady', 'Lord'].forEach(rank => {
    MINOR_ARCANA.push({
      id: `${suit.toLowerCase()}_${rank.toLowerCase()}`,
      name: `${rank} of ${suit}`,
      suit,
      rank: rank as TarotRank,
      isMajorArcana: false,
      description: `The ${rank} of ${suit} represents ${getFaceCardMeaning(suit, rank as TarotRank)}`,
      symbolism: `${getSuitSymbolism(suit)} - ${getFaceCardSymbolism(rank as TarotRank)}`,
      roleplayHints: [...getSuitRoleplayHints(suit), ...getFaceCardRoleplayHints(rank as TarotRank)]
    });
  });
});

function getSuitMeaning(suit: TarotSuit, rank: TarotRank): string {
  const meanings = {
    [TarotSuit.KNIVES]: 'conflict, precision, cutting through deception',
    [TarotSuit.COINS]: 'wealth, trade, material resources',
    [TarotSuit.WATER]: 'life, precious resources, emotional depth',
    [TarotSuit.SPICE]: 'transformation, prescience, addiction and power'
  };
  return meanings[suit];
}

function getSuitSymbolism(suit: TarotSuit): string {
  const symbolism = {
    [TarotSuit.KNIVES]: 'Conflict and precision',
    [TarotSuit.COINS]: 'Material wealth and trade',
    [TarotSuit.WATER]: 'Life and precious resources',
    [TarotSuit.SPICE]: 'Transformation and power'
  };
  return symbolism[suit];
}

function getSuitRoleplayHints(suit: TarotSuit): string[] {
  const hints = {
    [TarotSuit.KNIVES]: ['Combat decisions', 'Sharp words', 'Cutting to the truth'],
    [TarotSuit.COINS]: ['Economic concerns', 'Trade negotiations', 'Material needs'],
    [TarotSuit.WATER]: ['Life and death', 'Emotional connections', 'Precious resources'],
    [TarotSuit.SPICE]: ['Transformation', 'Vision and foresight', 'Addiction and power']
  };
  return hints[suit];
}

function getFaceCardMeaning(suit: TarotSuit, rank: TarotRank): string {
  const meanings: Partial<Record<TarotRank, string>> = {
    [TarotRank.REGENT]: 'established authority and governance',
    [TarotRank.HEIR]: 'potential and inheritance',
    [TarotRank.LADY]: 'wisdom and nurturing power',
    [TarotRank.LORD]: 'command and leadership'
  };
  return `${meanings[rank] || 'unknown aspect'} in matters of ${getSuitMeaning(suit, rank)}`;
}

function getFaceCardSymbolism(rank: TarotRank): string {
  const symbolism: Partial<Record<TarotRank, string>> = {
    [TarotRank.REGENT]: 'Established authority',
    [TarotRank.HEIR]: 'Potential and growth',
    [TarotRank.LADY]: 'Wisdom and intuition',
    [TarotRank.LORD]: 'Command and leadership'
  };
  return symbolism[rank] || '';
}

function getFaceCardRoleplayHints(rank: TarotRank): string[] {
  const hints: Partial<Record<TarotRank, string[]>> = {
    [TarotRank.REGENT]: ['Administrative decisions', 'Governing others', 'Maintaining order'],
    [TarotRank.HEIR]: ['Future potential', 'Learning and growth', 'Inheritance matters'],
    [TarotRank.LADY]: ['Wisdom and counsel', 'Nurturing others', 'Emotional intelligence'],
    [TarotRank.LORD]: ['Leadership decisions', 'Taking command', 'Noble responsibilities']
  };
  return hints[rank] || [];
}

// Complete deck
export const COMPLETE_TAROT_DECK: TarotCard[] = [...MAJOR_ARCANA, ...MINOR_ARCANA];
