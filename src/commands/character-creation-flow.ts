/**
 * DEPRECATED: This file has been removed as part of the button interaction audit.
 * 
 * The character-creation-flow.ts contained 14 button interactions, of which 10 were
 * unhandled in bot.ts, making this system non-functional.
 * 
 * Use the modern character-creator.ts system instead, which is fully functional
 * and properly integrated with all button handlers.
 */

// This file is kept as a stub to prevent import errors during transition

// Stub exports to prevent import errors
export const CREATION_STEPS = {} as const;
export type CreationStep = string;
export const characterCreationSessions = new Map();
export const handleNavigationButton = (...args: any[]) => Promise.resolve();
export const buildNavigationButtons = (...args: any[]) => null;
export const showCreationPanel = (...args: any[]) => Promise.resolve();
