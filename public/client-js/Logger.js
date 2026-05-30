class Logger {
    static levels ={
        debug: 0,
        info: 1,
        warn: 2,
        error: 3
    }
    constructor(level = "debug") { // set debug as default
        this.currentLevel = level;
    }

    shouldLog(level) {
        return Logger.levels[level] >= Logger.levels[this.currentLevel];
    }

    debug(...args) {
        if(this.shouldLog("debug")) {
            console.log("[DEBUG]: ", ...args);
        }
    }

    info(...args) {
        if(this.shouldLog("info")) {
            console.log("[INFO]: ", ...args);
        }
    }

    warn(...args) {
        if(this.shouldLog("warn")) {
            console.log("[WARN]: ", ...args);
        }
    }

    error(...args) {
        if(this.shouldLog("error")) {
            console.log("[ERROR]: ", ...args);
        }
    }
}

// const env = process.env.NODE_ENV === 'production' ? 'warn' : 'debug';
// if we need to automatically detect environment, we can comment out above line and change below line's parameter to env.
export const logger = new Logger('debug'); // set the level we want the log come out.