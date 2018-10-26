const shell = require('shelljs');

const logger = require('./logger');

const logSender = 'Shell';

class Shell {
    static execute({ command, cwd, env, silent = false, stderr = false, errorMessage }) {
        const options = { silent: true };
        if (cwd) { options.cwd = cwd; }
        if (env) { options.env = cwd; }

        if (shell.exec('git --version', options).code !== 0) {
            throw new Error('git 명령어가 설치되어 있지 않습니다. 설치 후 다시 진행하세요.');
        }

        if (shell.exec('git status', options).code !== 0) {
            throw new Error('보안상 git 디렉터리가 아닌 곳에서는 명령어를 실행할 수 없습니다.');
        }

        let result = null;
        result = shell.exec(command, options);

        if (shell.error()) {
            if (errorMessage) {
                throw new Error(errorMessage);
            }
            throw new Error(result.stderr);
        }

        if (!silent) {
            logger.info(`"${command}" => ${result.stdout}`, logSender);
            // 특정 명령어는 정상메세지도 표준에러로 출력하는 경우가 있다. (wget github)
            if (stderr) {
                logger.info(`"${command}" => ${result.stderr}`, logSender);
            }
        }
    }
}

module.exports = Shell;
