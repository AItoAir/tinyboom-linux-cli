"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.spawnHelper = void 0;
const child_process_1 = require("child_process");
function spawnHelper(command, args, opts = { ignoreErrors: false }) {
  return new Promise((resolve, reject) => {
    const p = child_process_1.spawn(command, args, { env: process.env, cwd: opts.cwd });
    let allData = [];
    p.stdout.on('data', (data) => {
      allData.push(data);
    });
    p.stderr.on('data', (data) => {
      allData.push(data);
    });
    p.on('error', reject);
    p.on('close', (code) => {
      if (code === 0 || opts.ignoreErrors === true) {
        resolve(Buffer.concat(allData).toString('utf-8'));
      }
      else {
        reject('Error code was not 0: ' + Buffer.concat(allData).toString('utf-8'));
      }
    });
  });
}
exports.spawnHelper = spawnHelper;