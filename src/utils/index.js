const sleep = require('./sleep');
const {
  isAbsoluteUrl,
} = require('./url');
const file = require('./file');

const getFreePort = function () {
  return new Promise((resolve, reject) => {
    const server = require('net').createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, () => {
      const port = server.address().port;
      server.close(() => {
        resolve(port);
      });
    });
  });
};
module.exports = {
  sleep,
  isAbsoluteUrl,
  getFreePort,
  ...file,
};
