/**
 * Landsraad Houses for Sysselraad board game
 * Based on the 25 Major Houses from Dune: Awakening
 */

export interface LandsraadHouse {
  id: string;
  name: string;
  cardAssociation: string; // Which tarot card represents this house
  position: { x: number; y: number }; // Board position
  isCenter: boolean;
}

// The 25 Major Houses of the Landsraad
export const LANDSRAAD_HOUSES: LandsraadHouse[] = [
  // Center house
  { id: 'atreides', name: 'House Atreides', cardAssociation: 'ma_paul_muaddib', position: { x: 2, y: 2 }, isCenter: true },

  // Inner ring
  { id: 'harkonnen', name: 'House Harkonnen', cardAssociation: 'ma_desolate_sand', position: { x: 1, y: 1 }, isCenter: false },
  { id: 'corrino', name: 'House Corrino', cardAssociation: 'ma_emperor', position: { x: 2, y: 1 }, isCenter: false },
  { id: 'ordos', name: 'House Ordos', cardAssociation: 'ma_mentat', position: { x: 3, y: 1 }, isCenter: false },
  { id: 'ecaz', name: 'House Ecaz', cardAssociation: 'ma_discipline', position: { x: 3, y: 2 }, isCenter: false },
  { id: 'moritani', name: 'House Moritani', cardAssociation: 'ma_crysknife', position: { x: 3, y: 3 }, isCenter: false },
  { id: 'richese', name: 'House Richese', cardAssociation: 'ma_harvester', position: { x: 2, y: 3 }, isCenter: false },
  { id: 'vernius', name: 'House Vernius', cardAssociation: 'ma_ornithopter', position: { x: 1, y: 3 }, isCenter: false },
  { id: 'ginaz', name: 'House Ginaz', cardAssociation: 'ma_swordmaster', position: { x: 1, y: 2 }, isCenter: false },

  // Outer ring
  { id: 'fenring', name: 'House Fenring', cardAssociation: 'ma_truthsayer', position: { x: 0, y: 0 }, isCenter: false },
  { id: 'halleck', name: 'House Halleck', cardAssociation: 'ma_blade_master', position: { x: 1, y: 0 }, isCenter: false },
  { id: 'thorvald', name: 'House Thorvald', cardAssociation: 'ma_sardaukar', position: { x: 2, y: 0 }, isCenter: false },
  { id: 'metulli', name: 'House Metulli', cardAssociation: 'ma_guild_navigator', position: { x: 3, y: 0 }, isCenter: false },
  { id: 'wallach', name: 'House Wallach', cardAssociation: 'ma_bene_gesserit', position: { x: 4, y: 0 }, isCenter: false },
  { id: 'taligari', name: 'House Taligari', cardAssociation: 'ma_prescience', position: { x: 4, y: 1 }, isCenter: false },
  { id: 'kenric', name: 'House Kenric', cardAssociation: 'ma_great_worm', position: { x: 4, y: 2 }, isCenter: false },
  { id: 'hagal', name: 'House Hagal', cardAssociation: 'ma_spice_blow', position: { x: 4, y: 3 }, isCenter: false },
  { id: 'novebruns', name: 'House Novebruns', cardAssociation: 'ma_deathstill', position: { x: 4, y: 4 }, isCenter: false },
  { id: 'mutelli', name: 'House Mutelli', cardAssociation: 'ma_stilltent', position: { x: 3, y: 4 }, isCenter: false },
  { id: 'tuek', name: 'House Tuek', cardAssociation: 'ma_fremkit', position: { x: 2, y: 4 }, isCenter: false },
  { id: 'pemberton', name: 'House Pemberton', cardAssociation: 'ma_arrakeen', position: { x: 1, y: 4 }, isCenter: false },
  { id: 'vega', name: 'House Vega', cardAssociation: 'ma_fremen', position: { x: 0, y: 4 }, isCenter: false },
  { id: 'transport', name: 'House Transport', cardAssociation: 'ma_thumper', position: { x: 0, y: 3 }, isCenter: false },
  { id: 'ix', name: 'House Ix', cardAssociation: 'ma_golden_path', position: { x: 0, y: 2 }, isCenter: false },
  { id: 'tleilax', name: 'House Tleilax', cardAssociation: 'ma_summoner', position: { x: 0, y: 1 }, isCenter: false }
];

// Regent cards from each suit for house representation
export const REGENT_CARDS = [
  'coins_regent',
  'knives_regent', 
  'spice_regent',
  'water_regent'
];

export function getHouseByPosition(x: number, y: number): LandsraadHouse | undefined {
  return LANDSRAAD_HOUSES.find(house => house.position.x === x && house.position.y === y);
}

export function getCenterHouse(): LandsraadHouse {
  return LANDSRAAD_HOUSES.find(house => house.isCenter)!;
}

export function checkSysselraadLine(positions: { x: number; y: number }[]): boolean {
  if (positions.length < 5) return false;

  // Sort positions for easier checking
  const sorted = positions.sort((a, b) => a.x === b.x ? a.y - b.y : a.x - b.x);

  // Check horizontal lines
  for (let y = 0; y < 5; y++) {
    const horizontalLine = sorted.filter(p => p.y === y);
    if (horizontalLine.length >= 5) {
      // Check if they're consecutive
      const consecutive = horizontalLine.every((pos, idx) => 
        idx === 0 || pos.x === horizontalLine[idx - 1].x + 1
      );
      if (consecutive) return true;
    }
  }

  // Check vertical lines
  for (let x = 0; x < 5; x++) {
    const verticalLine = sorted.filter(p => p.x === x);
    if (verticalLine.length >= 5) {
      const consecutive = verticalLine.every((pos, idx) => 
        idx === 0 || pos.y === verticalLine[idx - 1].y + 1
      );
      if (consecutive) return true;
    }
  }

  // Check diagonal lines (top-left to bottom-right)
  for (let start = 0; start <= 0; start++) {
    const diagonal = [];
    for (let i = 0; i < 5; i++) {
      const pos = sorted.find(p => p.x === start + i && p.y === start + i);
      if (pos) diagonal.push(pos);
    }
    if (diagonal.length >= 5) return true;
  }

  // Check diagonal lines (top-right to bottom-left)  
  for (let start = 4; start >= 4; start--) {
    const diagonal = [];
    for (let i = 0; i < 5; i++) {
      const pos = sorted.find(p => p.x === start - i && p.y === i);
      if (pos) diagonal.push(pos);
    }
    if (diagonal.length >= 5) return true;
  }

  return false;
}
