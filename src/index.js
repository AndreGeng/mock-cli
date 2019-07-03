const Koa = require('koa');
const path = require('path');
const chokidar = require('chokidar');
const bodyparser = require('koa-bodyparser');
const http = require('http');

const mockService = require('./middleware/mock-service');
const upstream = require('./middleware/upstream');
const connectHandler = require('./connect-handler');

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



process.on('uncaughtException', function (err) {
  console.log(err);
});

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
    upstreamDomain,
  } = options;
  
  const app = new Koa();
  // context注入mockConf对象
  loadMockConfig(app, mockRoot);
  app.context.appConfig = options;
  app.use(bodyparser());
  app.use(mockService(mockRoot));
  app.use(upstream(upstreamDomain));
  const listeningReporter = function() {
    const {port, address} = this.address();
    const protocol = this.addContext ? 'https' : 'http';
    console.log(`server started on ${protocol}://${address}:${port}`);
  };
  const httpServer = http.createServer(app.callback())
    .listen(port, listeningReporter);
  // 处理https -> http的场景
  httpServer.on('connect', connectHandler(app.callback()));
  return app;
};

