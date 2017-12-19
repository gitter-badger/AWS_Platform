// 系统配置参数
const config = require('config')
// 路由相关
const Router = require('koa-router')
const router = new Router()
// 工具相关
const _ = require('lodash')
const axios = require('axios')
const crypto = require('crypto')
const parseString = require('xml2js').parseString
// 日志相关
const log = require('tracer').colorConsole({ level: config.log.level })
// 持久层相关
const DefaultMixRateEnum = require('./lib/Consts')
const PlayerModel = require('./model/PlayerModel')
const redis = require('redis')
const redisClient = redis.createClient({ url: 'redis://redis-19126.c1.ap-southeast-1-1.ec2.cloud.redislabs.com:19126' })
/**
 * 获取玩家TOKEN
 */
router.get('/api/ttgtoken/:username', async function (ctx, next) {
    // 查询玩家
    const player = await new PlayerModel().getPlayer(ctx.params.username)
    if (_.isEmpty(player)) {
        ctx.body = '玩家不存在'
    } else {
        // 更新玩家洗码比和抽成比
        new PlayerModel().updateMixAndRate(player)
        // 从TTG获取玩家TOKEN
        const res = await axios.post(config.ttg.tokenurl + ctx.params.username, '<logindetail><player account="CNY" country="CN" firstName="" lastName="" userName="" nickName="" tester="1" partnerId="NA" commonWallet="1" /><partners><partner partnerId="zero" partnerType="0" /><partner partnerId="NA" partnerType="1" /></partners></logindetail>', {
            headers: { 'Content-Type': 'application/xml' }
        })
        parseString(res.data, function (err, result) {
            console.info(result)
        })
        ctx.body = res.data
    }
})
/**
 * 查询余额
 */
router.post('/api/balance', async function (ctx, next) {
    const player = await new PlayerModel().getPlayer(ctx.request.body.cw.$.acctid)
    if (_.isEmpty(player)) {
        ctx.body = '<cw type="getBalanceResp" err="1000" />'
    } else {
        await cacheSet(ctx.request.body.cw.$.acctid, player.balance.toString())
        ctx.body = '<cw type="getBalanceResp" cur="CNY" amt="' + player.balance + '" err="0" />'
    }
})
/**
 * 接受流水
 */
router.post('/api/fund', async function (ctx, next) {
    // 1、查询玩家
    const player = await new PlayerModel().getPlayer(ctx.request.body.cw.$.acctid)
    if (_.isEmpty(player)) {
        ctx.body = '<cw type="getBalanceResp" err="1000" />'
    } else {
        player.liveMix = player.liveMix || DefaultMixRateEnum.liveMix
        player.vedioMix = player.vedioMix || DefaultMixRateEnum.vedioMix
        player.rate = player.rate || DefaultMixRateEnum.rate
    }
    // 2、计算玩家实时余额和更新
    // const amtBefore = player.balanceCache
    const amtBefore = await cacheGet(ctx.request.body.cw.$.acctid)
    const amtAfter = (parseFloat(amtBefore) + parseFloat(ctx.request.body.cw.$.amt)).toFixed(2)
    // ctx.request.body.cw.$.gameType = config.ttg.gameType
    // await new PlayerModel().updateBalanceCache(player, ctx.request.body.cw.$, amtAfter)

    await cacheSet(ctx.request.body.cw.$.acctid, amtAfter.toString())
    // 3、返回实时余额
    ctx.body = '<cw type="fundTransferResp" cur="CNY" amt="' + amtAfter + '" err="0" />'
})
/**
 * 玩家登出
 */
router.get('/api/ttglogout/:gameId/:userId/:token', async function (ctx, next) {
    const data = {
        gameId: ctx.params.gameId,
        userId: ctx.params.userId,
        timestamp: Date.now(),
        exit: 1,
        records: [],
        zlib: 1
    }
    const sign = getSign('gameKey', ['gameId', 'timestamp', 'records'], data)
    data.sign = sign
    // 登出NA平台
    // const res = await axios.post(config.na.settlementurl, data)
    // if (res.data.code == 0) {
    // 登出TTG
    const res = await axios.delete(config.ttg.tokenurl + ctx.params.token)
    ctx.body = { code: 0, msg: '退出成功' }
    // } else {
    //     ctx.body = { code: -1, msg: '退出失败，请重试' }
    // }
})

// 数据签名
function getSign(secret, args, msg) {
    var paramArgs = [];
    if (args instanceof Array) {
        paramArgs = args;
    } else {
        for (var key in args) {
            paramArgs.push(key);
        }
    }
    var signValue = '';
    var paramNameAndValueArray = [];
    for (var i = 0, l = paramArgs.length; i < l; i++) {
        var msgValue = msg[paramArgs[i]];
        paramNameAndValueArray[i] = paramArgs[i] + msgValue;
    }
    paramNameAndValueArray.sort();
    for (var i = 0, l = paramNameAndValueArray.length; i < l; i++) {
        signValue += paramNameAndValueArray[i];
    }
    //首尾加上秘钥
    signValue = encodeURIComponent(signValue);
    signValue = secret + signValue + secret;
    signValue = crypto.createHash('sha256').update(signValue).digest('hex');
    return signValue;
}

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