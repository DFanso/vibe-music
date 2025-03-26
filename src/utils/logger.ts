import winston from 'winston';
import chalk from 'chalk';

// Define custom colors for the console logger
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'cyan',
};

// Add colors to Winston
winston.addColors(colors);

// Define the format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `[${info.timestamp}] ${info.level}: ${info.message}`
  )
);

// Create a Winston logger instance
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  },
  format,
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new winston.transports.File({ filename: 'logs/all.log' }),
  ],
});

// Create utility methods that combine winston and chalk for additional styling
export const log = {
  // Standard winston levels
  error: (message: string) => logger.error(message),
  warn: (message: string) => logger.warn(message),
  info: (message: string) => logger.info(message),
  http: (message: string) => logger.http(message),
  debug: (message: string) => logger.debug(message),

  // Helper methods for special formatting
  success: (message: string) => logger.info(`✅ ${message}`),
  ready: (message: string) => logger.info(`🚀 ${message}`),
  separator: () => logger.info('='.repeat(40)),
  
  // Bot specific formatted messages
  botInfo: (tag: string | undefined, id: string | undefined, guilds: number) => {
    log.separator();
    log.ready(`Bot is now online as: ${tag}`);
    log.info(`Bot ID: ${id}`);
    log.info(`Serving ${guilds} guild(s)`);
    log.separator();
  }
};

export default log; 