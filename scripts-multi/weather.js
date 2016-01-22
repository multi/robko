// Description:
//   weather info
//
// Dependencies:
//   xml2js
//
// Configuration:
//   None
//
// Commands:
//   hubot what's the weather in <city[, state]> - show weather info for <location>
//   hubot find weather location <query> - search for weather location by given <query>
//   hubot remember weather location <location> - add weather location to robot brain
//   hubot forget weather location <location> - remove weather location from robot brain
//   hubot list weather locations - list remembered weather locations
//
// Author:
//   multi

var xml2js = require('xml2js')
var inspect = require('util').inspect

var searchCache = []

var imgMatcher = /img src=\"(.+)\"/i
var descriptionTextMatcher = /^(.+)[\r|\n|\t|\s]+?<img/i

module.exports = function (robot) {

  if (!robot.brain.data._weather) {
    robot.brain.data._weather = []
  }

  robot.respond(/what's the weather in (.+)$/i, function (msg) {
    var re = new RegExp(
      '^' + msg.match[1].trim().toLowerCase().split(/,| /).filter(function (i) {
        return i !== ''
      }).join('|'),
      'i'
    )

    var toQuery = robot.brain.data._weather.filter(function (item) {
      return re.test(item.c) || re.test(item.s)
    })

    if (toQuery.length === 0) {
      msg.send('nothing found? maybe you should try to find it first (hint: @' + robot.name + ' find weather location <query>)')
      return
    }

    if (toQuery.length > 1) {
      msg.send('more than one locations found, please use the full form <city, state> (eg. Varna, Bulgara)')
      return
    }

    msg.http('http://rss.accuweather.com/rss/liveweather_rss.asp')
    .query({
      metric: 1,
      locCode: toQuery[0].l,
    })
    .get()(function (err, res, body) {
      if (err) {
        msg.send('http error: ' + err)
        return
      }

      var parser = new xml2js.Parser()
      parser.parseString(body, function (err, result) {
        if (err) {
          msg.send('xml2js parse error: ' + err)
          return
        }

        switch (true) {
          case !result:
          case !result.rss:
          case !result.rss.channel:
          case result.rss.channel.length !== 1:
          case !result.rss.channel[0].item:
            robot.logger.warn('weather response wrong format', inspect(result, { depth: null }))
          case result.rss.channel[0].item.length === 0:
            msg.send('no weather information found.')
            return
        }

        var attachments = result.rss.channel[0].item.map(function (item, index) {
          switch (true) {
            case !item.description:
            case item.description.length !== 1:
            case !item.pubDate:
            case item.pubDate.length !== 1:
            case !item.title:
            case item.title.length !== 1:
              robot.logger.warn('weather response wrong format', inspect(item, { depth: null }))
              return
          }

          var text = item.description[0].match(descriptionTextMatcher)
          if (!text || text.length !== 2) return
          text = text[1]

          var imgUrl = item.description[0].match(imgMatcher)
          if (!imgUrl || imgUrl.length !== 2) return
          imgUrl = imgUrl[1]

          switch (index) {
            case 0:
            break
            default:
              text = new Date(new Date().getTime() + (index - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + ' ' + text
          }

          return {
            author_name: text,
            author_icon: imgUrl,
            text: '_last update ' + item.pubDate[0] + '_',
            mrkdwn_in: ['text'],
            fallback: text,
          }
        }).filter(function (item) {
          return item !== undefined
        })

        if (robot.adapterName !== 'slack') {
          msg.send(attachments.map(function (att) {
            return att.fallback
          }).join('\n'))

          return
        }

        robot.emit('slack-attachment', {
          channel: msg.message.room,
          attachments: attachments,
        })
      })
    })
  })

  robot.respond(/find weather location (.+)$/i, function (msg) {
    msg.http('http://forecastfox.accuweather.com/adcbin/forecastfox/locate_city.asp')
    .query({
      location: msg.match[1].trim(),
    })
    .get()(function (err, res, body) {
      if (err) {
        msg.send('http error: ' + err)
        return
      }

      var parser = new xml2js.Parser()
      parser.parseString(body, function (err, result) {
        if (err) {
          msg.send('xml2js parse error: ' + err)
          return
        }

        switch (true) {
          case !result:
          case !result.adc_database:
          case !result.adc_database.citylist:
          case result.adc_database.citylist.length !== 1:
          case !result.adc_database.citylist[0].location:
            robot.logger.warn('locations response wrong format', inspect(result, { depth: null }))
          case result.adc_database.citylist[0].location.length === 0:
            msg.send('no matching locations found.')
            return
        }

        searchCache = result.adc_database.citylist[0].location

        msg.send(result.adc_database.citylist[0].location.map(function (location) {
          return [
            '*',
            location.$.city,
            ', ',
            location.$.state,
            '*\n>',
            location.$.location,
          ].join('')
        }).join('\n') + '\nnow, i can remeber location from the search results (hint: @' + robot.name + ' remember weather location <location>)')
      })
    })
  })

  robot.respond(/remember weather location (.+)$/i, function (msg) {
    var toRemember = searchCache.filter(function (location) {
      return location.$.location === msg.match[1].trim()
    })

    if (toRemember.length !== 1) {
      msg.send('nothing found by the given location? maybe you should try to find it first (hint: @' + robot.name + ' find weather location <query>) and then I can remember it.')
      return
    }

    robot.brain.data._weather.push({
      c: toRemember[0].$.city,
      s: toRemember[0].$.state,
      l: toRemember[0].$.location,
    })

    msg.send('ok. remembered, *' + toRemember[0].$.city + ', ' + toRemember[0].$.state + '* _' + toRemember[0].$.location + '_')
  })

  robot.respond(/forget weather location (.+)$/i, function (msg) {
    var toForgetIndex = robot.brain.data._weather.findIndex(function (location) {
      return location.l === msg.match[1].trim()
    })

    if (toForgetIndex === -1) {
      msg.send('nothing found? maybe you should try to list all remembered locations first (hint: @' + robot.name + ' list weather locations) and then use the `Location` to forget it.')
      return
    }

    var removed = robot.brain.data._weather.splice(toForgetIndex, 1)
    if (removed.length !== 1) {
      msg.send('nothing removed? maybe you should try to list all remembered locations first (hint: @' + robot.name + ' list weather locations) and then use the `Location` to forget it.')
      return
    }

    msg.send('ok. removed, *' + removed[0].c + ', ' + removed[0].s + '* _' + removed[0].l + '_')
  })

  robot.respond(/list weather locations$/i, function (msg) {
    if (robot.brain.data._weather.length === 0) {
      msg.send('no locations i know. (hint: @' + robot.name + ' find weather location <query>)')
      return
    }

    msg.send(robot.brain.data._weather.map(function (location) {
      return [
        '*',
        location.c,
        ', ',
        location.s,
        '*\n>',
        location.l,
      ].join('')
    }).join('\n'))
  })

}
