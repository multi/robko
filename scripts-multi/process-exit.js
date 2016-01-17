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

var restart = function (robot) {
  robot.shutdown()
  exec('(sleep 1 && touch .touch-to-restart) &')
  process.exit(0)
}

module.exports = function (robot) {

  robot.respond(/process exit$/i, function (msg) {
    if (!robot.auth.isAdmin(msg.envelope.user)) {
      msg.send('sorry, only admins can do that.')
      return
    }

    if (robot.events.listenerCount('env:test')) {
      robot.emit('env:test', function(err) {
        if (err) {
          msg.send('environment file has errors. you better fix them! (hint: @robko env list)')
          return
        }

        restart(robot)
      })
    }
    else {
      restart(robot)
    }
  })

}
