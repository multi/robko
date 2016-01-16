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

  robot.respond(/sys (.*)/i, function (msg) {
    switch (msg.match[1]) {
      case 'info':
        execCmd('test -f /etc/profile.d/motd.sh && /etc/profile.d/motd.sh', msg)
      break
    }
  })

}
