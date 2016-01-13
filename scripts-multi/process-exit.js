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
    msg.send('OK. Bye bye ...')
    exec('(sleep 5 && touch .touch-to-restart) &')
    process.exit(0)
  })

}
