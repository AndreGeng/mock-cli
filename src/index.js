const Koa = require("koa");
const path = require("path");
const chokidar = require("chokidar");
const bodyparser = require("koa-bodyparser");
const http = require("http");
const logger = require("koa-logger");
const fs = require("fs");

const mockService = require("./middleware/mock-service");
const upstream = require("./middleware/upstream");
const connectHandler = require("./connect-handler");

const loadMockConfig = (app, mockRoot, configFile) => {
  const mockConfig = path.resolve(mockRoot, configFile);
  delete require.cache[mockConfig];
  app.context.mockConf = require(mockConfig);
  chokidar.watch(mockConfig).on("all", () => {
    delete require.cache[mockConfig];
    app.context.mockConf = require(mockConfig);
  });
};

const applyUserMiddlewares = (app, middlewarePath) => {
  if (fs.existsSync(middlewarePath)) {
    const middlewares = fs.readdirSync(middlewarePath);
    if (middlewares && middlewares.length > 0) {
      middlewares.forEach(filename => {
        app.use(require(path.resolve(middlewarePath, filename)));
      });
      chokidar
        .watch(middlewarePath, {
          ignoreInitial: true
        })
        .on("all", type => {
          if (type === "add" || type === "change" || type === "unlink") {
            process.send({
              type: "restart"
            });
          }
        });
    }
  }
};

process.on("uncaughtException", function(err) {
  console.log(err);
  process.exit(1);
});

/**
 * @param {object} options
 * @param {string} options.mockRoot the root directory to serve static assets
 * @param {number} options.port server start port
 * @param {number} options.timeout service respond time
 * @param {string} options.upstreamDomain the domain to forward the request to when no matching mock data is found
 * @param {string} options.middlewarePath the path that contains middleware that need to be applied
 *
 */
const createServer = options => {
  const { mockRoot, port, upstreamDomain, configFile } = options;

  const app = new Koa();
  // context注入mockConf对象
  loadMockConfig(app, mockRoot, configFile);
  app.context.appConfig = options;
  app.use(logger());
  applyUserMiddlewares(app, options.middlewarePath);
  app.use(bodyparser());
  app.use(mockService(mockRoot));
  app.use(upstream(upstreamDomain));
  const listeningReporter = function() {
    const { port, address } = this.address();
    const protocol = this.addContext ? "https" : "http";
    console.log(`server started on ${protocol}://${address}:${port}`);
  };
  const httpServer = http
    .createServer(app.callback())
    .listen(port, listeningReporter);
  // 处理https -> http的场景
  httpServer.on("connect", connectHandler(app.callback()));
  return app;
};

process.on("message", function(options) {
  createServer(options);
});

module.exports = createServer;
