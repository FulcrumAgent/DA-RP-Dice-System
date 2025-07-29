"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONCEPT_CATEGORIES = void 0;
exports.getAllConcepts = getAllConcepts;
exports.findConceptByValue = findConceptByValue;
exports.getConceptsByCategory = getConceptsByCategory;
exports.CONCEPT_CATEGORIES = [
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
function getAllConcepts() {
    return exports.CONCEPT_CATEGORIES.flatMap(category => category.concepts);
}
function findConceptByValue(value) {
    return getAllConcepts().find(concept => concept.value === value);
}
function getConceptsByCategory(categoryValue) {
    const category = exports.CONCEPT_CATEGORIES.find(cat => cat.value === categoryValue);
    return category ? category.concepts : [];
}
