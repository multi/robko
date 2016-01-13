// Description:
//   print version from package.json
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot print version - print package.json#version
//
// Author:
//   multi

var package = require('../package')

module.exports = function (robot) {

  robot.respond(/print version/i, function (msg) {
    msg.send('/me version ' + package.version + ' (powered by Hubot v' + robot.version + ')')
  })

}
