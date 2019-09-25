const path = require("path");
const resolve = require("resolve");
const mockjs = require("mockjs");
const { promisify } = require("util");
const pathMatch = require("path-match")();
const debug = require("debug")("mockCli:mockService");

const { sleep } = require("../utils");

const resolveP = promisify(resolve);

const getResFromJs = async (ctx, content) => {
  let res;
  if (typeof content === "function") {
    res = mockjs.mock(content(ctx));
  } else {
    res = mockjs.mock(content);
  }
  return res;
};

const getMockObj = (mockRoot, ctx) => {
  let mockObj = null;
  for (const [key, value] of Object.entries(ctx.mockConf)) {
    let [method, url] = key.split(/\s+/);
    if (!url) {
      url = method;
      method = "all";
    }
    if (method !== "all" && method !== ctx.method.toLowerCase()) {
      continue;
    }
    const routeMatcher = pathMatch(url);
    const params = routeMatcher(ctx.path);
    if (params) {
      ctx.params = params;
      if (typeof value === "object") {
        mockObj = value;
      } else if (typeof value === "string") {
        mockObj = {
          path: value
        };
      } else {
        debug("globalConfig rewrite format error");
      }
      return mockObj;
    }
  }
  return null;
};

const getMockFile = async (mockRoot, ctx) => {
  try {
    const mockObj = ctx.mockObj;
    let relativePath = (mockObj && mockObj.path) || `.${ctx.path}`;
    const fileAbs = await resolveP(relativePath, {
      basedir: mockRoot,
      extensions: [".js", ".json"]
    });
    return fileAbs;
  } catch (e) {
    debug("file not found:");
  }
  return null;
};

module.exports = mockRoot => async (ctx, next) => {
  const config = ctx.appConfig;
  const mockObj = await getMockObj(mockRoot, ctx);
  ctx.mockObj = mockObj;
  const mockFile = await getMockFile(mockRoot, ctx);
  if (mockFile) {
    const extname = path.extname(mockFile);
    delete require.cache[mockFile];
    const content = require(mockFile);
    const timeout = (mockObj && mockObj.timeout) || config.timeout;
    await sleep(timeout);
    // 对于json文件直接返回结果
    if (extname === ".json") {
      ctx.body = mockjs.mock(content);
      // 对于js文件，获取配置并返回结果
    } else if (extname === ".js") {
      const res = await getResFromJs(ctx, content);
      ctx.body = res;
    }
    return;
  }
  await next();
};
