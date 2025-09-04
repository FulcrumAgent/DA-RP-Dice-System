/**
 * Enhanced structured logging for module system
 * Extends existing Winston logger with correlation support
 */

import { logger } from './logger';
import { getCorrelationId } from './correlation';

interface BaseLogContext {
  correlationId?: string;
  userId?: string;
  guildId?: string;
  channelId?: string;
  command?: string;
  moduleId?: string;
}

interface LogData extends BaseLogContext {
  [key: string]: unknown;
}

interface EnrichedLogData extends LogData {
  [key: string]: unknown;
}

/**
 * Enhanced logger with automatic correlation ID injection
 */
class ModuleLogger {
  /**
   * Log info level message with structured data
   */
  info(data: LogData, message: string): void {
    const logData = this.enrichLogData(data);
    logger.info(message, logData);
  }

  /**
   * Log warning level message with structured data
   */
  warn(data: LogData, message: string): void {
    const logData = this.enrichLogData(data);
    logger.warn(message, logData);
  }

  /**
   * Log error level message with structured data
   */
  error(data: LogData, message: string): void {
    const logData = this.enrichLogData(data);
    logger.error(message, logData);
  }

  /**
   * Log debug level message with structured data
   */
  debug(data: LogData, message: string): void {
    const logData = this.enrichLogData(data);
    logger.debug(message, logData);
  }

  /**
   * Enrich log data with correlation ID and timestamp
   */
  private enrichLogData(data: LogData): EnrichedLogData {
    const enriched: EnrichedLogData = {
      ...data,
      correlationId: data.correlationId || getCorrelationId(),
      timestamp: new Date().toISOString()
    };

    // Remove undefined values
    Object.keys(enriched).forEach(key => {
      if (enriched[key as keyof EnrichedLogData] === undefined) {
        delete enriched[key as keyof EnrichedLogData];
      }
    });

    return enriched;
  }

  /**
   * Log command start
   */
  commandStart(context: BaseLogContext): void {
    this.info({
      ...context,
      event: 'command_start'
    }, `Command ${context.command} started`);
  }

  /**
   * Log command success
   */
  commandSuccess(context: BaseLogContext, duration?: number): void {
    this.info({
      ...context,
      event: 'command_success',
      duration
    }, `Command ${context.command} completed successfully`);
  }

  /**
   * Log command error
   */
  commandError(context: BaseLogContext, error: Error, duration?: number): void {
    this.error({
      ...context,
      event: 'command_error',
      error: error.message,
      stack: error.stack,
      duration
    }, `Command ${context.command} failed: ${error.message}`);
  }

  /**
   * Log module operation
   */
  moduleOperation(operation: string, context: BaseLogContext): void {
    this.info({
      ...context,
      event: 'module_operation',
      operation
    }, `Module operation: ${operation}`);
  }
}

export const moduleLogger = new ModuleLogger();
