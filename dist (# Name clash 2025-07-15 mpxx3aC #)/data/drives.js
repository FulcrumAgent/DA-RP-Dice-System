"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DRIVE_POINT_VALUES = exports.DUNE_DRIVES = void 0;
exports.getDriveById = getDriveById;
exports.getDriveByName = getDriveByName;
exports.DUNE_DRIVES = [
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
exports.DRIVE_POINT_VALUES = [8, 7, 6, 5, 4];
function getDriveById(id) {
    return exports.DUNE_DRIVES.find(drive => drive.id === id);
}
function getDriveByName(name) {
    return exports.DUNE_DRIVES.find(drive => drive.name === name);
}
