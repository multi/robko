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

var touch = exec.bind(this, 'sleep 1 && touch package.json')

module.exports = function (robot) {

  robot.respond(/process exit/i, function (msg) {
    msg.send('OK. Bye bye ...')
    setTimeout(function () {
      touch()
      process.exit(0)
    }, 1000)
  })

  process.on('uncaughtException', function (err) {
    console.log('uncaughtException', err, err.stack)
    setTimeout(function () {
      touch()
      process.exit(1)
    }, 1000)
  })

}
