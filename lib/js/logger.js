const moment = require('moment-timezone');
const chalk = require('chalk');

moment.tz.setDefault('Asia/Seoul');

const now = () => moment().format('YYYY-MM-DD HH:mm:ss');
const prefix = sender => `[${now()}]${sender ? `[${sender}]` : ''}`;
const { red, green, yellow, blue } = chalk.bold;

class Logger {
    info(message, sender) {
        this._log(`${message}`, sender, green);
    }

    warn(message, sender) {
        this._log(`${message}`, sender, yellow);
    }

    error(error, sender) {
        const errorMessage = error instanceof Error ? `${error.stack}` : error;
        this._log(errorMessage, sender, red);
    }

    debug(message, sender) {
        if (process.env.DEBUG) {
            this._log(`${message}`, sender, blue);
        }
    }

    _log(message, sender, color = msg => msg) {
        console.log(color(`${prefix(sender)} ${message}`));
    }
}

module.exports = new Logger();
