/**
 * Logger utility with configurable log levels
 * Reduces verbose logging in production while maintaining observability
 */

export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    ERROR = 2
}

class Logger {
    private level: LogLevel;
    
    constructor() {
        // Detect environment
        const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';
        
        // Allow override via environment variable
        const envLevel = import.meta.env.VITE_LOG_LEVEL;
        if (envLevel) {
            this.level = LogLevel[envLevel as keyof typeof LogLevel] ?? (isDev ? LogLevel.DEBUG : LogLevel.INFO);
        } else {
            this.level = isDev ? LogLevel.DEBUG : LogLevel.INFO;
        }
    }
    
    /**
     * Debug level logging - only shown in development
     * Use for verbose information like WebSocket events, user lists, etc.
     */
    debug(...args: any[]) {
        if (this.level <= LogLevel.DEBUG) {
            console.log(...args);
        }
    }
    
    /**
     * Info level logging - shown in development and production
     * Use for important events like connections, disconnections, etc.
     */
    info(...args: any[]) {
        if (this.level <= LogLevel.INFO) {
            console.log(...args);
        }
    }
    
    /**
     * Error level logging - always shown
     * Use for errors and critical issues
     */
    error(...args: any[]) {
        console.error(...args);
    }
    
    /**
     * Set log level programmatically
     */
    setLevel(level: LogLevel) {
        this.level = level;
    }
    
    /**
     * Get current log level
     */
    getLevel(): LogLevel {
        return this.level;
    }
}

// Export singleton instance
export const logger = new Logger();

// Export for testing
export { Logger };
