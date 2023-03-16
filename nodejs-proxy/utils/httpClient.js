import http from 'http';
import FlowEnc from './flowEnc.js';
import https from 'node:https';
const Agent = http.Agent;
const Agents = https.Agent;
const flowEnc = new FlowEnc("123456")

// 连接数无所谓多少了
const maxSockets = 50;
const httpsAgent = new Agents({ maxSockets, maxFreeSockets: maxSockets, keepAlive: true })
const httpAgent = new Agent({ maxSockets, maxFreeSockets: maxSockets, keepAlive: true })

async function httpClient(request, response, callback, redirect = 3) {
    const { method, headers, urlAddr } = request;
    console.log('request_info: ', headers, method, urlAddr)
    // 创建请求
    const options = {
        method,
        headers,
        agent: ~urlAddr.indexOf("https") ? httpsAgent : httpAgent,
        rejectUnauthorized: false,
    };
    const httpRequest = ~urlAddr.indexOf("https") ? https : http;
    return new Promise((resolve, reject) => {
        // 处理重定向的请求，让下载的流量经过代理服务器
        const httpReq = httpRequest.request(urlAddr, options, async httpResp => {
            console.log('@@statusCode', httpResp.statusCode, httpResp.headers)
            response.statusCode = httpResp.statusCode
            for (let key in httpResp.headers) {
                response.setHeader(key, httpResp.headers[key])
            }
            if (response.statusCode === 302 || response.statusCode === 301) {
                if (redirect <= 0) {
                    // 防止无限重定向, 结束重定向
                    console.log('httpResp结束重定向...')
                    response.end()
                    resolve(0)
                    return
                }
                // 重新请求一次，把流量代理进来
                request.urlAddr = httpResp.headers.location
                delete request.headers.host
                delete request.headers.authorization
                request.method = 'GET'
                console.log('302 redirect: ', request.urlAddr)
                const length = await httpClient(request, response, (req) => { req.end() }, redirect - 1)
                resolve(length)
            }
            let resLength = 0;
            httpResp.on('data', (chunk) => {
                resLength += chunk.length
            }).on('end', () => {
                resolve(resLength)
                console.log('httpResp响应结束...', resLength, request.url)
            });
            // 这里简单如果是https那说明是请求云盘资源，还有识别header来判断是否下载请求 TODO
            if (~urlAddr.indexOf("https")) {
                // 可以在这里添加条件判断进行加解密
                httpResp.pipe(flowEnc.decodeTransform()).pipe(response);
                return
            }
            // 直接透传
            httpResp.pipe(response)
        })
        callback(httpReq)
    })
}
export default httpClient