const request = require('superagent');
const apiHost = "localhost:1337";
const baseApiUrl = `http://${apiHost}/api/v1/cli`;

async function getProjectInfo(projectCode, apiKey) {
  const url = `${baseApiUrl}/project/${projectCode}`;
  const result = await request
    .get(url)
    .set('X-API-Key', apiKey)
    .set('content-type', 'application/json');
  if (result && result.body) {
    return result.body.projectRecord
  }
  return null;
}

module.exports = {
  getProjectInfo
}