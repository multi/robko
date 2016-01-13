// Description:
//   manage environment file
//
// Dependencies:
//   None
//
// Configuration:
//   ENV_FILE - environment variables source
//
// Commands:
//   hubot env test - test for syntax errors
//   hubot env list - prints defined
//   hubot env add (.*)=(.*) - add (eg. hubot env add TEST=test)
//   hubot env del (.*)=(.*) - remove (eg. hubot env del TEST=test)
//
// Author:
//   multi

var fs = require('fs')
var exec = require('child_process').exec

var envFile = process.env.ENV_FILE

var testEnv = function (cb) {
  exec('source ' + envFile, cb)
}

module.exports = function (robot) {

  robot.respond(/env test/i, function (msg) {
    testEnv(function (err, stdout, stderr) {
      if (err) {
        msg.send('stderr: ' + stderr + ' err: ' + err)
        return
      }

      msg.send('looks good.')
    })
  })

  robot.on('env:test', testEnv)

  robot.respond(/env list/i, function (msg) {
    exec('grep -vE "^#|^$" ' + envFile, function (err, stdout, stderr) {
      if (err) {
        msg.send('stderr: ' + stderr + ' err: ' + err)
        return
      }

      msg.send(stdout)
    })
  })

  robot.respond(/env add (.*)=(.*)/i, function (msg) {
    if (msg.match.length < 3) return
    if (msg.match[1].indexOf('export') !== 0) return

    var toAdd = msg.match[1].replace('"', '\\"') + '=' + msg.match[2].replace('"', '\\"')

    exec('echo "' + toAdd + '" >> ' + envFile, function (err, stdout, stderr) {
      if (err) {
        msg.send('stderr: ' + stderr + ' err: ' + err)
        return
      }

      msg.send('added ' + toAdd)
    })
  })

  robot.respond(/env del (.*)=(.*)/i, function (msg) {
    if (msg.match.length < 3) return
    if (msg.match[1].indexOf('export') !== 0) return

    var toDel = msg.match[1].replace('"', '\\"') + '=' + msg.match[2].replace('"', '\\"')

    exec('grep -v "' + toDel + '" ' + envFile + ' > ' + envFile + '.tmp && mv ' + envFile + '.tmp ' + envFile, function (err, stdout, stderr) {
      if (err) {
        msg.send('stderr: ' + stderr + ' err: ' + err)
        return
      }

      msg.send('deleted ' + msg.match[1] + '=' + msg.match[2])
    })
  })

}
