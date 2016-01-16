// Description:
//   manage environment file
//
// Dependencies:
//   hubot-auth
//
// Configuration:
//   ENV_FILE - environment variables source
//
// Commands:
//   hubot env test - test for syntax errors
//   hubot env list - prints defined
//   hubot env add export KEY=value - add (eg. hubot env add KEY=value)
//   hubot env del export KEY=value - remove (eg. hubot env del KEY=value)
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
  return s.replace('"', '\\"')
}

module.exports = function (robot) {

  robot.respond(/env test/i, function (msg) {
    if (!robot.auth.isAdmin(msg.envelope.user)) {
      msg.send('sorry, only admins can do that.')
      return
    }

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
    if (!robot.auth.isAdmin(msg.envelope.user)) {
      msg.send('sorry, only admins can do that.')
      return
    }

    exec('grep -vE "^#|^$" ' + envFile, function (err, stdout, stderr) {
      if (err) {
        msg.send('stderr: ' + stderr + ' err: ' + err)
        return
      }

      msg.send('```' + stdout + '```')
    })
  })

  robot.respond(/env add export (.*)=(.*)/i, function (msg) {
    if (!msg.match[1] || !msg.match[2]) return

    if (!robot.auth.isAdmin(msg.envelope.user)) {
      msg.send('sorry, only admins can do that.')
      return
    }

    var toAdd = 'export ' + escapeShellStr(msg.match[1]) + '=' + escapeShellStr(msg.match[2])

    exec('echo "' + toAdd + '" >> ' + envFile, function (err, stdout, stderr) {
      if (err) {
        msg.send('stderr: ' + stderr + ' err: ' + err)
        return
      }

      msg.send('added `export ' + msg.match[1] + '=' + msg.match[2] + '`')
    })
  })

  robot.respond(/env del export (.*)=(.*)/i, function (msg) {
    if (!msg.match[1] || !msg.match[2]) return

    if (!robot.auth.isAdmin(msg.envelope.user)) {
      msg.send('sorry, only admins can do that.')
      return
    }

    var toDel = 'export ' + escapeShellStr(msg.match[1]) + '=' + escapeShellStr(msg.match[2])

    exec('grep -v "' + toDel + '" ' + envFile + ' > ' + envFile + '.tmp && mv ' + envFile + '.tmp ' + envFile, function (err, stdout, stderr) {
      if (err) {
        msg.send('stderr: ' + stderr + ' err: ' + err)
        return
      }

      msg.send('deleted `export ' + msg.match[1] + '=' + msg.match[2] + '`')
    })
  })

}
