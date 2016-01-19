// Description:
//   lists express routes
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot express routes - lists express routes
//
// Author:
//   multi

module.exports = function (robot) {

  robot.respond('/express routes$/i', function (msg) {
    if (!robot.router || !robot.router._router || !robot.router._router.stack) {
      return
    }

    var output = ''

    robot.router._router.stack.forEach(function (stack) {
      if (stack.route) {
        var route = stack.route,
          methodsDone= {}

        route.stack.forEach(function (r) {
          var method = r.method ? r.method.toUpperCase() : null
          if (!methodsDone[method] && method) {
            output += method + '\t' + route.path + '\n'
            methodsDone[method] = true
          }
        })
      }
    })

    if (!output) {
      msg.send('No routes defined.')
    }
    else {
      msg.send(
        '> ' + process.env.HUBOT_ENDPOINT + '/' + robot.name +
        '\n```' + output + '```'
      )
    }
  })

}
