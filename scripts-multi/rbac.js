// Description:
//   role-based access control script
//   allow or reject command based on user role
//
// Dependencies:
//   hubot-auth
//   async
//
// Configuration:
//   None
//
// Commands:
//   hubot require role <role-name> for command <*command*>
//   hubot don't require role <role-name> for command <*command*>
//   hubot list access restrictions
//
// Author:
//   multi

var remove = require('lodash/remove')
var async = require('async')

// robot.brain.data._acl: [{cmd, re, roles}]

module.exports = function (robot) {

  if (!robot.brain.data._acl) {
    robot.brain.data._acl = []
  }

  robot.listenerMiddleware(function (context, next, done) {
    if (context.response.robot.auth.isAdmin(context.response.message.user)) {
      next()
      return
    }

    var textToTest = context.response.message.text
      .replace(robot.name + ' ', '')

    async.some(robot.brain.data._acl, function (rule, cb) {
      if (rule.re.test(textToTest)) {
        var hasRole = rule.roles.find(function (role) {
          return (
            context.response.message.user.roles
            && context.response.message.user.roles.length > 0
            && context.indexOf(role) !== -1
          )
        })

        cb(!hasRole)
      } else {
        cb(false)
      }
    }, function (accessDenied) {
      if (accessDenied) {
        context.response.reply('sorry. you don\'t have access to this command.')
        done()
      } else {
        next()
      }
    })
  })

  robot.respond(/require role (.*) for command (.*)$/i, function (msg) {
    if (!robot.auth.isAdmin(msg.message.user)) {
      msg.send('sorry, only admins can do that.')
      return
    }

    var role = msg.match[1].trim().toLowerCase()
    var cmd = msg.match[2].trim().toLowerCase()
    var cmdRe = new RegExp(
      cmd.replace('*', '.*'),
      'i'
    )
    var rules = robot.brain.data._acl.find(function (rule) {
      return rule.cmd === cmd
    })
    if (!rules) {
      rules = {
        cmd: cmd,
        re: cmdRe,
        roles: [],
      }
      robot.brain.data._acl.push(rules)
    }
    if (rules.roles.indexOf(role) !== -1) return
    rules.roles.push(role)

    msg.send('ok. restricted access to command <`' + cmd + '`> allowed to role(s): *' + rules.roles.join('*, *') + '*')
  })

  robot.respond(/don't require role (.*) for command (.*)$/i, function (msg) {
    if (!robot.auth.isAdmin(msg.message.user)) {
      msg.send('sorry, only admins can do that.')
      return
    }

    var role = msg.match[1].trim().toLowerCase()
    var cmd = msg.match[2].trim().toLowerCase()
    var cmdRe = new RegExp(
      cmd.replace('*', '.*'),
      'i'
    )
    var rules = robot.brain.data._acl.find(function (rule) {
      return rule.cmd === cmd
    })
    if (!rules) return
    var index = rules.roles.indexOf(role)
    if (index === -1) return
    rules.roles.splice(index, 1)
    if (rules.roles.length === 0) {
      robot.brain.data._acl.splice(robot.brain.data._acl.indexOf(rules), 1)
    }

    msg.send('ok. removed restrictions from role ' + role + ' for command <`' + cmd + '`>')
  })

  robot.respond(/list access restrictions/i, function (msg) {
    if (!robot.auth.isAdmin(msg.message.user)) {
      msg.send('sorry, only admins can do that.')
      return
    }

    if (robot.brain.data._acl.length === 0) {
      msg.send('no access restrictions.')
      return
    }

    msg.send('access restrictions:\n' + robot.brain.data._acl.map(function (rule) { return '`' + rule.cmd + '`: *' + rule.roles.join('*, *') + '*' }).join('\n'))
  })
}
