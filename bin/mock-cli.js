#!/usr/bin/env node
const path = require("path");
const program = require("commander");
const shell = require("shelljs");
const cp = require("child_process");
const chalk = require("chalk");
const chokidar = require("chokidar");

const packageJson = require("../package.json");
const { generateRootCA } = require("../src/cert-mgr.js");

let preChild = null;

const getChildDebugArgv = () => {
  const debugArgv = process.execArgv.filter(
    item => item.indexOf("inspect") !== -1
  );
  const isDebug = debugArgv.length > 0;
  if (!isDebug) {
    return [];
  }
  const childDebugPort = 9230;
  if (debugArgv.indexOf("=") !== -1) {
    return [debugArgv[0].replace(/\d+/, childDebugPort)];
  }
  return [`${debugArgv[0]}=${childDebugPort}`];
};

program
  .version(packageJson.version, "-v, --version")
  .option("-p, --port <port>", "mock server port, default:3000", parseInt)
  .option(
    "-t, --timeout <timemout>",
    "mock service response time, default: 0",
    parseInt
  )
  .option("-r, --root <root dir>", "mock server serve dir, default: ./mock")
  .option(
    "-u, --upstream-domain <upstreamDomain>",
    "mock server upstream domain"
  )
  .option(
    "-c, --config-file <configFile>",
    "config file path, default: ./mock.config.js"
  )
  .option(
    "-m, --middleware-path <middlewarePath>",
    "path to folder that contains middlewares, relatives to mock root, default: ./middlewares"
  );

const startServer = (child, { middlewarePath, mockRoot, configFile }) => {
  preChild = child;
  child.send({
    type: "start-server",
    port: program.port || 3000,
    timeout: program.timeout || 0,
    mockRoot,
    upstreamDomain: program.upstreamDomain,
    middlewarePath,
    configFile
  });
};
const restartChildIfNeeded = ({ middlewarePath, mockRoot, configFile }) => {
  // middleware变更时，重启子线程
  chokidar
    .watch([middlewarePath, path.resolve(mockRoot, configFile)], {
      ignoreInitial: true
    })
    .on("all", type => {
      if (type === "add" || type === "change" || type === "unlink") {
        preChild && preChild.kill("SIGKILL");
        const newChild = cp.fork("../src/index.js", [], {
          cwd: __dirname,
          execArgv: getChildDebugArgv()
        });
        startServer(newChild, {
          middlewarePath,
          mockRoot,
          configFile
        });
        console.log(chalk.cyan("middleware change detected, server restarted"));
      }
    });
};
program
  .command("start")
  .description("start mock server")
  .action(() => {
    // https需要给每个域名生成不同的证书，所以这里server的创建统一采用fork的方式
    const child = cp.fork("../src/index.js", [], {
      cwd: __dirname,
      execArgv: getChildDebugArgv()
    });
    const middlewarePath = path.resolve(
      process.cwd(),
      program.root || "mock",
      program.middlewarePath || "./middlewares"
    );
    const mockRoot = path.resolve(process.cwd(), program.root || "mock");
    const configFile = program.configFile || "mock.config.js";
    const options = {
      middlewarePath,
      mockRoot,
      configFile
    };
    startServer(child, options);
    restartChildIfNeeded(options);
  });

const genDefaultMockDir = () => {
  const mockRoot = path.resolve(process.cwd(), program.root || "mock");
  const initConfigFile = () => {
    shell
      .echo(
        `module.exports = {
    '/ajax/exact-match': './exact-match.json',
    'get /ajax/test': './test.js',
    'get 2000 /ajax/test-withdelay': './test.js',
    'post /ajax/:name/test': {
      path: './test.js',
      timeout: 1000,
      upstream: 'http://localhost:4000',
    },
};
    `
      )
      .to(path.resolve(mockRoot, program.configFile || "mock.config.js"));
    shell
      .echo(
        JSON.stringify(
          {
            "name|2-7": "test"
          },
          null,
          2
        )
      )
      .to(path.resolve(mockRoot, "exact-match.json"));
    shell
      .echo(
        `module.exports = (ctx) => {
    return {
      'name|2-7': ctx.query.name || ctx.params.name || '*',
    };
};
    `
      )
      .to(path.resolve(mockRoot, "test.js"));
  };
  try {
    shell.mkdir("-p", mockRoot);
    initConfigFile();
  } catch (e) {
    console.log(e);
  }
};
program
  .command("init")
  .description("init mock directory")
  .option("-y, --y", "use default mock directory")
  .action(options => {
    if (options.y) {
      genDefaultMockDir();
      console.log(
        chalk.cyan(
          `mock service init successfully. 
You can try it out by:
1. use 'mock start' to start mock server.
2. browser to http://localhost:${program.port || 3000}/ajax/test to try it out`
        )
      );
    }
  });

program
  .command("gen-ca")
  .description("generate root CA")
  .action(() => {
    generateRootCA();
  });

program.parse(process.argv);
