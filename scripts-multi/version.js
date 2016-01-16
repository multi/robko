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
//   hubot version - prints package.json#version
//
// Author:
//   multi

var package = require('../package')

module.exports = function (robot) {

  robot.respond(/version$/i, function (msg) {
    msg.send(
      [
        '> _running version_ *',
        package.version,
        '* _(powered by Hubot ',
        robot.version,
        ')_ *[',
        package.repository.url,
        ']*'
      ].join('')
    )
  })

}
