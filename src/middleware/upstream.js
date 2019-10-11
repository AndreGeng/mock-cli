const axios = require("axios");
const debug = require("debug")("mockCli:upstream");

const { isAbsoluteUrl } = require("../utils");

module.exports = upstreamDomain => async (ctx, next) => {
  const mockObj = ctx.mockObj;
  const targetDomain = (mockObj && mockObj.upstream) || upstreamDomain;
  const requestHeaders = Object.assign({}, ctx.headers);
  delete requestHeaders.host;
  delete requestHeaders["content-length"];
  debug("request headers: %o", requestHeaders);
  debug("request body: %O", ctx.request.body);
  let targetUrl;

  if (targetDomain) {
    targetUrl = `${targetDomain}${ctx.path}?${ctx.querystring}`;
  } else if (
    ctx.host.indexOf("localhost") === -1 &&
    ctx.host.indexOf("127.0.0.1") === -1
  ) {
    targetUrl = `${ctx.protocol}://${ctx.host}${ctx.path}?${ctx.querystring}`;
  }
  if (targetUrl && isAbsoluteUrl(targetUrl)) {
    return axios({
      method: ctx.method,
      headers: requestHeaders,
      url: targetUrl,
      data: ctx.request.body
    })
      .then(res => {
        debug(`succ:${ctx.url}:${ctx.method}`);
        ctx.status = res.status;
        ctx.set(res.headers);
        ctx.body = res.data;
      })
      .catch(e => {
        debug(`fail:${ctx.url}:${ctx.method}`);
        ctx.status = 500;
        ctx.body = String(e);
      });
  }
  await next();
};
