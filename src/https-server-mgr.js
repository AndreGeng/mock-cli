const https = require('https');
const asyncTask = require('async-task-mgr');
const debug = require('debug')('mockCli:httpsServerMgr');

const { getFreePort } = require('./utils');
const {
  getCertificate,
} = require('./cert-mgr');

class HttpsServerMgr {
  constructor() {
    this.httpsAsyncTask = new asyncTask();
  }
  getHttpsServer(hostname, cb) {
    return new Promise((resolve) => {
      const createServer = async (callback) => {
        const port = await getFreePort();
        const {
          keyContent,
          ctrContent,
        } = await getCertificate(hostname);
        https.createServer({
          key: keyContent,
          cert: ctrContent,
        }, cb).listen(port, () => {
          debug(`server started on https://localhost:${port}`);
          debug(`https-server-${hostname} ready`);
          callback({
            host: 'localhost',
            port,
          });
        });
      };
      this.httpsAsyncTask.addTask(`https-server-${hostname}`, createServer, (result) => {
        resolve(result);
      });
    });
  }
}

module.exports = HttpsServerMgr;
