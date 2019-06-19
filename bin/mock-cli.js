#!/usr/bin/env node
const path = require('path');
const program = require('commander');
const shell = require('shelljs');

const createServer = require('../src/index.js');
const packageJson = require('../package.json');

program
  .version(packageJson.version, '-v, --version')
  .option('-p, --port <port>', 'mock server port, default:3000', parseInt)
  .option('-r, --root <root dir>', 'mock server serve dir, default: "./mock"')
  .option('-u, --upstream-domain <upstreamDomain>', 'mock server upstream domain');

program
  .command('start')
  .description('start mock server')
  .action(() => {
    createServer({
      port: program.port || 3000,
      publicRoot: path.resolve(process.cwd(), program.root || 'mock'),
      upstreamDomain: program.upstreamDomain,
    });
  });

const genDefaultMockDir = () => {
  const initBasicMockExample = () => {
    shell.echo(JSON.stringify({
      name: 'foo',
      'age|0-100': 0,
    }, null, 2)).to('mock/ajax/foo.json');
  };
  const initJsMockExample = () => {
    shell.echo(`module.exports = {
  config: {
    timeout: 1000,
  },
  res: {
    'name|2-7': '*',
  },
};
`).to('mock/ajax/bar.js');
  };
  const initCustomMockExample = () => {
    shell.echo(`module.exports = {
  config: {
    timeout: 0,
  },
  res(ctx) {
    return {
      'name|2-7': ctx.query && ctx.query.name || '*',
    };
  }
};
/**
  * you can also export an function directly like below
  */
// module.exports = (ctx) => {
//   return {
//     'name|2-7': ctx.query && ctx.query.name || '*',
//   };
// }
    `).to('mock/ajax/baz.js');
  };
  const initConfigFile = () => {
    shell.echo(`module.exports = {
  timeout: 100,
  rewrite: {
    '/m/*': {
      path: './test.json',
      upstream: 'http://localhost:4000',
    },
  },
};
    `).to('mock/mock.config.js');
    shell.echo(JSON.stringify({
      name: 'test',
    }, null, 2)).to('mock/test.json');
  };
  try {
    shell.mkdir('-p', 'mock/ajax');
    initBasicMockExample();
    initJsMockExample();
    initCustomMockExample();
    initConfigFile();
  } catch(e) {
    console.log(e);
  }
};
program
  .command('init')
  .description('init mock directory')
  .option('-y, --y', 'use default mock directory')
  .action((options) => {
    if (options.y) {
      genDefaultMockDir();
    }
  });

program.parse(process.argv);
