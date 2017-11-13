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
//   hubot service-monitor add {url}  - adds url for monitoring
//   hubot service-monitor remove {url}  - remove url from monitoring
//   hubot service-monitor status {url}?  - remove url from monitoring
//
// Author:
//   multi

var http = require('http')
var URL = require('url').URL
var async = require('async')
var _ = require('lodash')
var Table = require('cli-table')
var stripColors = require('colors/safe').stripColors

var ping = function (urlToProbe) {
  return new Promise(function (resolve, reject) {
    var url = new URL(urlToProbe)
    var result
    var options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname || '/',
      timeout: 1000,
    }
    var start = Date.now()
    var pingRequest = http.request(options, function () {
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
      urls: [],
      last: {},
    }
  }

  var timerHandle = null

  var runProbes = function (msg) {
    async.each(robot.brain.data._serviceMonitor.urls, function (url, nextUrl) {
      ping(url).then(function (time) {
        if (robot.brain.data._serviceMonitor.last[url] && robot.brain.data._serviceMonitor.last[url].error) {
          msg.send('[service-monitor] ' + url + ' is **UP**!')
        }
        robot.brain.data._serviceMonitor.last[url] = {
          time: time,
          ts: new Date(),
        }
        nextUrl()
      })
      .catch(function (err) {
        if (!robot.brain.data._serviceMonitor.last[url] || !robot.brain.data._serviceMonitor.last[url].error) {
          msg.send('[service-monitor] ' + url + ' is **DOWN**!')
        }
        robot.brain.data._serviceMonitor.last[url] = {
          error: err.message,
          ts: new Date(),
        }
        nextUrl()
      })
    }, function () {
      runTimer(msg)
    })
  }

  var runTimer = function (msg) {
    timerHandle = setTimeout(function () {
      runProbes(msg)
    }, 60 * 1000)
  }

  var resetTimer = function (msg) {
    clearTimeout(timerHandle)
    runProbes(msg)
  }

  robot.respond(/service-monitor add (.*)$/i, function (msg) {
    var url = msg.match[1].trim().toLowerCase()
    if (robot.brain.data._serviceMonitor.urls.indexOf(url) > -1) {
      msg.send('Sorry, the url is already added.')
      return
    }
    robot.brain.data._serviceMonitor.urls.push(url)
    msg.send('OK! Added!')
    resetTimer(msg)
  })

  robot.respond(/service-monitor remove (.*)$/i, function (msg) {
    var url = msg.match[1].trim().toLowerCase()
    if (robot.brain.data._serviceMonitor.urls.indexOf(url) === -1) {
      msg.send('Sorry, I don\'t monitor this url.')
      return
    }
    robot.brain.data._serviceMonitor.urls = _.pull(robot.brain.data._serviceMonitor.urls, url)
    delete robot.brain.data._serviceMonitor.last[url]
    msg.send('OK! Removed!')
    resetTimer(msg)
  })

  robot.respond(/service-monitor status (.*)$/i, function (msg) {
    var url = msg.match[1].trim().toLowerCase()
    if (url) {
      if (robot.brain.data._serviceMonitor.urls.indexOf(url) === -1) {
        msg.send('Sorry, I don\'t monitor this url.')
        return
      }

      if (!robot.brain.data._serviceMonitor.last[url]) {
        msg.send('Sorry, no data for this url.')
        return
      }

      var message = [
        '[service-monitor]',
        url,
        'is',
        robot.brain.data._serviceMonitor.last[url].error ? '**DOWN**!' : '**UP**!',
      ]

      if (!robot.brain.data._serviceMonitor.last[url].error) {
        message.push(
          'Response time:',
          robot.brain.data._serviceMonitor.last[url].time,
          'ms.'
        )
      }

      msg.send(message.join(' '))
    }
  })

  robot.respond(/service-monitor status$/i, function (msg) {
    if (!Object.keys(robot.brain.data._serviceMonitor.last).length) {
      msg.send('Sorry, no data yet.')
      return
    }

    var table = new Table({
      head: [
        'URL',
        'Last updated',
        'Error/Response time',
      ],
      colWidths: [
        40,
        42,
        22
      ]
    })

    Object.keys(robot.brain.data._serviceMonitor.last).forEach(function (url) {
      var last = robot.brain.data._serviceMonitor.last[url]
      table.push([
        url,
        last ? last.ts : '-',
        last ? (last.error ? last.error : last.time + ' ms.') : '-',
      ])
    })

    msg.send('> Services status:\n```' + stripColors(table.toString()) + '```')
  })
}
