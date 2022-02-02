# Description:
#   Forwards notifications from a REST API
#
# Dependencies:
#   None
#
# Configuration:
#   NOTIFY_SECRET - check for that token in req.body.secret
#
# Commands:
#   None
#
# Author:
#   multi

module.exports = (robot) ->
  robot.router.post '/' + robot.name + '/notify/:target', (req, res) ->
    if process.env.NOTIFY_SECRET? and req.body.secret isnt process.env.NOTIFY_SECRET
      res.status(401).send 'error: secret verification failed\n'
      return
    if req.params.target.match /^_/
      target = req.params.target.replace /^(_)+/, (match) ->
        Array(match.length + 1).join("#")
    else
      target = req.params.target
    robot.messageRoom "#{target}", req.body.message
    res.status(200).send 'delivered\n'

  robot.router.post '/' + robot.name + '/notify/:room/:user', (req, res) ->
    if process.env.NOTIFY_SECRET? and req.body.secret isnt process.env.NOTIFY_SECRET
      res.status(401).send 'error: secret verification failed\n'
      return
    if req.params.room.match /^_/
      room = req.params.room.replace /^(_)+/, (match) ->
        Array(match.length + 1).join("#")
      robot.messageRoom "#{room}", "#{req.params.user}: #{req.body.message}"
      res.status(200).send 'delivered\n'
    else
      res.status(400).send 'error: you need to use underscores for #\n'