const prefix = sender => `${sender ? `[${sender}]` : ''}`;

class Logger {
    info(message, sender) {
        this._log(`[INFO] ${message}`, sender);
    }

    warn(message, sender) {
        this._log(`[WARN] ${message}`, sender);
    }

    error(error, sender) {
        const errorMessage = error instanceof Error ? `${error.stack}` : error;
        this._log(`[ERROR] ${errorMessage}`, sender);
    }

    debug(message, sender) {
        if (process.env.DEBUG) {
            this._log(`[DEBUG] ${message}`, sender);
        }
    }

    _log(message, sender) {
        console.log(`${prefix(sender)} ${message}`);
    }
}

module.exports = new Logger();
