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

module.exports = function (robot) {

  robot.respond(/process exit/i, function (msg) {
    if (restarting) return
    restarting = true
    msg.send('process will exit and restart in 5 seconds...')
    setTimeout(function () {
      restarting = false
      exec('(sleep 5 && touch .touch-to-restart) &')
      process.exit(0)
    }, 5000)
  })

}
