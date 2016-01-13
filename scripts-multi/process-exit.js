// Description:
//   exit hubot process
//
// Dependencies:
//   None
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
  msg.send('process will exit & restart in 5 seconds...')
  setTimeout(function () {
    restarting = false
    exec('(sleep 5 && touch .touch-to-restart) &')
    process.exit(0)
  }, 5000)
}

module.exports = function (robot) {

  robot.respond(/process exit/i, function (msg) {
    if (robot.events.listenerCount('env:test')) {
      robot.emit('env:test', function(err) {
        if (err) {
          msg.send('environment file has errors. you better fix them! (hint: @robko env test)')
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
