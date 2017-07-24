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

var os = require('os')
var package = require('../package')

module.exports = function (robot) {

  robot.respond(/version$/i, function (msg) {
    msg.send(
      [
        '>My version is *',
        package.version,
        '* and I\'m powered by *Hubot ',
        robot.version,
        ' @ ',
        process.title,
        ' ',
        process.version,
        '* [_',
        os.type(),
        ' ',
        os.release(),
        ' ',
        os.arch(),
        '_]',
        '\n',
        '_You can find my source code *<',
        package.repository.url,
        '|here>*_',
      ].join('')
    )
  })

}
