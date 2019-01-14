// Description:
//   simple service monitor
//
// Dependencies:
//   None
//
// Configuration:
//   IP_TO_RESOLVE - required, double check that bot network is OK
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
var dns = require('dns')

var MIN_ERROR_COUNT = 1
var PROBES_TIMER_TIMEOUT = 60 * 1000 // 1 minute

var ping = function (urlToProbe) {
  return new Promise(function (resolve, reject) {
    var url = URL.parse(urlToProbe)
    var client = (url.protocol && url.protocol.toLowerCase() === 'https:') ? https : http
    var options = Object.assign({}, url, {
      rejectUnauthorized: false,
      ecdhCurve: 'auto',
      // ciphers: 'ALL',
      // secureProtocol: 'TLSv1_method',
      timeout: 1000,
      // headers: {
      //   'User-Agent': 'Hubot service-monitor probe',
      // },
    })
    var start = Date.now()
    var pingRequest = client.request(options, function (res) {
      if (res.statusCode >= 400) {
        reject(new Error(res.statusCode))
      } else {
        resolve(Date.now() - start)
      }
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
            formatStatusMessage(url, robot.brain.data._serviceMonitor.last[url], true)
          )
        }
        nextUrl()
      })
      .catch(function (err) {
        if (err.code === 'EAI_AGAIN') {
          // dns resolve timeout, false positive
          console.error('dns resolve timeout', url, err)
          return nextUrl()
        }
        var now = new Date()
        dns.reverse(process.env.IP_TO_RESOLVE, function (reverseResolveError) {
          if (reverseResolveError) {
            // don't log & alert possible false alarms,
            // also stop the execution of other probes
            console.error('reverseResolveError', reverseResolveError)
            console.error('probe', url, 'error', err)
            return nextUrl(err)
          }

          var alert = false
          if (!robot.brain.data._serviceMonitor.last[url] || !robot.brain.data._serviceMonitor.last[url].error) {
            alert = true
          }
          if (!robot.brain.data._serviceMonitor.last[url]) {
            robot.brain.data._serviceMonitor.last[url] = {}
          }
          if ((robot.brain.data._serviceMonitor.last[url].errorCount || 0) < MIN_ERROR_COUNT) {
            robot.brain.data._serviceMonitor.last[url] = {
              errorCount: (robot.brain.data._serviceMonitor.last[url].errorCount || 0) + 1,
            }
            console.error('probe', url, 'error', err, 'retrying count', robot.brain.data._serviceMonitor.last[url].errorCount)
            return nextUrl()
          }
          robot.brain.data._serviceMonitor.last[url] = {
            error: err.message,
            ts: now,
            errorCount: robot.brain.data._serviceMonitor.last[url].errorCount || 0,
          }
          if (alert) {
            robot.messageRoom(
              robot.brain.data._serviceMonitor.urls[url],
              formatStatusMessage(url, robot.brain.data._serviceMonitor.last[url], true)
            )
          }
          nextUrl()
        })
      })
    }, function () {
      runTimer()
    })
  }

  var runTimer = function () {
    timerHandle = setTimeout(runProbes, PROBES_TIMER_TIMEOUT)
  }

  var resetTimer = function () {
    clearTimeout(timerHandle)
    runProbes()
  }

  var formatStatusMessage = function (url, last, mention) {
    var message = [
      url,
      'is',
      last.error ? '*DOWN*' : '*UP*',
      last.error ? ':rotating_light:' : ':rocket:',
    ]

    if (mention) {
      message.unshift('<!channel>')
    }

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

    Object.keys(robot.brain.data._serviceMonitor.last).forEach(function (url) {
      msg.send(formatStatusMessage(url, robot.brain.data._serviceMonitor.last[url]))
    })
  })
}
