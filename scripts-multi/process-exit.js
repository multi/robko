// Description:
//   exit hubot process
//
// Dependencies:
//   hubot-auth
//
// Configuration:
//   None
//
// Commands:
//   hubot process exit - process.exit(0) hubot
//
// Author:
//   multi

var exec = require('child_process').exec

var restarting = false

var restart = function (msg) {
  if (restarting) return
  restarting = true
  msg.send('restarting...')
  msg.robot.shutdown()
  setTimeout(function () {
    restarting = false
    exec('(sleep 2 && touch .touch-to-restart) &')
    process.exit(0)
  }, 3000)
}

module.exports = function (robot) {

  robot.respond(/process exit/i, function (msg) {
    if (!robot.auth.isAdmin(msg.message.user)) {
      msg.send('sorry, only admins can do that.')
      return
    }

    if (robot.events.listenerCount('env:test')) {
      robot.emit('env:test', function(err) {
        if (err) {
          msg.send('environment file has errors. you better fix them! (hint: @robko env list)')
          return
        }

        restart(msg)
      })
    }
    else {
      restart(msg)
    }
  })

}
