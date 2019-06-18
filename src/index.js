const Koa = require('koa');

const mockjs = require('./middleware/mockjs');
const upstream = require('./middleware/upstream');

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

  app.use(mockjs(publicRoot));
  app.use(upstream(upstreamDomain));

  app.listen(port, () => {
    console.log(`server started on http://localhost:${port}`);
  });
  return app;
};
