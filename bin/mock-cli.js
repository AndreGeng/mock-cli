#!/usr/bin/env node
const path = require('path');
const program = require('commander');
const shell = require('shelljs');

const createServer = require('../src/index.js');
const packageJson = require('../package.json');

program
  .version(packageJson.version, '-v, --version')
  .option('-p, --port <port>', 'mock server port, default:3000', parseInt)
  .option('-t, --timeout <timemout>', 'mock service response time, default: 0', parseInt)
  .option('-r, --root <root dir>', 'mock server serve dir, default: "./mock"')
  .option('-u, --upstream-domain <upstreamDomain>', 'mock server upstream domain');

program
  .command('start')
  .description('start mock server')
  .action(() => {
    const mockRoot = path.resolve(process.cwd(), program.root || 'mock'); 
    createServer({
      port: program.port || 3000,
      timeout: program.timeout || 0,
      mockRoot,
      upstreamDomain: program.upstreamDomain,
    });
  });

const genDefaultMockDir = () => {
  const mockRoot = path.resolve(process.cwd(), program.root || 'mock'); 
  const initConfigFile = () => {
    shell.echo(`module.exports = {
    '/ajax/exact-match': './exact-match.json',
    '/ajax/*': {
      path: './test.js',
      timeout: 1000,
      upstream: 'http://localhost:4000',
    },
};
    `).to(path.resolve(mockRoot, 'mock.config.js'));
    shell.echo(JSON.stringify({
      'name|2-7': 'test',
    }, null, 2)).to(path.resolve(mockRoot, 'exact-match.json'));
    shell.echo(`module.exports = (ctx) => {
    return {
      'name|2-7': ctx.query.name || '*',
    };
};
    `).to(path.resolve(mockRoot, 'test.js'));
  };
  try {
    shell.mkdir('-p', mockRoot);
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
