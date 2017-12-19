const http = require('http')
const PORT = 8000
const HEAD = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive"
}

http.createServer(function (req, res) {
    if (req.url == '/socket/balance') {
        const content = Date.now()
        // 1. 设定头信息
        res.writeHead(200, HEAD)
        // 2. 输出内容，必须 "data:" 开头 "\n\n" 结尾（代表结束）
        setInterval(function () {
            res.write(`data:${content}\n\n`)
        }, 1000)
    }
}).listen(PORT)
log.info(`SOCKET-GAME服务启动【执行环境:${process.env.NODE_ENV},端口:${PORT}】`)
