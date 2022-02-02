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
//   hubot process exit - process.exit() hubot
//
// Author:
//   multi

var exec = require('child_process').exec

var exit = function (robot) {
  setTimeout(function () {
    process.exit()
  }, 5000)
  robot.shutdown()
}

module.exports = function (robot) {

  robot.respond(/process exit$/i, function (msg) {
    if (robot.events.listenerCount('env:test')) {
      robot.emit('env:test', function(err) {
        if (err) {
          msg.send('environment file has errors. you better fix them! (hint: ' + robot.name + ' env list)')
          return
        }

        exit(robot)
      })
    }
    else {
      exit(robot)
    }
  })

}
