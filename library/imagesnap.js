"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Imagesnap = void 0;
const child_process_1 = require("child_process");
const tsee_1 = require("tsee");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const spawn_helper_1 = require("./spawn-helper");
class Imagesnap extends tsee_1.EventEmitter {
    /**
     * Instantiate the imagesnap backend (on macOS)
     */
    constructor() {
        super();
    }
    /**
     * Verify that all dependencies are installed
     */
    async init() {
        try {
            await spawn_helper_1.spawnHelper('which', ['imagesnap']);
        }
        catch (ex) {
            throw new Error('Missing "imagesnap" in PATH. Install via `brew install imagesnap`');
        }
    }
    /**
     * List all available cameras
     */
    async listDevices() {
        let devices = await spawn_helper_1.spawnHelper('imagesnap', ['-l']);
        let names = devices.split('\n').filter(l => l.startsWith('<') || l.startsWith('=>')).map(l => {
            // Big Sur
            if (l.startsWith('=>')) {
                return l.substr(3).trim();
            }
            // Catalina
            let name = l.split('[')[1];
            return name.substr(0, name.length - 1);
        });
        return names;
    }
    /**
     * Start the capture process
     * @param options Specify the camera, and the required interval between snapshots
     */
    async start(options) {
        if (this._captureProcess) {
            throw new Error('Capture was already started');
        }
        this._lastOptions = options;
        this._tempDir = await fs_1.default.promises.mkdtemp(path_1.default.join(os_1.default.tmpdir(), 'tinyboom-cli'));
        console.log(`Temporary files stored in ${this._tempDir}`);
        const devices = await this.listDevices();
        if (!devices.find(d => d === options.device)) {
            throw new Error('Invalid device ' + options.device);
        }
        this._captureProcess = child_process_1.spawn('imagesnap', [
            '-d', options.device,
            '-t', (options.intervalMs / 1000).toString()
        ], { env: process.env, cwd: this._tempDir });
        this._watcher = fs_1.default.watch(this._tempDir, async (eventType, fileName) => {
            if (eventType === 'rename' && fileName.endsWith('.jpg') && this._tempDir) {
                try {
                    let data = await fs_1.default.promises.readFile(path_1.default.join(this._tempDir, fileName));
                    this.emit('snapshot', data, path_1.default.basename(fileName));
                }
                catch (ex) {
                    console.error('Failed to load file', path_1.default.join(this._tempDir, fileName));
                }
            }
        });
        return new Promise((resolve, reject) => {
            if (this._captureProcess) {
                this._captureProcess.on('close', code => {
                    if (typeof code === 'number') {
                        reject('Capture process failed with code ' + code);
                    }
                    else {
                        reject('Failed to start capture process, but no exit code. ' +
                            'This might be a permissions issue. ' +
                            'Are you running this command from a simulated shell (like in Visual Studio Code)?');
                    }
                    this._captureProcess = undefined;
                });
            }
            // tslint:disable-next-line: no-floating-promises
            (async () => {
                if (!this._tempDir) {
                    throw new Error('tempDir is undefined');
                }
                const watcher = fs_1.default.watch(this._tempDir, () => {
                    resolve();
                    watcher.close();
                });
                setTimeout(() => {
                    return reject('First photo was not created within 10 seconds');
                }, 10000);
            })();
        });
    }
    async stop() {
        return new Promise((resolve) => {
            if (this._captureProcess) {
                this._captureProcess.on('close', code => {
                    if (this._watcher) {
                        this._watcher.close();
                    }
                    resolve();
                });
                this._captureProcess.kill('SIGINT');
                setTimeout(() => {
                    if (this._captureProcess) {
                        this._captureProcess.kill('SIGHUP');
                    }
                }, 500);
            } else {
                resolve();
            }
        });
    }
    getLastOptions() {
        return this._lastOptions;
    }
    async removeTemporaryFiles() {
        const tempFiles = await fs_1.default.promises.readdir(this._tempDir);
        let deleteCount = 0;
        for (let i = 0; i < tempFiles.length; i++) {
            const tempFile = tempFiles[i];
            const tempFullpath = path_1.default.join(this._tempDir, tempFile);
            try {
                await fs_1.default.promises.unlink(tempFullpath);
                deleteCount++;
            } catch (e) {
                console.error(`Failed to delete tempFile=${tempFile}`);
            }
        }
        console.log(`Deleted ${deleteCount} temporary file(s)`);
    }
}
exports.Imagesnap = Imagesnap;
//# sourceMappingURL=imagesnap.js.map