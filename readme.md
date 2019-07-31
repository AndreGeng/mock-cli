# mock-cli

前端mock server, 用于json数据的mock

## 背景
随着前后端的分离，前端需要一种简单的方法在联调之前，确定自身代码的正确性。前端需要mock后端的服务进行测试，采用mock服务有以下一些好处：
1. 前端不再依赖后端接口，可以先行测试，能使后期的联调效率更加高效。
2. 方便一些边界case的模拟，降低沟通成本。mock测试可以更低成本的完成前端测试。

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
  -t, --timeout <timemout>                mock service response time, default: 0
  -r, --root <root dir>                   mock server serve dir, default: "./mock"
  -u, --upstream-domain <upstreamDomain>  mock server upstream domain
  -h, --help                              output usage information

Commands:
  start                                   start mock server
  init [options]                          init mock directory
  gen-ca                                  generate root CA
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
当请求http://localhost:3000/ajax/foo, 这个地址时，mock server会把mock/test.js的内容返回

#### mock服务匹配规则
mock服务匹配有两种方式
1. 基于mock.config.js映射规则。mock.config.js文件的具体格式见下方『配置文件』一节
2. 基于mock文件路径。
  如果mock文件的路径与请求的path匹配，mock文件会被返回。例如在mock文件夹下有mock/ajax/test.json文件, 当用户请求/ajax/test路径时，mock/ajax/test.json文件会被返回。
ps: 映射规则的优先级要高于基于文件路径的匹配。

#### 配置文件

可以在mock文件夹下，新建mock.config.js来提供mock配置
配置样例如下:
```
module.exports = {
  '/ajax/exact-match': './exact-match.json',
  'post /ajax/:name': {
    path: './test.js',
    timeout: 1000,
    upstream: 'http://localhost:4000',
  },
};
```
mock服务的匹配规则基于[path-to-regexp](https://github.com/component/path-to-regexp), 对于匹配到的path, url中的参数，例如：:name，可以通过ctx.params来读取。
配置文件除了用于定义mock服务映射规则。还可以对匹配到的mock服务进行一定程度的配置，目前支持两个配置参数:
timeout: 用于指定mock服务的响应时间
upstream: 用于当path指定的文件不存在时，请求被forward到的域名
ps:
 如果所有接口的forward域名都是一样的，可以在命令行通过-u参数来指定。e.g. `mock start -u 'http://server'`

#### mock文件格式
mock文件支持两种格式: json和js
  * json的内容会被直接返回
  * js文件的格式如下
  ```
module.exports = (ctx) => {
    return {
      'name|2-7': ctx.query.name || '*',
    };
};
    
  ```
ps:
1. mock文件返回的json值遵循[mockjs](https://github.com/nuysoft/Mock/wiki)的数据格式，方便编写随机的mock数据。
2. exports的值是一个函数时，koa的context会被传入，用户可以根据request的具体内容返回mock数据, 或者用于修改mock返回的header信息，etc.


### 代理
最后就可以通过charles/fiddler之类的工具来把想要mock的接口, 代理到mock server了。

### https服务mock
如果需要mock https服务，需要安装rootCA证书。
1. 在命令行中，运行下面的命令
```
mock gen-ca
open ~/.mock-cli/certs
```
2. 安装并信任certs文件夹下面的rootCA.crt。
