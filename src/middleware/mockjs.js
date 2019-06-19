const path = require('path');
const resolve = require('resolve');
const mockjs = require('mockjs');
const {
  promisify,
} = require('util');
const debug = require('debug')('middleware:mockjs');

const {
  sleep,
  globMatch,
} = require('../utils');

const resolveP = promisify(resolve);

const getRedirectMap = (rewrite) => {
  const result = {};
  if (rewrite) {
    Object.keys(rewrite)
      .forEach((key) => {
        const value = rewrite[key];
        if (typeof value === 'object') {
          result[key] = value['path'];
        } else if (value === 'string') {
          result[key] = value;
        } else {
          debug('globalConfig rewrite format error', rewrite);
        }
      });
  }
  return result;
};
const getResFromJs = async (ctx, content, globalConfig = {}) => {
  let res;
  if (typeof content === 'function') {
    res = mockjs.mock(content(ctx));
  } else if (typeof content.res === 'function') {
    res = mockjs.mock(content.res(ctx));
  } else {
    res = mockjs.mock(content.res);
  }
  const config = Object.assign({}, globalConfig, content.config);
  const {
    timeout = 0,
  } = config;
  if (typeof timeout !== 'undefined') {
    await sleep(timeout);
    return res;
  }
  return res;
};

const getMockFile = async (publicRoot, ctx, redirectMap = {}) => {
  try {
    const match = globMatch(ctx.path, redirectMap);
    let relativePath = match || `.${ctx.path}`;
    const fileAbs = await resolveP(relativePath, {
      basedir: publicRoot,
      extensions: ['.js', '.json'],
    });
    return fileAbs;
  } catch (e) {
    debug('file not found:');
  }
  return null;
};

module.exports = (publicRoot) => async (ctx, next) => {
  const config = ctx.config;
  const { rewrite, ...others } = config;
  const fileAbs = await getMockFile(publicRoot, ctx, getRedirectMap(rewrite));
  if (fileAbs) {
    const extname = path.extname(fileAbs);
    delete require.cache[fileAbs];
    const content = require(fileAbs);
    // 对于json文件直接返回结果
    if (extname === '.json') {
      const timeout = config.timeout || 0;
      await sleep(timeout);
      ctx.body = mockjs.mock(content);
      return;
    // 对于js文件，获取配置并返回结果
    } else if (extname === '.js') {
      const res = await getResFromJs(ctx, content, { ...others });
      ctx.body = res;
    }
    return;
  }
  await next();
};
