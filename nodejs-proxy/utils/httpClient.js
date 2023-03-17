/* eslint-disable comma-dangle */
import http from 'http'
import https from 'node:https'
import crypto from 'crypto'
import levelDB from './levelDB.js'
const Agent = http.Agent
const Agents = https.Agent

// 默认maxFreeSockets=256
const httpsAgent = new Agents({ keepAlive: true })
const httpAgent = new Agent({ keepAlive: true })

async function httpClient(request, response, encodeTransform, decodeTransform) {
  const { method, headers, urlAddr, webdavConfig } = request
  // 创建请求
  const options = {
    method,
    headers,
    agent: ~urlAddr.indexOf('https') ? httpsAgent : httpAgent,
    rejectUnauthorized: false,
  }
  const httpRequest = ~urlAddr.indexOf('https') ? https : http
  return new Promise((resolve, reject) => {
    // 处理重定向的请求，让下载的流量经过代理服务器
    const httpReq = httpRequest.request(urlAddr, options, async (httpResp) => {
      console.log('@@statusCode', httpResp.statusCode, httpResp.headers)
      response.statusCode = httpResp.statusCode
      if (response.statusCode % 300 < 5) {
        // 解耦302的逻辑，先跳到本地服务接口，跟之前的实现有些不一样，这样解决更加彻底和透明
        const redirectUrl = encodeURIComponent(httpResp.headers.location)
        const key = crypto.randomUUID()
        // 缓存起来，默认3天，足够下载和观看了
        await levelDB.putValue(key, { redirectUrl, webdavConfig }, 60 * 60 * 72)
        // 跳转到本地服务进行重定向下载 ，简单判断是否https那说明是请求云盘资源，后续完善其他业务判断条件 TODO
        const decode = ~redirectUrl.indexOf('https')
        // webdavConfig不存在的话，说明是云平台自己的跳转。否则跳到自己服务器上来，经过本服务器代理就可以解密
        if (decode && webdavConfig) {
          httpResp.headers.location = `/redirect/${key}?decode=${decode}`
        }
        console.log('302 redirectUrl: ', httpResp.headers.location)
      }
      // 设置headers
      for (const key in httpResp.headers) {
        response.setHeader(key, httpResp.headers[key])
      }
      let resLength = 0
      httpResp
        .on('data', (chunk) => {
          resLength += chunk.length
        })
        .on('end', () => {
          resolve(resLength)
          console.log('httpResp响应结束...', resLength, request.url)
        })
      // 是否需要解密
      decodeTransform
        ? httpResp.pipe(decodeTransform).pipe(response)
        : httpResp.pipe(response)
    })
    // 是否需要加密
    encodeTransform
      ? request.pipe(encodeTransform).pipe(httpReq)
      : request.pipe(httpReq)
  })
}
export default httpClient
