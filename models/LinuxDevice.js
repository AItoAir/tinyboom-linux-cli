const tsee = require("tsee");
const asyncMutex = require("async-mutex");

const get_ips_1 = require("../library/get-ips");

const SERIAL_PREFIX = '\x1b[33m[SER]\x1b[0m';
const noMicrophone = true;

class LinuxDevice extends tsee.EventEmitter {
  constructor(cameraInstance, config, devKeys) {
      super();
      this._snapshotStreaming = false;
      this._lastSnapshot = new Date(0);
      this._snapshotMutex = new asyncMutex.Mutex();
      this._snapshotId = 0;
      this._camera = cameraInstance;
      this._config = config;
      this._devKeys = devKeys;
      if (this._camera) {
          this._camera.on('snapshot', async (buffer, filename) => {
              const id = ++this._snapshotId;
              const release = await this._snapshotMutex.acquire();
              // limit to 10 frames a second & no new frames should have come in...
              try {
                  if (this._snapshotStreaming &&
                      Date.now() - +this._lastSnapshot >= 100 &&
                      id === this._snapshotId) {
                      const jpg = sharp_1.default(buffer);
                      const resized = await jpg.resize(undefined, 96).jpeg().toBuffer();
                      this.emit('snapshot', resized, filename);
                      this._lastSnapshot = new Date();
                  }
              }
              catch (ex) {
                  console.warn('Failed to handle snapshot', ex);
              }
              finally {
                  release();
              }
          });
      }
  }
  connected() {
      return true;
  }
  async getDeviceId() {
      return get_ips_1.ips.length > 0 ? get_ips_1.ips[0].mac : '00:00:00:00:00:00';
  }
  getDeviceType() {
      let id = (get_ips_1.ips.length > 0 ? get_ips_1.ips[0].mac : '00:00:00:00:00:00').toLowerCase();
      if (id.startsWith('dc:a6:32') || id.startsWith('b8:27:eb')) {
          return 'RASPBERRY_PI';
      }
      if (id.startsWith('00:04:4b') || id.startsWith('48:b0:2d')) {
          return 'NVIDIA_JETSON_NANO';
      }
      return 'UNKNOWN_LINUX';
  }
  getSensors() {
      let sensors = [];
      if (!noMicrophone) {
          sensors.push({
              name: 'Microphone',
              frequencies: [16000],
              maxSampleLengthS: 3600
          });
      }
      if (camera) {
          let str = dimensions ? `(${dimensions.width}x${dimensions.height})` : `640x480`;
          sensors.push({
              name: `Camera (${str})`,
              frequencies: [],
              maxSampleLengthS: 60000
          });
          if (isProphesee) {
              sensors.push({
                  name: 'Video (1280x720)',
                  frequencies: [],
                  maxSampleLengthS: 60000
              });
          }
      }
      return sensors;
  }
  supportsSnapshotStreaming() {
      return true;
  }
  supportsSnapshotStreamingWhileCapturing() {
      return true;
  }
  beforeConnect() {
      return Promise.resolve();
  }
  async startSnapshotStreaming() {
      this._snapshotStreaming = true;
  }
  async stopSnapshotStreaming() {
      this._snapshotStreaming = false;
  }
  async sampleRequest(data, ee) {
      var _a, _b;
      if ((_a = data.sensor) === null || _a === void 0 ? void 0 : _a.startsWith('Camera')) {
          if (!this._camera) {
              throw new Error('Linux daemon was started with --no-camera');
          }
          ee.emit('started');
          let jpg = await new Promise((resolve, reject) => {
              if (!this._camera) {
                  return reject('No camera');
              }
              setTimeout(() => {
                  reject('Timeout');
              }, 3000);
              this._camera.once('snapshot', buffer => {
                  resolve(buffer);
              });
          });
          let img = make_image_1.makeImage(jpg, this._devKeys.hmacKey, data.label + '.jpg');
          console.log(SERIAL_PREFIX, 'Uploading sample to', this._config.endpoints.internal.ingestion + data.path + '...');
          ee.emit('uploading');
          await make_image_1.upload({
              apiKey: this._devKeys.apiKey,
              filename: data.label + '.jpg',
              processed: img,
              allowDuplicates: false,
              category: data.path.indexOf('/training') > -1 ? 'training' : 'testing',
              config: this._config,
              dataBuffer: jpg,
              label: data.label,
              boundingBoxes: undefined
          });
          console.log(SERIAL_PREFIX, 'Sampling finished');
      }
      else if ((_b = data.sensor) === null || _b === void 0 ? void 0 : _b.startsWith('Video')) {
          if (!this._camera) {
              throw new Error('Linux daemon was started with --no-camera');
          }
          console.log(SERIAL_PREFIX, 'Waiting 2 seconds');
          await new Promise((resolve) => setTimeout(resolve, 2000));
          ee.emit('started');
          // give some time to emit...
          await await new Promise((resolve) => setTimeout(resolve, 10));
          let video = new video_recorder_1.VideoRecorder(this._camera, verboseArgv);
          let videoEe = await video.record(data.length);
          videoEe.on('processing', () => ee.emit('processing'));
          let mp4 = await new Promise((resolve, reject) => {
              if (!this._camera) {
                  return reject('No camera');
              }
              videoEe.on('error', err => {
                  reject(err);
              });
              videoEe.on('done', buffer => {
                  resolve(buffer);
              });
          });
          let img = make_image_1.makeVideo(mp4, this._devKeys.hmacKey, data.label + '.mp4');
          console.log(SERIAL_PREFIX, 'Uploading sample to', this._config.endpoints.internal.ingestion + data.path + '...');
          ee.emit('uploading');
          await make_image_1.upload({
              apiKey: this._devKeys.apiKey,
              filename: data.label + '.mp4',
              processed: img,
              allowDuplicates: false,
              category: data.path.indexOf('/training') > -1 ? 'training' : 'testing',
              config: this._config,
              dataBuffer: mp4,
              label: data.label,
              boundingBoxes: undefined
          });
          console.log(SERIAL_PREFIX, 'Sampling finished');
      }
      else if (data.sensor === 'Microphone') {
          if (noMicrophone) {
              throw new Error('Linux daemon was started with --no-microphone');
          }
          let now = Date.now();
          const recorder = new recorder_1.AudioRecorder({
              sampleRate: Math.round(1000 / data.interval),
              channels: 1,
              asRaw: true,
              verbose: verboseArgv,
          });
          console.log(SERIAL_PREFIX, 'Waiting 2 seconds');
          const audio = await recorder.start(await configFactory.getAudio() || '');
          // sleep 2 seconds before starting...
          await new Promise((resolve) => {
              let time = 2000 - (Date.now() - now);
              if (time > 0) {
                  setTimeout(resolve, time);
              }
              else {
                  resolve();
              }
          });
          console.log(SERIAL_PREFIX, 'Recording audio...');
          ee.emit('started');
          const audioBuffer = await new Promise((resolve) => {
              let audioBuffers = [];
              let totalAudioLength = 0;
              let bytesNeeded = (Math.round(1000 / data.interval) * (data.length / 1000)) * 2;
              const onData = (b) => {
                  audioBuffers.push(b);
                  totalAudioLength += b.length;
                  if (totalAudioLength > bytesNeeded) {
                      resolve(Buffer.concat(audioBuffers).slice(0, bytesNeeded));
                      audio.ee.off('data', onData);
                  }
              };
              audio.ee.on('data', onData);
          });
          await audio.stop();
          ee.emit('processing');
          let wavFile = this.buildWavFileBuffer(audioBuffer, data.interval);
          let wav = make_image_1.makeWav(wavFile, this._devKeys.hmacKey);
          console.log(SERIAL_PREFIX, 'Uploading sample to', this._config.endpoints.internal.ingestion + data.path + '...');
          ee.emit('uploading');
          await make_image_1.upload({
              apiKey: this._devKeys.apiKey,
              filename: data.label + '.wav',
              processed: wav,
              allowDuplicates: false,
              category: data.path.indexOf('/training') > -1 ? 'training' : 'testing',
              config: this._config,
              dataBuffer: audioBuffer,
              label: data.label,
              boundingBoxes: undefined,
          });
          console.log(SERIAL_PREFIX, 'Sampling finished');
      }
      else {
          throw new Error('Invalid sensor: ' + data.sensor);
      }
  }
  buildWavFileBuffer(data, intervalMs) {
      // let's build a WAV file!
      let wavFreq = 1 / intervalMs * 1000;
      let fileSize = 44 + (data.length);
      let dataSize = (data.length);
      let srBpsC8 = (wavFreq * 16 * 1) / 8;
      let headerArr = new Uint8Array(44);
      let h = [
          0x52, 0x49, 0x46, 0x46,
          // tslint:disable-next-line: no-bitwise
          fileSize & 0xff, (fileSize >> 8) & 0xff, (fileSize >> 16) & 0xff, (fileSize >> 24) & 0xff,
          0x57, 0x41, 0x56, 0x45,
          0x66, 0x6d, 0x74, 0x20,
          0x10, 0x00, 0x00, 0x00,
          0x01, 0x00,
          0x01, 0x00,
          // tslint:disable-next-line: no-bitwise
          wavFreq & 0xff, (wavFreq >> 8) & 0xff, (wavFreq >> 16) & 0xff, (wavFreq >> 24) & 0xff,
          // tslint:disable-next-line: no-bitwise
          srBpsC8 & 0xff, (srBpsC8 >> 8) & 0xff, (srBpsC8 >> 16) & 0xff, (srBpsC8 >> 24) & 0xff,
          0x02, 0x00, 0x10, 0x00,
          0x64, 0x61, 0x74, 0x61,
          // tslint:disable-next-line: no-bitwise
          dataSize & 0xff, (dataSize >> 8) & 0xff, (dataSize >> 16) & 0xff, (dataSize >> 24) & 0xff,
      ];
      for (let hx = 0; hx < 44; hx++) {
          headerArr[hx] = h[hx];
      }
      return Buffer.concat([Buffer.from(headerArr), data]);
  }
}
module.exports = LinuxDevice;