export interface Skill {
  id: string;
  name: string;
  description: string;
  value?: number;
}

// Core skills for Dune: Adventures in the Imperium
export const SKILLS: Skill[] = [
  {
    id: 'battle',
    name: 'Battle',
    description: 'Combat, tactics, and warfare. Used for all forms of armed and unarmed combat, as well as military strategy.'
  },
  {
    id: 'communicate',
    name: 'Communicate',
    description: 'Social interaction, persuasion, and deception. Used for all forms of verbal and non-verbal communication.'
  },
  {
    id: 'discipline',
    name: 'Discipline',
    description: 'Mental and physical self-control. Used to resist mental influence, endure hardship, and maintain focus.'
  },
  {
    id: 'move',
    name: 'Move',
    description: 'Physical movement and coordination. Used for athletics, piloting vehicles, and navigating terrain.'
  },
  {
    id: 'understand',
    name: 'Understand',
    description: 'Knowledge, perception, and analysis. Used for investigation, research, and understanding complex systems.'
  }
];

// Skill values to be assigned (9, 7, 6, 5, 4)
export const SKILL_VALUES = [9, 7, 6, 5, 4];

export interface SkillsState {
  remainingSkills: string[];
  remainingValues: number[];
  assignedSkills: {[key: string]: number};
  currentFocus?: string;
}

export function getInitialSkillsState(): SkillsState {
  return {
    remainingSkills: SKILLS.map(skill => skill.name),
    remainingValues: [...SKILL_VALUES],
    assignedSkills: {},
    currentFocus: undefined
  };
}
