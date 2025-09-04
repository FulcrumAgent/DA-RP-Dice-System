/**
 * Correlation ID utilities for request tracing
 */

import { randomUUID } from 'crypto';
import { CommandInteraction, ContextMenuCommandInteraction } from 'discord.js';

// Thread-local storage for correlation context
const correlationStore = new Map<string, string>();

/**
 * Generate a new correlation ID
 */
export function generateCorrelationId(): string {
  return randomUUID();
}

/**
 * Set correlation ID for current context
 */
export function setCorrelationId(correlationId: string): void {
  correlationStore.set('current', correlationId);
}

/**
 * Get current correlation ID
 */
export function getCorrelationId(): string | undefined {
  return correlationStore.get('current');
}

/**
 * Clear correlation context
 */
export function clearCorrelationId(): void {
  correlationStore.delete('current');
}

/**
 * Wrap a command handler with correlation ID management
 */
export function withCorrelation<T extends CommandInteraction | ContextMenuCommandInteraction>(
  handler: (interaction: T, correlationId: string) => Promise<void>
): (interaction: T) => Promise<void> {
  return async (interaction: T): Promise<void> => {
    const correlationId = generateCorrelationId();
    setCorrelationId(correlationId);
    
    try {
      await handler(interaction, correlationId);
    } finally {
      clearCorrelationId();
    }
  };
}

/**
 * Extract base context from Discord interaction
 */
export function extractInteractionContext(interaction: CommandInteraction | ContextMenuCommandInteraction) {
  return {
    userId: interaction.user.id,
    guildId: interaction.guildId || 'DM',
    channelId: interaction.channelId,
    commandName: interaction.commandName,
    correlationId: getCorrelationId() || generateCorrelationId()
  };
}
