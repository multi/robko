# Description:
#   Allows hubot to update itself using git pull and npm install.
#   If updates are downloaded you'll need to restart hubot, for example using "hubot process exit" (restart using a watcher like nodemon).
#
# Dependencies:
#   None
#
# Configuration:
#   None
#
# Commands:
#   hubot git pull - Performs a `git pull`
#   hubot npm install - Performs a `npm i --production --no-optional`
#   hubot pending update - Informs if there are pending updates (hubot needs a restart)
#
# Author:
#   benjamine, multi

child_process = require 'child_process'
downloaded_updates = false

updatesAvailable = (msg) ->
  msg.send "I have some pending updates, KILL ME PLEASE! (hint: @robko process exit)"

module.exports = (robot) ->

  robot.respond /pending updates?\??$/, (msg) ->
    if downloaded_updates
      updatesAvailable msg
    else
      msg.send "I'm up-to-date!"

  robot.respond /git pull$/, (msg) ->
    try
      msg.send "git pull..."
      child_process.exec 'git pull', (error, stdout, stderr) ->
        if error
          msg.send "git pull failed: " + stderr
        else
          output = stdout + ''
          if not /Already up\-to\-date/.test output
            output = "my source code changed:\n" + output + "\ndon\'t forget to run npm install ;)"
            msg.send output
          else
            msg.send "my source code is up-to-date"
    catch error
        msg.send "git pull failed: " + error

  robot.respond /npm install$/, (msg) ->
    try
      msg.send "npm install..."
      child_process.exec 'npm i --production --no-optional', (error, stdout, stderr) ->
        if error
          msg.send "npm install failed: " + stderr
        else
          output = stdout + ''
          if /node_modules/.test output
            msg.send "some dependencies updated:\n" + output
            updatesAvailable msg
            downloaded_updates = true
          else
            msg.send "all dependencies are up-to-date"
    catch error
        msg.send "npm install failed: " + error

