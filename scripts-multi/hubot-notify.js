// Description:
//   Forwards notifications from a REST API
//
// Dependencies:
//   None
//
// Configuration:
//   NOTIFY_SECRET - check for that token in req.body.secret
//
// Commands:
//   None
//
// Author:
//   multi

module.exports = function (robot) {
  robot.router.post('/' + robot.name + '/notify/:target', function (req, res) {
    if (process.env.NOTIFY_SECRET && req.body.secret !== process.env.NOTIFY_SECRET) {
      res.status(401).send('error: secret verification failed\n')
      return
    }
    var target = req.params.target
    if (req.params.target.match(/^_/)) {
      target = req.params.target.replace(/^(_)+/, function (match) {
        return Array(match.length + 1).join("#")
      })
    }
    robot.messageRoom(target, req.body.message)
    res.status(200).send('delivered\n')
  })

  robot.router.post('/' + robot.name + '/notify/:room/:user', function (req, res) {
    if (process.env.NOTIFY_SECRET && req.body.secret !== process.env.NOTIFY_SECRET) {
      res.status(401).send('error: secret verification failed\n')
      return
    }
    if (req.params.room.match(/^_/)) {
      var room = req.params.room.replace(/^(_)+/, function (match) {
        return Array(match.length + 1).join("#")
      })
      robot.messageRoom(room, `${req.params.user}: ${req.params.message}`)
      res.status(200).send('delivered\n')
    }
    else {
      res.status(400).send('error: you need to use underscores for #\n')
    }
  })
}