
const program = require('commander');
const inquirer = require('inquirer');
const request = require('superagent');
const path = require('path');
const fs = require('fs');

const LinuxDevice = require('./models/LinuxDevice');
const RestApi = require('./library/rest-api');
const SocketService = require('./library/socket-service');
const imagesnap = require('./library/imagesnap');
const gstreamer = require('./library/gstreamer');

const packageVersion = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf-8')).version;
const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));
const WEBSOCKET_SEND_INTERVAL = 200;

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
  // .option('--dev', 'List development servers.')
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
const verboseMode = false;
let camera;
let device;

console.debug(`[TinyBoom CLI] packageVersion`, packageVersion);
console.debug(`[TinyBoom CLI] platform`, process.platform);
console.debug(`[TinyBoom CLI] projectCodeArgv`, projectCodeArgv);
console.debug(`[TinyBoom CLI] apiKeyArgv`, apiKeyArgv);
console.debug(`[TinyBoom CLI] widthArgv`, widthArgv);
console.debug(`[TinyBoom CLI] heightArgv`, heightArgv);

(async () => {
  if (!noCamera) {
    // if (isProphesee) {
    //     camera = new prophesee_1.Prophesee(verboseArgv);
    // }
    // else 
    if (process.platform === 'darwin') {
      camera = new imagesnap.Imagesnap();
    } else if (process.platform === 'linux') {
      camera = new gstreamer.GStreamer(verboseMode);
    }
    else {
      throw new Error('Unsupported platform: "' + process.platform + '"');
    }
    await camera.init();
  }
  
  const linuxDevice = new LinuxDevice(camera, dimensions.height);
  let firstExit = true;
  const onSignal = async () => {
    if (!firstExit) {
      process.exit(1);
    } else {
      console.log('Received stop signal, stopping application... ' +
      'Press CTRL+C again to force quit.');
      firstExit = false;
      try {
        if (camera) {
          await camera.stop();
          await camera.removeTemporaryFiles();
        }
        if (device) {
          await RestApi.setDeviceInactive(projectCodeArgv, apiKeyArgv, device.id);
        }
        SocketService.disconnect();
        process.exit(0);
      } catch (ex2) {
        let ex = ex2;
        console.log('Failed to stop inferencing', ex.message);
      }
      if (device) {
        await RestApi.setDeviceInactive(projectCodeArgv, apiKeyArgv, device.id);
      }
      SocketService.disconnect();
      process.exit(1);
    }
  };
  process.on('SIGHUP', onSignal);
  process.on('SIGINT', onSignal);
  const deviceId = await linuxDevice.getDeviceId();
  console.debug(`[TinyBoom CLI] deviceId`, deviceId);
  const deviceType = await linuxDevice.getDeviceType();
  console.debug(`[TinyBoom CLI] deviceType`, deviceType);

  linuxDevice.on('snapshot', async (buffer, filename) => {
    if (linuxDevice.isSnapshotStreaming()) {
      const frame = buffer.toString('base64');
      const data = {
        frame,
        filename
      };
      const message = JSON.stringify(data);
      await SocketService.sendMessage(project.id, deviceId, message);
    }
  });
  
  SocketService.setup(apiKeyArgv);
  SocketService.on(`capture-${deviceId}`, async (data) => {
    const { action, filename, type, userId, teamId } = data;
    if (device && action === 'capture-edgedevice-image') {
      const snapshotFullPath = camera.getSnapshotPath(filename);
      const { image } = await RestApi.uploadImage(projectCodeArgv, apiKeyArgv, device.id, userId, teamId, snapshotFullPath, type);
      console.log(`SocketService.on('capture-${deviceId}') action=${action} uploaded image=${image}`);
    } else {
      console.log(`SocketService.on('capture-${deviceId}') action=${action} ignored`);
    }
  });
  
  const info = await RestApi.getProjectInfo(projectCodeArgv, apiKeyArgv, deviceId, deviceType);
  const project = info.project;
  if (!project) {
    console.error('Error: Invalid Project');
    process.exit(1);
  }
  device = info.device;
  if (!device) {
    console.error('Error: Invalid Device');
    process.exit(1);
  }
  console.debug(`[TinyBoom CLI] project`, project.name);
  if (camera) {
    let cameraDevice;
    const cameraDevices = await camera.listDevices();
    if (cameraDevices.length === 0) {
      throw new Error('Cannot find any webcams, run this command with --disable-camera to skip selection');
    } else if (cameraDevices.length === 1) {
      cameraDevice = cameraDevices[0];
    } else {
      let inqRes = await inquirer.prompt([{
        type: 'list',
        choices: (cameraDevices || []).map(p => ({ name: p, value: p })),
        name: 'camera',
        message: 'Select a camera (or run this command with --disable-camera to skip selection)',
        pageSize: 20
      }]);
      cameraDevice = inqRes.camera;
    }
    console.log('Using camera', cameraDevice, 'starting...');
    if (isProphesee) {
      await camera.start({
        device: cameraDevice,
        intervalMs: WEBSOCKET_SEND_INTERVAL,
        dimensions: dimensions
      });
    } else {
      await camera.start({
        device: cameraDevice,
        intervalMs: WEBSOCKET_SEND_INTERVAL,
        dimensions: dimensions
      });
    }
    camera.on('error', error => {
      console.log('camera error', error);
    });
    console.log('Connected to camera');
    await snooze(2000);
    await linuxDevice.startSnapshotStreaming();
  }
})();