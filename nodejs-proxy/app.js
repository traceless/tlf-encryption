'use strict'

import Koa from 'koa'
import Router from 'koa-router'
import http from 'http'
import httpClient from './utils/httpClient.js'
import bodyparser from 'koa-bodyparser'
import FlowEnc from './utils/flowEnc.js'
import levelDB from './utils/levelDB.js'
import { webdavServer, alistServer } from './config.js'
import { pathExec } from './utils/commonUtil.js'

const webdavRouter = new Router()
const restRouter = new Router()
const app = new Koa()

// ======================/proxy是实现本服务的业务==============================

// bodyparser解析body
const bodyparserMw = bodyparser({ enableTypes: ['json', 'form', 'text'] })
restRouter.all(/\/proxy\/*/, bodyparserMw)
// TODO
restRouter.all('/proxy/config', async (ctx) => {
  console.log('------proxy------', ctx.req.url)
  ctx.body = { success: true }
})
app.use(restRouter.routes()).use(restRouter.allowedMethods())

// ======================下面是实现webdav代理的业务==============================

// 可能是302跳转过来的下载的,/redirect/key?decode=0
webdavRouter.all('/redirect/:key', async (ctx) => {
  const request = ctx.req
  const response = ctx.res
  // 这里还是要encodeURIComponent ，因为http服务器会自动对url进行decodeURIComponent
  const data = await levelDB.getValue(ctx.params.key)
  if (data === null) {
    ctx.body = 'no found'
    return
  }
  const { webdavConfig, redirectUrl } = data
  console.log('@@redirect_url: ', request.url, redirectUrl)
  // 设置请求地址和是否要解密
  const flowEnc = new FlowEnc(webdavConfig.flowPassword)
  request.urlAddr = decodeURIComponent(redirectUrl)
  const decodeTransform = ctx.query.decode ? flowEnc.decodeTransform() : null
  delete request.headers.host
  // 请求实际服务资源
  await httpClient(request, response, null, decodeTransform)
  console.log('----finish 302---', ctx.query.decode, request.urlAddr)
})

// 创建middleware，闭包方式
function proxyInit(webdavConfig) {
  const { serverHost, serverPort, flowPassword, encPath } = webdavConfig
  const flowEnc = new FlowEnc(flowPassword)
  // let authorization = null
  return async (ctx, next) => {
    const request = ctx.req
    const response = ctx.res
    // request.headers.authorization = request.headers.authorization ? authorization = request.headers.authorization : authorization
    request.headers.host = serverHost + ':' + serverPort
    request.urlAddr = `http://${request.headers.host}${request.url}`
    request.webdavConfig = webdavConfig
    const { method, headers, urlAddr } = request
    console.log('@@request_info: ', method, urlAddr, headers)
    // 如果是上传文件，那么进行流加密
    if (request.method.toLocaleUpperCase() === 'PUT' && pathExec(encPath, request.url)) {
      await httpClient(request, response, flowEnc.encodeTransform())
      return
    }
    await httpClient(request, response)
  }
}
// 初始化webdav路由
webdavServer.forEach((webdavConfig) => {
  if (webdavConfig.enable) {
    webdavRouter.all(new RegExp(webdavConfig.path), proxyInit(webdavConfig))
  }
})
// 初始化alist的路由
webdavRouter.all(new RegExp(alistServer.path), proxyInit(alistServer))

// 这个是代理webdav的路由控制
app.use(webdavRouter.routes()).use(webdavRouter.allowedMethods())

// 兜底处理
app.use(async (ctx) => {
  console.log('------404------', ctx.req.url)
  ctx.body = { success: true }
})

const server = http.createServer(app.callback())
server.maxConnections = 1000
const port = 5344
server.listen(port, () => console.log('服务启动成功: ' + port))
setInterval(() => {
  console.log('server_connections', server._connections)
}, 5000)
