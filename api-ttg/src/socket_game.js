// 系统配置参数
const config = require('config')
// 路由相关
const Router = require('koa-router')
const router = new Router()
const PassThrough = require('stream').PassThrough

router.get('/socket/balance', async function (ctx, next) {
    const stream = new PassThrough()
    const { source } = ctx.params

    setInterval(function () {
        console.info(`data:${content}\n\n`)
        stream.write(`data:${content}\n\n`)
    }, 1000)

    ctx.req.on('close', ctx.res.end())
    ctx.req.on('finish', ctx.res.end())
    ctx.req.on('error', ctx.res.end())

    ctx.type = 'text/event-stream'
    ctx.body = stream
})

const sse = (event, data) => {
    return `event:${event}\ndata: ${data}\n\n`
}