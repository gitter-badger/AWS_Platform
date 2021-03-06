import { ResOK, ResErr, Codes, JSONParser, Model, SeatTypeEnum, RoleCodeEnum, BizErr } from './lib/all'

// import { FetchCheck } from './model/FetchCheck'
import { UserModel } from './model/UserModel'
import NodeBatis from 'nodebatis'
const redis = require('redis')

/**
 * 获取用户
 */
const fetchuser = async (e, c, cb) => {
    try {
        // 入参转换
        const [jsonParseErr, inparam] = JSONParser(e && e.body)
        // 检查参数是否合法
        // const [checkAttError, errorParams] = new FetchCheck().checkFetchUser(inparam)
        // 获取令牌，只有管理员有权限
        // const [tokenErr, token] = await Model.currentRoleToken(e, RoleCodeEnum['PlatformAdmin'])

        // 业务操作
        const [err, ret] = await new UserModel().fetch(inparam)
        // 操作日志记录
        // inparam.operateAction = '获取平台用户信息'
        // inparam.operateToken = token
        // new LogModel().addOperate(inparam, addInfoErr, addRet)
        // 返回结果
        if (err) { return ResErr(cb, err) }
        return ResOK(cb, { payload: ret })
    } catch (error) {
        console.error(error)
        return ResErr(cb, error)
    }
}

/**
 * 测试mysql数据库连接
 */
const testmysql = async (e, c, cb) => {
    try {
        let start = new Date().getTime()
        // const nodebatis = new NodeBatis('./batis', {
        //     debug: true,
        //     dialect: 'mysql',
        //     port: 3306,
        //     database: 'na_gameplaza',
        //     host: process.env.RDS_HOST,
        //     user: process.env.RDS_USERNAME,
        //     password: process.env.RDS_PASSWORD
        // })

        // let ret = await nodebatis.query('test.findTest', {
        // })
        let end = new Date().getTime()
        console.info('用时' + (end - start) + '毫秒')
        return ResOK(cb, { payload: 'OK' })
    } catch (error) {
        console.error(error)
        return ResErr(cb, error)
    }
}

/**
 * 测试redis数据库连接
 */
const testredis = async (e, c, cb) => {
    try {
        let start = new Date().getTime()
        const redisClient = redis.createClient({ url: 'redis://redis-19126.c1.ap-southeast-1-1.ec2.cloud.redislabs.com:19126' })
        redisClient.set('REDIS_TEST', 'REDIS存储测试', (err) => {
            if (err) throw err
            redisClient.get('REDIS_TEST', (err, value) => {
                let end = new Date().getTime()
                console.info('用时' + (end - start) + '毫秒')
                ResOK(cb, { payload: value })
                redisClient.quit()
            })
        })
    } catch (error) {
        console.error(error)
        return ResErr(cb, error)
    }
}

// ==================== 以下为内部方法 ====================

export {
    testmysql,
    testredis,
    fetchuser   // 获取平台用户
}