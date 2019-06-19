const Koa = require('koa');
const path = require('path');
const debug = require('debug')('koa:index');

const mockjs = require('./middleware/mockjs');
const upstream = require('./middleware/upstream');

const getConfig = (publicRoot) => {
  try {
    const configPath = path.resolve(publicRoot, 'mock.config.js');
    delete require.cache[configPath];
    const config = require(configPath);
    return config;
  } catch (e) {
    debug('getConfig:', e);
    return {};
  }
};
/**
 * @param {object} options
 * @param {string} options.publicRoot the root directory to serve static assets
 * @param {number} options.port server start port
 * @param {string} options.upstreamDomain the domain to forward the request to when no matching mock data is found
 *
 */
module.exports = (options) => {
  const {
    publicRoot,
    port,
    upstreamDomain,
  } = options;
  
  const app = new Koa();
  app.context.config = getConfig(publicRoot);
  app.use(mockjs(publicRoot));
  app.use(upstream(upstreamDomain));

  app.listen(port, () => {
    console.log(`server started on http://localhost:${port}`);
  });
  return app;
};
