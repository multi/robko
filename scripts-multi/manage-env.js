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
//   hubot env add KEY=value - add (eg. hubot env add KEY=value)
//   hubot env del KEY=value - remove (eg. hubot env del KEY=value)
//
// Author:
//   multi

var fs = require('fs')
var exec = require('child_process').exec

var envFile = process.env.ENV_FILE

var testEnv = function (cb) {
  exec('source ' + envFile, cb)
}

var escapeShellStr = function(s) {
  return s.replace(/"/g, '\\"')
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

      msg.send('```' + stdout + '```')
    })
  })

  robot.respond(/env add ([A-Z_]+)=(.+)$/i, function (msg) {
    if (!msg.match[1] || !msg.match[2]) return

    var toAdd = 'export ' + escapeShellStr(msg.match[1]) + '=' + escapeShellStr(msg.match[2])

    exec('echo "' + toAdd + '" >> ' + envFile, function (err, stdout, stderr) {
      if (err) {
        msg.send('stderr: ' + stderr + ' err: ' + err)
        return
      }

      msg.send('added `' + msg.match[1] + '=' + msg.match[2] + '`')
    })
  })

  robot.respond(/env del ([A-Z_]+)=(.+)$/i, function (msg) {
    if (!msg.match[1] || !msg.match[2]) return

    var toDel = 'export ' + escapeShellStr(msg.match[1]) + '=' + escapeShellStr(msg.match[2])

    exec('grep -v "' + toDel + '" ' + envFile + ' > ' + envFile + '.tmp && mv ' + envFile + '.tmp ' + envFile, function (err, stdout, stderr) {
      if (err) {
        msg.send('stderr: ' + stderr + ' err: ' + err)
        return
      }

      msg.send('deleted `' + msg.match[1] + '=' + msg.match[2] + '`')
    })
  })

}
