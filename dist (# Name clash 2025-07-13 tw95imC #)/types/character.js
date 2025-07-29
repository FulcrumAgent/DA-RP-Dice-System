"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CREATION_STEPS = void 0;
exports.isCreationStep = isCreationStep;
exports.CREATION_STEPS = {
    NAME: 'NAME',
    CONCEPT: 'CONCEPT',
    ARCHETYPE: 'ARCHETYPE',
    SKILLS: 'SKILLS',
    FOCUSES: 'FOCUSES',
    DRIVES: 'DRIVES',
    DRIVE_STATEMENTS: 'DRIVE_STATEMENTS',
    TALENTS: 'TALENTS',
    ASSETS: 'ASSETS',
    TRAITS: 'TRAITS',
    STARTING_POOLS: 'STARTING_POOLS',
    SUMMARY: 'SUMMARY',
    FINALIZE: 'FINALIZE'
};
function isCreationStep(step) {
    return step in exports.CREATION_STEPS;
}
