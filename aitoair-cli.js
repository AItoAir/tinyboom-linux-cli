
const program = require('commander');
const inquirer = require('inquirer');
const request = require('superagent');
const path = require('path');
const fs = require('fs');

const LinuxDevice = require('./models/LinuxDevice');

const packageVersion = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf-8')).version;

program
  .description('TinyBoom Linux client ' + packageVersion)
  .version(packageVersion)
  .option('--api-key <key>', 'API key to authenticate with TinyBoom (overrides current credentials)')
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
const apiKeyArgv = options.apiKey;
const widthArgv = options.width;
const heightArgv = options.height;
const dimensions = {
  height: +heightArgv,
  width: +widthArgv
}

console.debug(`[TinyBoom CLI] process.platform`, process.platform);
console.debug(`[TinyBoom CLI] apiKeyArgv`, apiKeyArgv);
console.debug(`[TinyBoom CLI] widthArgv`, widthArgv);
console.debug(`[TinyBoom CLI] heightArgv`, heightArgv);

const linuxDevice = new LinuxDevice();

(async () => {
  const deviceId = await linuxDevice.getDeviceId();
  console.debug(`[TinyBoom CLI] deviceId`, deviceId);
  const deviceType = await linuxDevice.getDeviceType();
  console.debug(`[TinyBoom CLI] deviceType`, deviceType);
})();