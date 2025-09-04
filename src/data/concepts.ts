export interface ConceptOption {
  label: string;
  value: string;
  description: string;
}

export interface ConceptCategory {
  name: string;
  value: string;
  description: string;
  concepts: ConceptOption[];
}

export const CONCEPT_CATEGORIES: ConceptCategory[] = [
  {
    name: 'Official Dune Concepts',
    value: 'official',
    description: 'Official character concepts from Dune: Adventures in the Imperium',
    concepts: [
      { label: 'Agent', value: 'agent', description: 'Operative working for various factions and organizations' },
      { label: 'Bene Gesserit', value: 'bene_gesserit', description: 'Member of the powerful Sisterhood with mental and physical training' },
      { label: 'Courtier', value: 'courtier', description: 'Noble court member skilled in politics and intrigue' },
      { label: 'Duellist', value: 'duellist', description: 'Master of personal combat and blade work' },
      { label: 'Envoy', value: 'envoy', description: 'Diplomatic representative and negotiator' },
      { label: 'Face Dancer', value: 'face_dancer', description: 'Tleilaxu shapeshifter and infiltrator' },
      { label: 'Fremen', value: 'fremen', description: 'Desert warrior from the deep desert of Arrakis' },
      { label: 'Guild Agent', value: 'guild_agent', description: 'Representative of the Spacing Guild' },
      { label: 'Mentat', value: 'mentat', description: 'Human computer with extraordinary analytical abilities' },
      { label: 'Noble', value: 'noble', description: 'Member of a Great or Minor House with political power' },
      { label: 'Swordmaster', value: 'swordmaster', description: 'Elite warrior trained in advanced combat techniques' },
      { label: 'Trooper', value: 'trooper', description: 'Professional trooper serving various military forces' }
    ]
  }
];

// Helper function to get all concepts as a flat array
export function getAllConcepts(): ConceptOption[] {
  return CONCEPT_CATEGORIES.flatMap(category => category.concepts);
}

// Helper function to find a concept by value
export function findConceptByValue(value: string): ConceptOption | undefined {
  return getAllConcepts().find(concept => concept.value === value);
}

// Helper function to get concepts by category
export function getConceptsByCategory(categoryValue: string): ConceptOption[] {
  const category = CONCEPT_CATEGORIES.find(cat => cat.value === categoryValue);
  return category ? category.concepts : [];
}
