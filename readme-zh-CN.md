mock-cli
========

## 背景
随着前后端的分离，前端需要一种简单的方法在联调之前，确定自身代码的正确性。前端需要mock后端的服务进行测试，采用mock服务有以下一些好处：
1. 前端不再依赖后端接口，可以先行测试，能使后期的联调效率更加高效。
2. 随着后端业务逻辑复杂化，一些边界case的模拟，可能涉及多方，有较高的沟通成本。mock测试可以更低成本的完成前端测试。

## 方案
由于目前大多数项目是前后端分离的，mock-cli暂不考虑模板的渲染，目前只提供后端接口的mock.

## 使用方法
mock-cli是一个基于node的命令行工具，当运行它时，它启动一个基于koa的server来提供mock服务。
### 命令行参数
```
Usage: mock [options] [command]

Options:
  -v, --version                           output the version number
  -p, --port <port>                       mock server port, default:3000
  -r, --root <root dir>                   mock server serve dir, default: "./mock"
  -u, --upstream-domain <upstreamDomain>  mock server upstream domain
  -h, --help                              output usage information

Commands:
  start                                   start mock server
  init [options]                          init mock directory
```
ps: upstream是当所有mock文件都匹配不到时，请求会被forward到upstream域名

### 示例
#### 基础应用

以mock，http://fakedomain.com/ajax/foo 这个服务为例
在项目根目录下执行下面的命令
```
mock init -y
mock start
```

这时mock服务已经初始化成功，并运行在localhost:3000端口上, 在浏览器中访问http://localhost:3000/ajax/foo, 看到有json数据返回说明mock服务启动成功。

`mock init -y`在项目根目录下新建了'mock'文件夹，
`mock start` 启动了mock服务。 
当请求http://localhost:3000/ajax/foo, 这个地址时，mock server会把mock/ajax/foo.json的内容返回

#### mock文件

mock文件支持两种格式: json和js
  * json的内容会被直接返回
  * js文件的格式如下
  ```
  module.exports = {
    config: {
      timeout: 100,
    },
    res: {
    }
  }
  ```
  其中config中可以设置接口的超时时间，res的值可以是要返回的json数据，或者是一个返回json数据的函数。当res的值是一个函数时，koa的context会被传入，用户可以根据request的具体内容返回mock数据

#### 配置文件

可以在mock文件夹下，新建mock.config.js来提供mock配置
配置样例如下:
```
module.exports = {
  timeout: 100,
  rewrite: {
    '/m/*': {
      path: './test.json',
      upstream: 'http://localhost:4000',
    },
  },
};
```
timeout为全局超时设置，可以被接口级的超时覆盖。
rewrite可以定义重写规则，mock server会把匹配到的path返回指定的文件，像上面的配置当请求/m/test path时，mock/test.json的数据会被返回
upstream是用于指定，匹配不到mock文件时，接口被forward到哪个域名。
ps:
1. 如果所有接口的forward域名都是一样的，可以在命令行通过-u参数来指定。e.g. `mock start -u 'http://server'`
2. 配置文件只需要指定重写规则时，可以采用如下简写方式
```
module.exports = {
  timeout: 100,
  rewrite: {
    '/m/*': './test.json',
  },
};
```

### 代理
最后就可以通过charles/fiddler之类的工具来把想要mock的接口, 代理到mock了。

