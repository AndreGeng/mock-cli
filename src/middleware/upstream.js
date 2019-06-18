const axios = require('axios');

module.exports = (upstreamDomain) => async (ctx, next) => {
  if (upstreamDomain) {
    return axios({
      method: ctx.method,
      url: `${upstreamDomain}${ctx.url}`,
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
