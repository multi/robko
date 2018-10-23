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

var RedisGraph = require('redisgraph.js/src/redisGraph')
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
        record.keys().forEach(function (key) {
          message.push(`${key}: ${record.getString(key)}`)
        })
    	}
      if (message.length) {
        msg.send(message.join('\n'))
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
