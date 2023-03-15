import http from 'http';
import url from 'url';
import https from 'node:https';
const Agent = http.Agent;
const Agents = https.Agent;

// 连接数无所谓多少了
const maxSockets = 50;
const httpsAgent = new Agents({ maxSockets, maxFreeSockets: maxSockets, keepAlive: true })
const httpAgent = new Agent({ maxSockets, maxFreeSockets: maxSockets, keepAlive: true })

const webdavServerHost = '192.168.8.240'
const webdavServerPort = 5244
let authorization = null

// http客户端请求
function httpClient(request, response) {
	const { method, headers, urlAddr, reqBody } = request;
	console.log('request_info: ', headers, method, urlAddr)
	// 创建请求
	const options = {
		method,
		headers,
		agent:  ~urlAddr.indexOf("https") > 0 ? httpsAgent : httpAgent,
	};
	const httpRequest = ~urlAddr.indexOf("https") > 0 ? https : http;
	// 处理重定向的请求，让下载的流量经过代理服务器
	let webdavReq = httpRequest.request(urlAddr, options, webdavResp => {
		console.log('@@statusCode', webdavResp.statusCode, webdavResp.headers)
		response.statusCode = webdavResp.statusCode
		for (let key in webdavResp.headers) {
			response.setHeader(key, webdavResp.headers[key])
		}
		// 如果不用加密那么就直接pipe
		if (request.url === '/dav/not/encode') {
			// 这个pipe很方便
			webdavResp.pipe(response);
			return
		}
		if (response.statusCode === 302 || response.statusCode === 301) {
			// 重新跑一次
			console.log('302 tiaozhuan')
			request.url = webdavResp.headers.location
			// 这里ndoejs版本问题的https报错了，TODO
			// return httpClient(request, response)
		}
		webdavResp.on('data', (chunk) => {
			// 可以在这里添加条件判断进行加解密 TODO
			response.write(chunk)
		}).on('end', () => {
			console.log('webdavResp响应结束...')
			response.end()
		});
	})
	// 如果是普通请求就可以直接使用，如果是上传文件，就不能使用这方式
	if (reqBody !== undefined) {
		webdavReq.write(reqBody);
		webdavReq.end();
	}
	return webdavReq;
}

// 创建一个 HTTP 代理服务器
const proxy = http.createServer((req, res) => {
	
});
// 监听请求，实时处理透传数据到下游webdav
proxy.on('request', (request, response) => {

	// 缓存起来，很多客户端并不是每次都会携带 authorization，导致上传文件一些异常，不想catch了，直接每次携带 authorization
	request.headers.authorization = request.headers.authorization ? authorization = request.headers.authorization : authorization
	// headers 所有都透传，不删除，host需要单独修改，实测没影响
	request.headers.host = webdavServerHost + ':' + webdavServerPort
	request.urlAddr = `http://${request.headers.host}` + request.url
	// 如果是上传文件，那么进行流实时上传
	if (request.method === 'PUT' || request.method === 'put' ) {
		const webdavReq = httpClient(request, response)
		// 这里就进行文件上次，可以进行加解密 TODO
		request.on('data', (chunk) => {
			webdavReq.write(chunk);
		}).on('end', () => {
			webdavReq.end();
			console.log('客户端上传文件完成');
		});
		return
	}
	// 下面的方式为了httpClient遇到302，可以继续请求，并且把reqBody继续请求
	let result = '';
	request.on('data', (chunk) => {
		result += chunk;
	}).on('end', () => {
		request.reqBody = result
		httpClient(request, response)
		console.log(`@客户端请求内容：`, result.length);
	});
});

// 代理服务器正在运行
const port = 5244
proxy.listen(port, () => {
	console.log(' webdav proxy start ', port)
});
