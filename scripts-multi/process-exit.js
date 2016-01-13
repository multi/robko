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

module.exports = function (robot) {

  robot.respond(/process exit/i, function (msg) {
    msg.send('process will exit in ~5 seconds and restart in ~5 seconds')
    setTimeout(function () {
      exec('(sleep 5 && touch .touch-to-restart) &')
      process.exit(0)
    }, 5000)
  })

}
