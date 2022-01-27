
const program = require('commander');
const inquirer = require('inquirer');
const request = require('superagent');
const path = require('path');
const fs = require('fs');

const packageVersion = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf-8')).version;

program
  .description('TinyBoom Linux client ' + packageVersion)
  .version(packageVersion)
  .option('--api-key <key>', 'API key to authenticate with TinyBoom (overrides current credentials)')
  // .option('--disable-camera', `Don't prompt for camera`)
  // .option('--disable-microphone', `Don't prompt for microphone`)
  .option('--width <px>', 'Desired width of the camera stream')
  .option('--height <px>', 'Desired height of the camera stream')
  // .option('--clean', 'Clear credentials')
  // .option('--silent', `Run in silent mode, don't prompt for credentials`)
  // .option('--dev', 'List development servers, alternatively you can use the EI_HOST environmental variable to specify the Edge Impulse instance.')
  .allowUnknownOption(true)
  .parse(process.argv);

const options = program.opts();
const apiKeyArgv = options.apiKey;
const widthArgv = options.width;
const heightArgv = options.height;

console.debug(`[TinyBoom CLI] apiKeyArgv`, apiKeyArgv);
console.debug(`[TinyBoom CLI] widthArgv`, widthArgv);
console.debug(`[TinyBoom CLI] heightArgv`, heightArgv);

(async () => {

})();