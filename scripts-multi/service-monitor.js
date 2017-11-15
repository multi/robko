// Description:
//   simple service monitor
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot service-monitor add {url}  - adds url for monitoring (uses current room for later alerts)
//   hubot service-monitor remove {url}  - remove url from monitoring
//   hubot service-monitor status {url}?  - show status all services or by specific url
//
// Author:
//   multi

var http = require('http')
var https = require('https')
var URL = require('url')
var async = require('async')
var _ = require('lodash')

var ping = function (urlToProbe) {
  return new Promise(function (resolve, reject) {
    var url = URL.parse(urlToProbe)
    var client = (url.protocol && url.protocol.toLowerCase() === 'https:') ? https : http
    var result
    var options = Object.assign({}, url, {
      rejectUnauthorized: false,
      timeout: 1000,
      headers: {
        'User-Agent': 'Hubot service-monitor probe',
      },
    })
    var start = Date.now()
    var pingRequest = client.request(options, function () {
      result = Date.now() - start
      resolve(result)
      pingRequest.abort()
    })
    pingRequest.on('error', function () {
      result = -1
      reject(result)
      pingRequest.abort()
    })
    pingRequest.write('')
    pingRequest.end()
  })
}

module.exports = function (robot) {
  if (!robot.brain.data._serviceMonitor) {
    robot.brain.data._serviceMonitor = {
      urls: {},
      last: {},
    }
  }

  var timerHandle = null

  var runProbes = function () {
    async.each(Object.keys(robot.brain.data._serviceMonitor.urls), function (url, nextUrl) {
      ping(url).then(function (time) {
        if (robot.brain.data._serviceMonitor.last[url] && robot.brain.data._serviceMonitor.last[url].error) {
          robot.messageRoom(
            robot.brain.data._serviceMonitor.urls[url],
            '[service-monitor] :rocket: ' + url + ' is *UP*!'
          )
        }
        robot.brain.data._serviceMonitor.last[url] = {
          time: time,
          ts: new Date(),
        }
        nextUrl()
      })
      .catch(function (err) {
        if (!robot.brain.data._serviceMonitor.last[url] || !robot.brain.data._serviceMonitor.last[url].error) {
          robot.messageRoom(
            robot.brain.data._serviceMonitor.urls[url],
            '[service-monitor] :rotating_light: ' + url + ' is *DOWN*!'
          )
        }
        robot.brain.data._serviceMonitor.last[url] = {
          error: err.message,
          ts: new Date(),
        }
        nextUrl()
      })
    }, function () {
      runTimer()
    })
  }

  var runTimer = function () {
    timerHandle = setTimeout(runProbes, 60 * 1000)
  }

  var resetTimer = function () {
    clearTimeout(timerHandle)
    runProbes()
  }

  var formatStatusMessage = function (url, last) {
    var message = [
      '>',
      url,
      'is',
      last.error ? '*DOWN*' : '*UP*',
      last.error ? ':rotating_light:' : ':rocket:',
    ]

    if (!last.error) {
      message.push(
        last.time,
        'ms.'
      )
    }

    message.push(
      'at',
      last.ts
    )

    return message.join(' ')
  }

  robot.brain.on('loaded', resetTimer)

  robot.respond(/service-monitor add (.*)$/i, function (msg) {
    var url = msg.match[1].trim().toLowerCase()
    if (robot.brain.data._serviceMonitor.urls[url]) {
      msg.send('Sorry, the url is already added.')
      return
    }
    robot.brain.data._serviceMonitor.urls[url] = msg.message.room
    msg.send('OK! Added!')
    resetTimer()
  })

  robot.respond(/service-monitor remove (.*)$/i, function (msg) {
    var url = msg.match[1].trim().toLowerCase()
    if (!robot.brain.data._serviceMonitor.urls[url]) {
      msg.send('Sorry, I don\'t monitor this url.')
      return
    }
    delete robot.brain.data._serviceMonitor.urls[url]
    delete robot.brain.data._serviceMonitor.last[url]
    msg.send('OK! Removed!')
    resetTimer()
  })

  robot.respond(/service-monitor status (.*)$/i, function (msg) {
    var url = msg.match[1].trim().toLowerCase()
    if (url) {
      if (!robot.brain.data._serviceMonitor.urls[url]) {
        msg.send('Sorry, I don\'t monitor this url.')
        return
      }

      if (!robot.brain.data._serviceMonitor.last[url]) {
        msg.send('Sorry, no data for this url.')
        return
      }

      msg.send(formatStatusMessage(url, robot.brain.data._serviceMonitor.last[url]))
    }
  })

  robot.respond(/service-monitor status$/i, function (msg) {
    if (!Object.keys(robot.brain.data._serviceMonitor.last).length) {
      msg.send('Sorry, no data yet.')
      return
    }

    var response = [
      '> Services status:',
    ]

    Object.keys(robot.brain.data._serviceMonitor.last).forEach(function (url) {
      response.push(formatStatusMessage(url, robot.brain.data._serviceMonitor.last[url]))
    })

    msg.send(response.join('\n'))
  })
}
