# Description:
#   Allows hubot to update itself using git pull and npm install.
#
# Dependencies:
#   None
#
# Configuration:
#   GIT_SSH_COMMAND="ssh -i keys/id_rsa -o VisualHostKey=yes -o PreferredAuthentications=publickey -o KbdInteractiveAuthentication=no -o PasswordAuthentication=no -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no -o IdentitiesOnly=yes"
#
# Commands:
#   hubot git pull - Performs a `git pull`
#   hubot clear node_modules - Performs a `rm -rf node_modules`
#   hubot npm install - Performs a `npm i --production --no-optional`
#   hubot npm install dev - Performs a `npm i --no-optional`
#   hubot pending update - Informs if there are pending updates (hubot needs a restart)
#
# Author:
#   benjamine
#   multi

child_process = require 'child_process'
downloaded_updates = false

updatesAvailable = (msg) ->
  msg.send "I have some pending updates, KILL ME PLEASE! (hint: #{msg.robot.name} process exit)"

env = {}

if process.env.GIT_SSH_COMMAND
  env.GIT_SSH_COMMAND = process.env.GIT_SSH_COMMAND

module.exports = (robot) ->

  robot.respond /pending updates?\??$/i, (msg) ->
    if downloaded_updates
      updatesAvailable msg
    else
      msg.send "all dependencies are up-to-date"

  robot.respond /git pull$/i, (msg) ->
    try
      msg.send "git pull..."
      child_process.exec "git pull", {env: env}, (error, stdout, stderr) ->
        if error
          msg.send "git pull failed: " + stderr
        else
          output = stdout + ''
          if not /Already up to date/.test output
            if output.length <= (robot.adapter.MAX_MESSAGE_LENGTH || 4000) - 6
              msg.send "```#{output}```"
            else
              msg.send output
            msg.send "don\'t forget to run `npm install` ;)"
          else
            msg.send "my source code is up-to-date"
    catch error
        msg.send "git pull failed: " + error

  robot.respond /npm install( dev)?$/i, (msg) ->
    try
      prod = if !msg.match[1] then '--omit=dev' else ''
      msg.send "npm install #{prod}..."
      child_process.exec "npm i #{prod} --omit=optional --legacy-peer-deps", (error, stdout, stderr) ->
        if error
          msg.send "npm install #{prod} failed: " + stderr
        else
          output = stdout + ''
          if output
            if output.length <= (robot.adapter.MAX_MESSAGE_LENGTH || 4000) - 6
              msg.send "```#{output}```"
            else
              msg.send output
            updatesAvailable msg
            downloaded_updates = true
          else
            msg.send "all dependencies are up-to-date"
    catch error
        msg.send "npm install #{prod} failed: " + error

  robot.respond /clear node_modules$/i, (msg) ->
    try
      msg.send "rm -rf node_modules..."
      child_process.exec "rm -rf node_modules", (error, stdout, stderr) ->
        if error
          msg.send "rm -rf node_modules failed: " + stderr
        else
          msg.send "don\'t forget to run `npm install` ;)"
    catch error
        msg.send "rm -rf node_modules failed: " + error