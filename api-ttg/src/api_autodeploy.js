// 路由相关
const Router = require('koa-router')
const router = new Router()
// 构建相关
const exec = require('child_process').exec
// 日志相关
const config = require('config')
const log = require('tracer').colorConsole({ level: config.log.level })

router.post('/deploy/na', async function (ctx, next) {
    try {
        log.info('接受到请求，准备持续构建 ...')
        await gitPull('/usr/dev/NA/')
        deployAdmin()
        deployAgent()
        deployOther()
        ctx.body = 'Y'
    } catch (error) {
        log.error('自动构建发生错误异常：')
        log.error(error)
        ctx.body = 'N'
    }
})
function gitPull(path) {
    return new Promise((reslove, reject) => {
        log.info('进入目录：' + path)
        const commands = [
            'cd ' + path,
            'git pull',
        ].join(' && ')
        log.info('开始执行 git pull ...')
        exec(commands, function (error, stdout, stderr) {
            if (error) {
                console.error(`exec error: ${error}`)
                reject(error)
            }
            if (stdout) {
                log.info(`stdout: ${stdout}`)
            }
            if (stderr) {
                log.error(`stderr: ${stderr}`)
            }
            reslove(stdout)
        })
    })
}
function deployAdmin() {
    return new Promise((reslove, reject) => {
        const commands = [
            'cd /usr/dev/NA/rotta-admin',
            'npm run test-admin',
            'cd dist',
            '/usr/local/bin/aws s3 rm s3://sys-test-admin/*',
            '/usr/local/bin/aws s3 sync . s3://sys-test-admin --acl public-read --delete',

            'cd /usr/dev/NA/rotta-admin',
            'npm run test-merchant',
            'cd dist',
            '/usr/local/bin/aws s3 rm s3://sys-test-merchant/*',
            '/usr/local/bin/aws s3 sync . s3://sys-test-merchant --acl public-read --delete',

            'cd /usr/dev/NA/rotta-admin',
            'npm run test-manager',
            'cd dist',
            '/usr/local/bin/aws s3 rm s3://sys-test-manager/*',
            '/usr/local/bin/aws s3 sync . s3://sys-test-manager --acl public-read --delete',
        ].join(' && ')
        log.info('开始自动构建平台管理员系统 ...')
        exec(commands, function (error, stdout, stderr) {
            if (error) {
                console.error(`exec error: ${error}`)
                reject(error)
            }
            if (stdout) {
                log.info(`stdout: ${stdout}`)
            }
            if (stderr) {
                log.error(`stderr: ${stderr}`)
            }
            reslove(stdout)
        })
    })
}

function deployAgent() {
    return new Promise((reslove, reject) => {
        const commands = [
            'cd /usr/dev/NA/rotta-agent',
            'npm run test',
            'cd dist',
            '/usr/local/bin/aws s3 rm s3://sys-test-agent/*',
            '/usr/local/bin/aws s3 sync . s3://sys-test-agent --acl public-read --delete',
        ].join(' && ')
        log.info('开始自动构建代理系统 ...')
        exec(commands, function (error, stdout, stderr) {
            if (error) {
                console.error(`exec error: ${error}`)
                reject(error)
            }
            if (stdout) {
                log.info(`stdout: ${stdout}`)
            }
            if (stderr) {
                log.error(`stderr: ${stderr}`)
            }
            reslove(stdout)
        })
    })
}

function deployOther() {
    return new Promise((reslove, reject) => {
        const commands = [
            'cd /usr/dev/NA/rotta-game',
            'npm run test',
            'cd dist',
            '/usr/local/bin/aws s3 rm s3://sys-test-game/*',
            '/usr/local/bin/aws s3 sync . s3://sys-test-game --acl public-read --delete',
        ].join(' && ')
        log.info('开始自动构建游戏系统 ...')
        exec(commands, function (error, stdout, stderr) {
            if (error) {
                console.error(`exec error: ${error}`)
                reject(error)
            }
            if (stdout) {
                log.info(`stdout: ${stdout}`)
            }
            if (stderr) {
                log.error(`stderr: ${stderr}`)
            }
            reslove(stdout)
        })
    })
}

module.exports = router