// 系统配置参数
const config = require('config')
// 路由相关
const Router = require('koa-router')
const router = new Router()
// 工具相关
const _ = require('lodash')
const axios = require('axios')
// 日志相关
const log = require('tracer').colorConsole({ level: config.log.level })
// 持久层相关
const PlayerModel = require('./model/PlayerModel')
const PlayerBillDetailModel = require('./model/PlayerBillDetailModel')
const redis = require('redis')
const redisClient = redis.createClient({ url: 'redis://redis-19126.c1.ap-southeast-1-1.ec2.cloud.redislabs.com:19126' })
// 域名相关
const ttg_token = 'https://ams-api.stg.ttms.co:8443/cip/gametoken/'

// 获取玩家TOKEN
router.get('/api/ttgtoken/:username', async function (ctx, next) {
    const url = ttg_token + ctx.params.username
    const res = await axios.post(url, '<logindetail><player account="CNY" country="CN" firstName="" lastName="" userName="" nickName="" tester="1" partnerId="NA" commonWallet="1" /><partners><partner partnerId="zero" partnerType="0" /><partner partnerId="NA" partnerType="1" /></partners></logindetail>', {
        headers: { 'Content-Type': 'application/xml' }
    })
    ctx.body = res.data
})
// 查询余额
router.post('/api/balance', async function (ctx, next) {
    const player = await new PlayerModel().getPlayer(ctx.request.body.cw.$.acctid)
    if (!_.isEmpty(player)) {
        await cacheSet(ctx.request.body.cw.$.acctid, player.balance.toString())
        ctx.body = '<cw type="getBalanceResp" cur="CNY" amt="' + player.balance + '" err="0" />'
    } else {
        ctx.body = '<cw type="getBalanceResp" err="1000" />'
    }
    // const amt = await cacheGet(ctx.request.body.cw.$.acctid)
    // ctx.body = '<cw type="getBalanceResp" cur="CNY" amt="' + amt + '" err="0" />'
})
// 接受流水
router.post('/api/fund', async function (ctx, next) {
    // 1、查询玩家sessionId，实时余额
    // 2、使用sessionId写流水和变化量写流水
    // 3、更新实时余额，返回
    const amtBefore = await cacheGet(ctx.request.body.cw.$.acctid)
    // 计算流水变化后的余额
    const amtAfter = (parseFloat(amtBefore) + parseFloat(ctx.request.body.cw.$.amt)).toFixed(2)
    await cacheSet(ctx.request.body.cw.$.acctid, amtAfter.toString())
    ctx.body = '<cw type="fundTransferResp" cur="CNY" amt="' + amtAfter + '" err="0" />'
})

function cacheGet(key) {
    return new Promise((reslove, reject) => {
        redisClient.get(key, (err, value) => {
            if (err) reject(err)
            reslove(value)
        })
    })
}
function cacheSet(key, value) {
    return new Promise((reslove, reject) => {
        redisClient.set(key, value, (err) => {
            if (err) reject(err)
            reslove(value)
        })
    })
}

module.exports = router