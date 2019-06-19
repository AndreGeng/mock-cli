const axios = require('axios');

const {
  globMatch,
} = require('../utils');

const getUpstreamMap = (rewrite) => {
  const result = {};
  if (rewrite) {
    Object.keys(rewrite)
      .forEach((key) => {
        const value = rewrite[key];
        if (typeof value === 'object') {
          result[key] = value['upstream'];
        }
      });
  }
  return result;
};

module.exports = (upstreamDomain) => async (ctx, next) => {
  const config = ctx.config;
  const upstreamMap = getUpstreamMap(config.rewrite);
  const match = globMatch(ctx.path, upstreamMap);
  const targetDomain = match || upstreamDomain;
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
