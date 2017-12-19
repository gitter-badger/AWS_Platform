// 系统配置参数
const config = require('config')
// 路由相关
const Router = require('koa-router')
const router = new Router()
// const PassThrough = require('stream').PassThrough

router.get('/socket/balance', async function (ctx, next) {
    const content = Date.now()

    // ctx.req.on('close', ctx.res.end())
    // ctx.req.on('finish', ctx.res.end())
    // ctx.req.on('error', ctx.res.end())

    ctx.type = 'text/event-stream'
    ctx.set('Cache-Control', 'no-cache')
    ctx.set('Connection', 'keep-alive')
    // ctx.set('Transfer-Encoding', 'chunked')
    const stream = new PassThrough()
    setInterval(function () {
        console.info(`data:${content}\n\n`)
        stream.write(`data:${content}\n\n`)
    }, 1000)
    ctx.body = stream
})

module.exports = router