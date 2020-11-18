const url = require("url");
module.exports = async function (ctx, next) {
  let referer;
  if (ctx.headers.referer) {
    referer = url.parse(ctx.headers.referer);
  }
  ctx.set({
    "Access-Control-Allow-Origin": referer
      ? `${referer.protocol}//${referer.host}`
      : "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Credentials": true,
  });
  await next();
};
