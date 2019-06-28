const axios = require('axios');

const {
  globMatch,
} = require('../utils');

module.exports = (upstreamDomain) => async (ctx, next) => {
  const config = ctx.appConfig;
  const mockObj = ctx.mockObj;
  const targetDomain = (mockObj && mockObj.upstream) || upstreamDomain;
  if (targetDomain) {
    return axios({
      method: ctx.method,
      url: `${targetDomain}${ctx.url}`,
      body: ctx.body,
    })
      .then((res) => {
        ctx.status = res.status;
        ctx.set(res.headers);
        ctx.body = res.data;
      })
      .catch((e) => {
        ctx.status = 500;
        ctx.body = String(e);
      });
  }
  await next();
};
