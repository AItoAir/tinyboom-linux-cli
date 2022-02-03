const request = require('superagent');
const apiHost = "localhost:1337";
const baseApiUrl = `http://${apiHost}/api/v1/cli`;

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
      return result.body.projectRecord
    }
  } catch (e) {
    // console.debug(e);
  }
  return null;
}

module.exports = {
  getProjectInfo
}