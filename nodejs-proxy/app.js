'use strict'

import Koa from 'koa'
import Router from 'koa-router'
import http from 'http'
import httpClient from './utils/httpClient.js'
import bodyparser from 'koa-bodyparser'
import config from './config.js'

const { flowEnc, webdavServerHost, webdavServerPort } = config
const webdavRouter = new Router()
const restRouter = new Router()
const app = new Koa()

// 可能是302跳转过来的，md5校验，/redirect/md5?url=https://aliyun.oss
webdavRouter.all('/redirect/:md5', async (ctx) => {
  const request = ctx.req
  const response = ctx.res
  // 这里还是要encodeURIComponent ，因为http服务器会自动对url进行decodeURIComponent
  if (flowEnc.md5(encodeURIComponent(ctx.query.url)) !== ctx.params.md5) {
    ctx.body = { success: false }
    return
  }
  // 设置请求地址和是否要解密
  request.urlAddr = ctx.query.url
  const decodeTransform = ctx.query.decode ? flowEnc.decodeTransform() : null
  delete request.headers.host
  // 请求实际服务资源
  await httpClient(request, response, null, decodeTransform)
  console.log('----@@@@finish 302---', ctx.query.decode, request.urlAddr)
})

// let authorization = null
webdavRouter.all(/\/*/, async (ctx) => {
  const request = ctx.req
  const response = ctx.res
  // request.headers.authorization = request.headers.authorization ? authorization = request.headers.authorization : authorization
  request.headers.host = webdavServerHost + ':' + webdavServerPort
  request.urlAddr = `http://${request.headers.host}` + request.url
  // 如果是上传文件，那么进行流加密
  if (request.method.toLocaleUpperCase() === 'PUT') {
    await httpClient(request, response, flowEnc.encodeTransform())
    return
  }
  await httpClient(request, response)
})
// 这个是代理webdav的路由控制
app.use(webdavRouter.routes()).use(webdavRouter.allowedMethods())

// ======================下面是实现自己的业务==============================

app.use(bodyparser({ enableTypes: ['json', 'form', 'text'] }))
// TODO
restRouter.all('/proxy', async (ctx) => {
  console.log('------proxy------', ctx.req.url)
  ctx.body = { success: true }
})
app.use(restRouter.routes()).use(restRouter.allowedMethods())
// 兜底处理
app.use(async (ctx) => {
  console.log('------404------', ctx.req.url)
  ctx.body = { success: true }
})

const server = http.createServer(app.callback())
server.maxConnections = 1000
// server.keepAliveTimeout = 50 * 1000;
const port = 5344
server.listen(port, () => console.log('服务启动成功: ' + port))
setInterval(() => {
  console.log('server_connections', server._connections)
}, 5000)
