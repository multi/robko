# Description
#   Assign roles to users and restrict command access in other scripts.
#
# Configuration:
#   HUBOT_AUTH_ADMIN - A comma separate list of user IDs
#
# Commands:
#   hubot assign role <role> to <user> - Assigns a role to a user
#   hubot remove role <role> from <user> - Removes a role from a user
#   hubot what roles does <user> have - Find out what roles a user has
#   hubot what roles do I have - Find out what roles you have
#   hubot who has <role> role - Find out who has the given role
#
# Notes:
#   * Call the method: robot.auth.hasRole(msg.envelope.user,'<role>')
#   * returns bool true or false
#
#   * the 'admin' role can only be assigned through the environment variable
#   * roles are all transformed to lower case
#
#   * The script assumes that user IDs will be unique on the service end as to
#     correctly identify a user. Names were insecure as a user could impersonate
#     a user
#
# Author:
#   alexwilliamsca, tombell, multi

config =
  admin_list: process.env.HUBOT_AUTH_ADMIN

module.exports = (robot) ->

  unless config.admin_list?
    robot.logger.warning 'The HUBOT_AUTH_ADMIN environment variable not set'

  if config.admin_list?
    admins = config.admin_list.split ','
  else
    admins = []

  class Auth
    isAdmin: (user) ->
      user.id.toString() in admins

    hasRole: (user, roles) ->
      userRoles = @userRoles(user)
      if userRoles?
        roles = [roles] if typeof roles is 'string'
        for role in roles
          return true if role in userRoles
      return false

    usersWithRole: (role) ->
      users = []
      for own key, user of robot.brain.data.users
        if @hasRole(user, role)
          users.push(user.name)
      users

    userRoles: (user) ->
      roles = []
      if user? and robot.auth.isAdmin user
        roles.push('admin')
      if user.roles?
        roles = roles.concat user.roles
      roles

  robot.auth = new Auth

  robot.respond /assign role ([\w:\-]+) to @?(.+)$/i, (msg) ->
    unless robot.auth.isAdmin msg.message.user
      msg.reply "Sorry, only admins can assign roles."
    else
      name = msg.match[2].trim()
      if name.toLowerCase() is 'i' then name = msg.message.user.name
      newRole = msg.match[1].trim().toLowerCase()

      unless name.toLowerCase() in ['', 'who', 'what', 'where', 'when', 'why']
        user = robot.brain.userForName(name)
        return msg.reply "#{name} does not exist" unless user?
        user.roles or= []

        if newRole in user.roles
          msg.reply "#{name} already has the '#{newRole}' role."
        else
          if newRole is 'admin'
            msg.reply "Sorry, the 'admin' role can only be defined in the HUBOT_AUTH_ADMIN env variable."
          else
            myRoles = msg.message.user.roles or []
            user.roles.push(newRole)
            msg.reply "OK, #{name} has the '#{newRole}' role."

  robot.respond /remove role ([\w:\-]+) from @?(.+)$/i, (msg) ->
    unless robot.auth.isAdmin msg.message.user
      msg.reply "Sorry, only admins can remove roles."
    else
      name = msg.match[2].trim()
      if name.toLowerCase() is 'i' then name = msg.message.user.name
      newRole = msg.match[1].trim().toLowerCase()

      unless name.toLowerCase() in ['', 'who', 'what', 'where', 'when', 'why']
        user = robot.brain.userForName(name)
        return msg.reply "#{name} does not exist" unless user?
        user.roles or= []

        if newRole is 'admin'
          msg.reply "Sorry, the 'admin' role can only be removed from the HUBOT_AUTH_ADMIN env variable."
        else
          myRoles = msg.message.user.roles or []
          user.roles = (role for role in user.roles when role isnt newRole)
          msg.reply "OK, #{name} doesn't have the '#{newRole}' role."

  robot.respond /what roles? do(es)? @?(.+) have\?*$/i, (msg) ->
    name = msg.match[2].trim()
    if name.toLowerCase() is 'i' then name = msg.message.user.name
    user = robot.brain.userForName(name)
    return msg.reply "#{name} does not exist" unless user?
    userRoles = robot.auth.userRoles(user)

    if userRoles.length == 0
      msg.reply "#{name} has no roles."
    else
      msg.reply "#{name} has the following roles: #{userRoles.join(', ')}."

  robot.respond /who has ([\w:\-]+) role\?*$/i, (msg) ->
    role = msg.match[1]
    userNames = robot.auth.usersWithRole(role) if role?

    if userNames.length > 0
      msg.reply "The following people have the '#{role}' role: #{userNames.join(', ')}"
    else
      msg.reply "There are no people that have the '#{role}' role."
