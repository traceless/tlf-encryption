import koa from 'koa';
import Router from 'koa-router';
import http from 'http';
import httpClient from './utils/httpClient.js';
import bodyparser from 'koa-bodyparser';
import config from './config.js';

const { flowEnc, webdavServerHost, webdavServerPort } = config
const webdavRouter = new Router();
const restRouter = new Router();
const app = new koa()
let authorization = null

webdavRouter.all(/\/dav\/*/, async (ctx) => {
  const request = ctx.req;
  const response = ctx.res;
  // 缓存起来，很多客户端并不是每次都会携带 authorization，导致上传文件一些异常，不想catch了，直接每次携带 authorization
  request.headers.authorization = request.headers.authorization ? authorization = request.headers.authorization : authorization
  // headers 所有都透传，不删除，host需要单独修改，实测没影响
  request.headers.host = webdavServerHost + ':' + webdavServerPort
  request.urlAddr = `http://${request.headers.host}` + request.url
  // 如果是上传文件，那么进行流加密
  if (request.method.toLocaleUpperCase() === 'PUT') {
    await httpClient(request, response, (webdavReq) => {
      // 这里就进行文件上传，可以进行加解密，一般判断路径 TODO
      request.pipe(flowEnc.encodeTransform()).pipe(webdavReq)
    })
    return
  }
  await httpClient(request, response, (webdavReq) => {
    request.pipe(webdavReq)
  })
  console.log("----finish---");
});
// 这个是代理webdav的路由控制
app.use(webdavRouter.routes()).use(webdavRouter.allowedMethods());

// 下面是实现自己的业务
app.use(bodyparser({ enableTypes: ["json", "form", "text"] }));
restRouter.all("/proxy", async ctx => {
  console.log("------proxy------", ctx.req.url);
  ctx.body = { success: true };
})
app.use(restRouter.routes()).use(restRouter.allowedMethods());
app.use(async (ctx) => {
  console.log("------404------", ctx.req.url);
  ctx.body = { success: true };
});

const server = http.createServer(app.callback());
const port = 5344;
server.listen(port, () => console.log("服务启动成功: " + port));
setInterval(() => {
  console.log('server_connections', server._connections);
}, 12000);
