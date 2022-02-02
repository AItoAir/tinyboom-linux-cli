"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupCliApp = exports.initCliApp = exports.getCliVersion = void 0;
// const config_1 = require("./config");
// const check_new_version_1 = __importDefault(require("./check-new-version"));
const fs = __importDefault(require("fs"));
const path = __importDefault(require("path"));
const inquirer = __importDefault(require("inquirer"));
const version = JSON.parse(fs.default.readFileSync(path.default.join(__dirname, '..', '..', 'package.json'), 'utf-8')).version;
function getCliVersion() {
    return version;
}
exports.getCliVersion = getCliVersion;
async function initCliApp(opts) {
    if (!opts.silentArgv) {
        console.log(opts.appName + ' v' + version);
    }
    const configFactory = new config_1.Config();
    let config;
    try {
        if (opts.cleanArgv || opts.apiKeyArgv) {
            await configFactory.clean();
        }
        try {
            await check_new_version_1.default(configFactory);
        }
        catch (ex) {
            /* noop */
        }
        // this verifies host settings and verifies the JWT token
        try {
            config = await configFactory.verifyLogin(opts.devArgv, opts.apiKeyArgv);
        }
        catch (ex) {
            console.log('Stored token seems invalid, clearing cache...');
            await configFactory.clean();
            config = await configFactory.verifyLogin(opts.devArgv, opts.apiKeyArgv);
        }
    }
    catch (ex2) {
        let ex = ex2;
        if (ex.statusCode) {
            console.error('Failed to authenticate with Edge Impulse', ex.statusCode, ex.response.body);
        }
        else {
            console.error('Failed to authenticate with Edge Impulse', ex.message || ex.toString());
        }
        process.exit(1);
    }
    return {
        configFactory,
        config
    };
}
exports.initCliApp = initCliApp;
async function setupCliApp(configFactory, config, opts, deviceId) {
    let projectId = await configFactory.getUploaderProjectId();
    if (projectId) {
        let projectInfoReq = (await config.api.projects.getProjectInfo(projectId));
        if (projectInfoReq.body.success && projectInfoReq.body.project) {
            if (!opts.silentArgv) {
                console.log('    Project:    ', projectInfoReq.body.project.name + ' (ID: ' + projectId + ')');
                console.log('');
            }
        }
        else {
            console.warn('Cannot read cached project (' + projectInfoReq.body.error + ')');
            projectId = undefined;
        }
    }
    if (!projectId) {
        if (!opts.silentArgv) {
            console.log('');
        }
        let fromConfig = opts.getProjectFromConfig ?
            await opts.getProjectFromConfig(deviceId) :
            undefined;
        let projectList = (await config.api.projects.listProjects()).body;
        if (!projectList.success) {
            console.error('Failed to retrieve project list...', projectList, projectList.error);
            process.exit(1);
        }
        if (!projectList.projects || projectList.projects.length === 0) {
            console.log('This user has no projects, create one before continuing');
            process.exit(1);
        }
        else if (fromConfig) {
            projectId = fromConfig.projectId;
        }
        else if (projectList.projects && projectList.projects.length === 1) {
            projectId = projectList.projects[0].id;
        }
        else {
            let inqRes = await inquirer_1.default.prompt([{
                    type: 'list',
                    choices: (projectList.projects || []).map(p => ({ name: p.owner + ' / ' + p.name, value: p.id })),
                    name: 'project',
                    message: opts.connectProjectMsg,
                    pageSize: 20
                }]);
            projectId = Number(inqRes.project);
        }
    }
    let devKeys = {
        apiKey: opts.apiKeyArgv || '',
        hmacKey: opts.hmacKeyArgv || '0'
    };
    if (!opts.apiKeyArgv) {
        try {
            let dk = (await config.api.projects.listDevkeys(projectId)).body;
            if (!dk.apiKey) {
                throw new Error('No API key set (via --api-key), and no development API keys configured for ' +
                    'this project. Add a development API key from the Edge Impulse dashboard to continue.');
            }
            devKeys.apiKey = dk.apiKey;
            if (!opts.hmacKeyArgv && dk.hmacKey) {
                devKeys.hmacKey = dk.hmacKey;
            }
        }
        catch (ex2) {
            let ex = ex2;
            throw new Error('Failed to load development keys: ' + (ex.message || ex.toString()));
        }
    }
    return {
        projectId,
        devKeys
    };
}
exports.setupCliApp = setupCliApp;