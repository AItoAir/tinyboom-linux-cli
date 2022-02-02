
const program = require('commander');
const inquirer = require('inquirer');
const request = require('superagent');
const path = require('path');
const fs = require('fs');

const LinuxDevice = require('./models/LinuxDevice');
const RestApi = require('./library/rest-api');

const packageVersion = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf-8')).version;

program
  .description('TinyBoom Linux client ' + packageVersion)
  .version(packageVersion)
  .option('--project <key>', 'Project Code of the project you want to access')
  .option('--api-key <key>', 'API key to authenticate with TinyBoom')
  // .option('--disable-camera', `Don't prompt for camera`)
  // .option('--disable-microphone', `Don't prompt for microphone`)
  .option('--width <px>', 'Desired width of the camera stream', '416')
  .option('--height <px>', 'Desired height of the camera stream', '416')
  // .option('--clean', 'Clear credentials')
  // .option('--silent', `Run in silent mode, don't prompt for credentials`)
  // .option('--dev', 'List development servers, alternatively you can use the EI_HOST environmental variable to specify the Edge Impulse instance.')
  .allowUnknownOption(true)
  .parse(process.argv);

const options = program.opts();
const projectCodeArgv = options.project;
const apiKeyArgv = options.apiKey;
const widthArgv = options.width;
const heightArgv = options.height;
const dimensions = {
  height: +heightArgv,
  width: +widthArgv
}

if (!projectCodeArgv) {
  console.error(`Error: --project must be specified`);
  process.exit(1);
}
if (!apiKeyArgv) {
  console.error(`Error: --api-key must be specified`);
  process.exit(1);
}

const noCamera = false;
const isProphesee = false;
let camera;
let configFactory;

console.debug(`[TinyBoom CLI] packageVersion`, packageVersion);
console.debug(`[TinyBoom CLI] platform`, process.platform);
console.debug(`[TinyBoom CLI] projectCodeArgv`, projectCodeArgv);
console.debug(`[TinyBoom CLI] apiKeyArgv`, apiKeyArgv);
console.debug(`[TinyBoom CLI] widthArgv`, widthArgv);
console.debug(`[TinyBoom CLI] heightArgv`, heightArgv);

(async () => {
  // if (!noCamera) {
  //     if (isProphesee) {
  //         camera = new prophesee_1.Prophesee(verboseArgv);
  //     }
  //     else if (process.platform === 'darwin') {
  //         camera = new imagesnap_1.Imagesnap();
  //     }
  //     else if (process.platform === 'linux') {
  //         camera = new gstreamer_1.GStreamer(verboseArgv);
  //     }
  //     else {
  //         throw new Error('Unsupported platform: "' + process.platform + '"');
  //     }
  //     await camera.init();
  // }
  
  const linuxDevice = new LinuxDevice(null, {}, {});

  const deviceId = await linuxDevice.getDeviceId();
  console.debug(`[TinyBoom CLI] deviceId`, deviceId);
  const deviceType = await linuxDevice.getDeviceType();
  console.debug(`[TinyBoom CLI] deviceType`, deviceType);

  const project = await RestApi.getProjectInfo(projectCodeArgv, apiKeyArgv, deviceId, deviceType);
  if (!project) {
    console.error('Error: Invalid Project');
    process.exit(1);
  }
  console.debug(`[TinyBoom CLI] project`, project.name);
})();