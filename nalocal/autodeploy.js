const express = require('express')
const exec = require('child_process').exec
const app = express()

const PORT = 80
const ROOT_DIR = '/usr/dev'

app.post('/deploy/na', function (req, res) {
    //req.headers['x-gitlab-token'] == 'j9hb5ydtetfbRGQy42tNhztmJe1qSvC'
    console.log('接受到请求，准备持续构建...')
    deploy(ROOT_DIR + '/NA/')
    res.send('Y')
})

console.log('autodeploy自动部署服务启动，端口：' + PORT)
app.listen(PORT)

function deploy(path) {
    console.log('进入目录：' + path)
    var commands = [
        'cd ' + path,
        'git pull',
    ].join(' && ')
    console.log('1、开始拉取代码...')
    exec(commands, function (error, stdout, stderr) {
        if (error) {
            console.error(`exec error: ${error}`)
            return
        }
        if (stdout) {
            console.log(`stdout: ${stdout}`)
            console.log('2、开始自动构建...')
            deployProject(ROOT_DIR + '/NA/', 'rotta-admin', 'rotta-test')
            deployProject(ROOT_DIR + '/NA/', 'rotta-agent', 'rotta-test-agent')
            deployProject(ROOT_DIR + '/NA/', 'rotta-manager', 'rotta-test-manager')
            deployProject(ROOT_DIR + '/NA/', 'rotta-merchant', 'rotta-test-merchant')
            deployProject(ROOT_DIR + '/NA/', 'rotta-game', 'rotta-test-game')
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`)
        }
    })
}

function deployProject(path, projectname, bucketname) {
    console.log('进入目录：' + path + projectname)
    var commands = [
        'cd /usr/dev/NA/' + projectname,
        'npm run test',
        'cd dist',
        '/usr/local/bin/aws s3 rm s3://' + bucketname + '/*',
        '/usr/local/bin/aws s3 sync . s3://' + bucketname + ' --acl public-read --delete',
    ].join(' && ')
    console.log('开始自动构建【' + projectname + '】工程...')
    exec(commands, function (error, stdout, stderr) {
        if (error) {
            console.error(`exec error: ${error}`)
            return
        }
        if (stdout)
            console.log(`stdout: ${stdout}`)
        if (stderr)
            console.error(`stderr: ${stderr}`)
    })
}