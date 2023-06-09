// 会当做Md5的salt，当前预留配置
export const userPasswd = '123456'

// 全局代理alist，包括它的webdav和http服务，要配置上
export const alistServer = {
  path: '/*', // 默认就是代理全部，不建议修改这里
  serverHost: '192.168.8.240',
  serverPort: 5244,
  flowPassword: '123456', // 加密的密码
  encPath: ['/aliy/test/*', '/aliy/test/*', '/tianyi/*'], // 注意不需要添加/dav 前缀了，程序会自己处理alist的逻辑，支持js正则，不能是 "/*" 和 "/proxy/*"，因为已经占用
}

// 支持其他普通的webdav（当然也可以挂载alist的webdav）
export const webdavServer = [
  {
    name: 'aliyun',
    path: '/dav/*', // 代理全部路径，不能是"/proxy/*"，系统已占用。如果设置 "/*"，那么上面的alist的配置就不会生效哦
    enable: false, // 是否启动代理
    serverHost: '192.168.8.234',
    serverPort: 5244,
    flowPassword: '123456', // 加密的密码
    encPath: ['/dav/aliyun/*', '/dav/189cloud/*'], // 要加密的目录，支持js正则，不能是 "/*" 和 "/proxy/*"，因为已经占用
  },
]
