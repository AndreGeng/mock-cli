const axios = require('axios');
const debug = require('debug')('middleware:upstream');

const {
  globMatch,
  isAbsoluteUrl,
} = require('../utils');

module.exports = (upstreamDomain) => async (ctx, next) => {
  const config = ctx.appConfig;
  const mockObj = ctx.mockObj;
  const targetDomain = (mockObj && mockObj.upstream) || upstreamDomain;
  const requestHeaders = Object.assign({}, ctx.headers);
  delete requestHeaders.host;
  delete requestHeaders['content-length'];
  debug('request headers', requestHeaders);
  debug('request body', ctx.request.body);
  let targetUrl;
  
  if (targetDomain) {
    targetUrl = `${targetDomain}${ctx.path}?${ctx.querystring}`;
  } else if (isAbsoluteUrl(ctx.originalUrl)) {
    targetUrl = ctx.originalUrl;
  }
  if (targetUrl) {
    return axios({
      method: ctx.method,
      headers: requestHeaders,
      url: targetUrl,
      data: ctx.request.body,
    })
      .then((res) => {
        debug(`succ:${ctx.url}:${ctx.method}`);  
        ctx.status = res.status;
        ctx.set(res.headers);
        ctx.body = res.data;
      })
      .catch((e) => {
        debug(`fail:${ctx.url}:${ctx.method}`);  
        ctx.status = 500;
        ctx.body = String(e);
      });
  }
  await next();
};
