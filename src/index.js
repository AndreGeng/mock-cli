const Koa = require('koa');
const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');
const bodyparser = require('koa-bodyparser');
const debug = require('debug')('koa:index');

const mockService = require('./middleware/mock-service');
const upstream = require('./middleware/upstream');
const loadMockConfig = (app, mockRoot) => {
  const mockConfig = path.resolve(mockRoot, './mock.config.js');
  delete require.cache[mockConfig];
  app.context.mockConf = require(mockConfig);
  chokidar.watch(mockConfig)
    .on('all', () => {
      delete require.cache[mockConfig];
      app.context.mockConf = require(mockConfig);
    });
};

/**
 * @param {object} options
 * @param {string} options.mockRoot the root directory to serve static assets
 * @param {number} options.port server start port
 * @param {number} options.timeout service respond time
 * @param {string} options.upstreamDomain the domain to forward the request to when no matching mock data is found
 *
 */
module.exports = (options) => {
  const {
    mockRoot,
    port,
    timeout,
    upstreamDomain,
  } = options;
  
  const app = new Koa();
  // context注入mockConf对象
  loadMockConfig(app, mockRoot);
  app.context.appConfig = options;
  app.use(bodyparser());
  app.use(mockService(mockRoot));
  app.use(upstream(upstreamDomain));

  app.listen(port, () => {
    console.log(`server started on http://localhost:${port}`);
  });
  return app;
};
