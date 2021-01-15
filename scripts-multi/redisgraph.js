// Description:
//   redisgraph hubot interface
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot rg <query> - execute query on redisgraph
//
// Author:
//   multi

var RedisGraph = require('redisgraph.js').Graph
var GRAPH_NAME = 'hubot_graph'

module.exports = function (robot) {

  var graph = new RedisGraph(GRAPH_NAME)

  robot.respond(/rg (.+)$/i, function (msg) {
    if (!msg.match[1]) {
      msg.send('no query?')
      return
    }

    graph
    .query(msg.match[1])
    .then(function (res) {
      var message = []
      while (res.hasNext()) {
        var record = res.next()
        var recordMsg = {}
        record.keys().forEach(function (key) {
          recordMsg[key] = record.getString(key)
        })
        message.push(recordMsg)
    	}
      if (message.length) {
        msg.send('```' + JSON.stringify(message, null, 2) + '```')
      } else {
        msg.send('Empty result.')
      }
      var stats = res.getStatistics().getStatistics()
      var statsMsg = []
      Object.keys(stats).forEach(function (key) {
        statsMsg.push(`${key}: ${stats[key]}`)
      })
      if (statsMsg.length) {
        msg.send(statsMsg.join('\n'))
      }
    })
    .catch(function (err) {
      msg.send(`${err}`)
    })
  })

}
