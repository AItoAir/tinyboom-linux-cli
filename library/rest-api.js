const request = require('superagent');
const apiHost = process.env.TINYBOOM_APIHOST || 'https://tinyboom.aitoair.com';
const baseApiUrl = `${apiHost}/api/v1/cli`;

async function getProjectInfo(projectCode, apiKey, deviceId, deviceType) {
  const url = `${baseApiUrl}/project/${projectCode}`;
  try {
    const result = await request
    .post(url)
    .send({ 
      deviceId,
      deviceType
    })
    .set('X-API-Key', apiKey)
    .set('content-type', 'application/json');
    if (result && result.body) {
      return {
        project: result.body.projectRecord,
        device: result.body.deviceRecord
      }
    }
  } catch (e) {
    // console.debug(e);
  }
  return null;
}

async function uploadImage(projectCode, apiKey, deviceRecordId, userId, teamId, snapshotFullPath, type) {
  console.log(`RestApi.uploadImage`, projectCode, apiKey, deviceRecordId, userId, teamId, snapshotFullPath, type);
  const url = `${baseApiUrl}/project/${projectCode}/upload-image`;
  try {
    const result = await request
    .post(url)
    .set('X-API-Key', apiKey)
    .field('deviceRecordId', deviceRecordId)
    .field('userId', userId)
    .field('teamId', teamId)
    .field('type', type)
    .attach('imageFile', snapshotFullPath);
    if (result && result.body) {
      return {
        image: result.body.image
      }
    }
  } catch (e) {
    console.debug(e);
  }
  return null;
}

async function setDeviceInactive(projectCode, apiKey, deviceRecordId) {
  const url = `${baseApiUrl}/project/${projectCode}/inactive`;
  try {
    await request.post(url)
    .send({ deviceRecordId })
    .set('X-API-Key', apiKey)
    .set('content-type', 'application/json');
    return true;
  } catch (e) {
    // console.debug(e);
  }
  return false;
}

module.exports = {
  getProjectInfo,
  uploadImage,
  setDeviceInactive
}