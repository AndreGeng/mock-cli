#!/usr/bin/env node
const path = require('path');
const program = require('commander');

const createServer = require('../src/index.js');
const packageJson = require('../package.json');

program
  .version(packageJson.version, '-v', '--version')
  .option('-p, --port <port>', 'mock server port', parseInt)
  .option('-r, --root <port>', 'mock server port')
  .option('-u, --upstream-domain <upstreamDomain>', 'mock server upstream domain')
  .parse(process.argv);

createServer({
  port: program.port || 3000,
  publicRoot: path.resolve(process.cwd(), program.root || 'mock'),
  upstreamDomain: program.upstreamDomain,
});
