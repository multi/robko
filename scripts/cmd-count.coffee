# Description:
#   Base64 encoding and decoding
#
# Dependencies:
#   None
#
# Configuration:
#   None
#
# Commands:
#   hubot command count - print total count of commands that the bot is aware of
#
# Author:
#   multi

module.exports = (robot) ->
  robot.hear /command count/i, (msg) ->
    msg.send "I am aware of #{msg.robot.commands.length} commands"
