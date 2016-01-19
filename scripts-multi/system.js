// Description:
//   print system related information
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot sys info - /etc/profile.d/motd.sh
//   hubot sys public key - prints robot public key
//
// Notes:
//   example
//   $ cat /etc/profile.d/motd.sh
//   #!/bin/sh
//   uname -sorm
//   echo $(/usr/bin/df -h | grep -E "boot|root|var|home|/tmp" | awk '{print $6"\t"$5}')
//   uptime | cut -d' ' -f3-
//
// Author:
//   multi

var fs = require('fs')
var exec = require('child_process').exec

var execCmd = function (cmd, msg) {
  exec(cmd, function (err, stdout, stderr) {
    if (err) {
      msg.send('stderr: ' + stderr + ' err: ' + err)
      return
    }

    msg.send('```' + stdout + '```')
  })
}

module.exports = function (robot) {

  robot.respond(/sys (.*)$/i, function (msg) {
    switch (msg.match[1]) {
      case 'info':
        execCmd('test -f /etc/profile.d/motd.sh && /etc/profile.d/motd.sh', msg)
      break
      case 'public key':
        fs.readFile(
          'keys/id_rsa.pub',
          function (err, data) {
            if (err) {
              console.error(err)
              msg.send('read error: ' + err)
              return
            }

            msg.send(
              '> ' + process.env.HUBOT_ENDPOINT + '/' + robot.name +
              '\n```' + data.toString('utf8') + '```'
            )
          }
        )
      break
    }
  })

}
