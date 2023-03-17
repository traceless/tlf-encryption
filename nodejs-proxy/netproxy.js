import net from 'net'

const server = net.createServer()
// 监听connect事件
server.on('connection', (proxySocket) => {
  const serverSocket = net.connect(
    { port: 5244, host: '192.168.8.240' },
    () => {
      console.log('连接到服务器')
    }
  )
  let clientRequest = ''
  let serverResp = ''
  proxySocket.on('data', (data) => {
    clientRequest += data
    serverSocket.write(data)
    console.log('@@clientRequest:\r\n', clientRequest)
  })
  serverSocket.on('data', (data) => {
    serverResp += data
    proxySocket.write(data)
    console.log('@@serverResp:\r\n', serverResp)
  })
  // serverSocket.pipe(proxySocket)
  // proxySocket.pipe(serverSocket)
})
// 设置监听端口
server.listen(5244)

// 设置监听时的回调函数
server.on('listening', (res) => {
  console.log('server in listen...', 5244)
})
