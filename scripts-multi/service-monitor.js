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
    var options = Object.assign({}, url, {
      rejectUnauthorized: false,
      timeout: 1000,
      headers: {
        'User-Agent': 'Hubot service-monitor probe',
      },
      // ciphers: 'ALL',
      // secureProtocol: 'TLSv1_method',
    })
    var start = Date.now()
    var pingRequest = client.request(options, function () {
      resolve(Date.now() - start)
      pingRequest.abort()
    })
    pingRequest.on('error', function (err) {
      reject(err)
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
        var alert = false
        if (robot.brain.data._serviceMonitor.last[url] && robot.brain.data._serviceMonitor.last[url].error) {
          alert = true
        }
        robot.brain.data._serviceMonitor.last[url] = {
          time: time,
          ts: new Date(),
        }
        if (alert) {
          robot.messageRoom(
            robot.brain.data._serviceMonitor.urls[url],
            formatStatusMessage(url, robot.brain.data._serviceMonitor.last[url])
          )
        }
        nextUrl()
      })
      .catch(function (err) {
        var alert = false
        if (!robot.brain.data._serviceMonitor.last[url] || !robot.brain.data._serviceMonitor.last[url].error) {
          alert = true
        }
        robot.brain.data._serviceMonitor.last[url] = {
          error: err.message,
          ts: new Date(),
        }
        if (alert) {
          robot.messageRoom(
            robot.brain.data._serviceMonitor.urls[url],
            formatStatusMessage(url, robot.brain.data._serviceMonitor.last[url])
          )
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
    } else {
      message.push('Error:', last.error)
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

    msg.finish()
    Object.keys(robot.brain.data._serviceMonitor.last).forEach(function (url) {
      msg.send(formatStatusMessage(url, robot.brain.data._serviceMonitor.last[url]))
    })
    msg.send('That\'s all I got.')
  })
}
