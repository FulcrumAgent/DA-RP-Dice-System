/**
 * Official Dune: Adventures in the Imperium Drives
 * Section 4 Compliant - Canonical drives only
 */
export const DUNE_DRIVES = [
  { 
    id: 'duty', 
    name: 'Duty', 
    description: 'Loyalty to House or cause above all else' 
  },
  { 
    id: 'faith', 
    name: 'Faith', 
    description: 'Trust in religion, tradition, or a higher power' 
  },
  { 
    id: 'justice', 
    name: 'Justice', 
    description: 'Belief in fairness, law, and moral order' 
  },
  { 
    id: 'power', 
    name: 'Power', 
    description: 'Ambition, influence, and the will to rule or control' 
  },
  { 
    id: 'truth', 
    name: 'Truth', 
    description: 'Pursuit of knowledge, honesty, and understanding' 
  }
];

/**
 * Official drive point-buy values (30 points total)
 * Must be assigned as: 8, 7, 6, 5, 4 (one per drive)
 */
export const DRIVE_POINT_VALUES = [8, 7, 6, 5, 4] as const;

/**
 * Get drive by ID
 */
export function getDriveById(id: string) {
  return DUNE_DRIVES.find(drive => drive.id === id);
}

/**
 * Get drive by name
 */
export function getDriveByName(name: string) {
  return DUNE_DRIVES.find(drive => drive.name === name);
}
