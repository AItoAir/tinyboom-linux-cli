const tsee = require("tsee");
const asyncMutex = require("async-mutex");
const sharp = require("sharp");

const get_ips_1 = require("../library/get-ips");

const noMicrophone = true;

class LinuxDevice extends tsee.EventEmitter {
  constructor(cameraInstance, frameHeight = 96) {
    super();
    this._snapshotStreaming = false;
    this._lastSnapshot = new Date(0);
    this._snapshotMutex = new asyncMutex.Mutex();
    this._snapshotId = 0;
    this._camera = cameraInstance;
    if (this._camera) {
      this._camera.on('snapshot', async (buffer, filename) => {
        const id = ++this._snapshotId;
        const release = await this._snapshotMutex.acquire();
        // limit to 10 frames a second & no new frames should have come in...
        try {
          if (this._snapshotStreaming && Date.now() - +this._lastSnapshot >= 100 && id === this._snapshotId) {
            const jpg = sharp(buffer);
            const resized = await jpg.resize(undefined, frameHeight).jpeg().toBuffer();
            this.emit('snapshot', resized, filename);
            this._lastSnapshot = new Date();
          }
        } catch (ex) {
          console.warn('Failed to handle snapshot', ex);
        } finally {
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
  async isSnapshotStreaming() {
    return this._snapshotStreaming;
  }
}
module.exports = LinuxDevice;