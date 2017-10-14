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

function deploy(path, servername) {
    console.log('进入目录：' + path)
    var commands = [
        'cd ' + path,
        'git pull',
    ].join(' && ')
    console.log('开始自动构建...')
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
