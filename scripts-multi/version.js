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

  robot.respond(/version/i, function (msg) {
    msg.send(
      [
        '> running version *',
        package.version,
        '* _(powered by Hubot ',
        robot.version,
        ') *[',
        package.repository.url,
        ']*_'
      ].join('')
    )
  })

}
