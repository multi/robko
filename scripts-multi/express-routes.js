// Description:
//   lists express routes
//
// Dependencies:
//   cli-table
//
// Configuration:
//   None
//
// Commands:
//   hubot express routes - lists express routes
//
// Author:
//   multi

var Table = require('cli-table')
var stripColors = require('colors/safe').stripColors

module.exports = function (robot) {

  robot.respond('/express routes$/i', function (msg) {
    if (!robot.router || !robot.router._router || !robot.router._router.stack) {
      return
    }

    var output = []

    robot.router._router.stack.forEach(function (stack) {
      if (stack.route) {
        var route = stack.route,
          methodsDone= {}

        route.stack.forEach(function (r) {
          var method = r.method ? r.method.toUpperCase() : null
          if (!methodsDone[method] && method) {
            output.push([process.env.HUBOT_ENDPOINT + route.path, method])
            methodsDone[method] = true
          }
        })
      }
    })

    if (output.length === 0) {
      msg.send('No routes defined.')
    }
    else {
      var table = new Table({
        head: [
          'Endpoint',
          'Method',
        ]
      })

      output.forEach(function (o) {
        table.push(o)
      })

      msg.send('```' + stripColors(table.toString()) + '```')
    }
  })

}
