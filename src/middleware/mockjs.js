const path = require('path');
const resolve = require('resolve');
const mockjs = require('mockjs');
const {
  promisify,
} = require('util');
const minimatch = require('minimatch');
const debug = require('debug')('middleware:mockjs');

const {
  sleep,
} = require('../utils');

const resolveP = promisify(resolve);

const getResFromJs = async (ctx, content) => {
  let res;
  if (typeof content.data === 'function') {
    res = mockjs.mock(content.data(ctx));
  } else {
    res = mockjs.mock(content.data);
  }
  if (content.config) {
    const {
      timeout,
    } = content.config;
    if (typeof timeout !== 'undefined') {
      await sleep(timeout);
      return res;
    }
  }
  return res;
};

const getRedirectConfig = (publicRoot) => {
  try {
    const redirectConfigPath = path.resolve(publicRoot, 'redirect.config.js');
    delete require.cache[redirectConfigPath];
    const redirectConfig = require(redirectConfigPath);
    return redirectConfig;
  } catch (e) {
    return {};
  }
};

const getMockFile = async (publicRoot, ctx) => {
  try {
    let relativePath = `.${ctx.path}`;
    const redirectConfig = getRedirectConfig(publicRoot);
    for (const [key, value] of Object.entries(redirectConfig)) {
      if (minimatch(ctx.path, key)) {
        relativePath = value;
        break;
      }
    }

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
  const fileAbs = await getMockFile(publicRoot, ctx);
  if (fileAbs) {
    const extname = path.extname(fileAbs);
    delete require.cache[fileAbs];
    const content = require(fileAbs);
    // 对于json文件直接返回结果
    if (extname === '.json') {
      ctx.body = mockjs.mock(content);
      return;
    // 对于js文件，获取配置并返回结果
    } else if (extname === '.js') {
      const res = await getResFromJs(ctx, content);
      ctx.body = res;
    }
    return;
  }
  await next();
};
