import http from 'http';
import https from 'node:https';
import config from '../config.js';
const Agent = http.Agent;
const Agents = https.Agent;
const { flowEnc } = config

// 连接数无所谓多少了
const maxSockets = 100;
const httpsAgent = new Agents({ maxSockets, maxFreeSockets: maxSockets, keepAlive: true })
const httpAgent = new Agent({ maxSockets, maxFreeSockets: maxSockets, keepAlive: true })

async function httpClient(request, response, encodeTransform, decodeTransform) {
    const { method, headers, urlAddr } = request;
    console.log('request_info: ', method, urlAddr, headers)
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
            if (response.statusCode % 300 < 5) {
                // 解耦302的逻辑，先跳到本地服务接口，跟之前的实现有些不一样，这样解决更加彻底和透明
                const redirectUrl = encodeURIComponent(httpResp.headers.location)
                const md5 = flowEnc.md5(redirectUrl)
                // 跳转到本地服务进行重定向下载 ，简单判断是否https那说明是请求云盘资源，后续完善其他业务判断条件 TODO
                const decode = ~redirectUrl.indexOf("https")
                // 需要解密的话，就要经过本服务器代理请求
                if(decode){
                    httpResp.headers.location = `/redirect/${md5}?decode=${decode}&url=${redirectUrl}`
                }
                console.log('302 redirectUrl: ', httpResp.headers.location)
            }
            // 设置headers
            for (let key in httpResp.headers) {
                response.setHeader(key, httpResp.headers[key])
            }
            let resLength = 0;
            httpResp.on('data', (chunk) => {
                resLength += chunk.length
            }).on('end', () => {
                resolve(resLength)
                console.log('httpResp响应结束...', resLength, request.url)
            });
            // 是否需要加密
            decodeTransform ? httpResp.pipe(decodeTransform).pipe(response) : httpResp.pipe(response)
        })
        // 是否需要加密
        encodeTransform ? request.pipe(encodeTransform).pipe(httpReq) : request.pipe(httpReq)
    })
}
export default httpClient