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
//   hubot search for weather location <query> - search for weather location by given <query>
//   hubot remember weather location <location> - add weather location to robot brain
//   hubot forget weather location <location> - remove weather location from robot brain
//   hubot list known weather locations - list remembered weather locations
//
// Author:
//   multi

var xml2js = require('xml2js')

var searchCache = []

var imgMatcher = /img src=\"(.+)\"/i
var descriptionTextMatcher = /^(.+)[\r|\n|\t|\s]+?<img/i

module.exports = function (robot) {

  if (!robot.brain.data._weather) {
    robot.brain.data._weather = []
  }

  robot.respond(/what's the weather in (.+)$/i, function (msg) {
    var re = new RegExp(
      msg.match[1].trim().toLowerCase().split(/,| /).filter(function (i) {
        return i !== ''
      }).join('|'),
      'i'
    )

    var toQuery = robot.brain.data._weather.filter(function (item) {
      return re.test(item.c) || re.test(item.s)
    })

    if (toQuery.length === 0) {
      msg.send('nothing found? maybe you should try to search first (hint: @' + robot.name + ' search for weather location <query>) and then tell me to remember it.')
      return
    }

    if (toQuery.length > 1) {
      msg.send('more than one locations found, please use the full form <city, state|country> (eg. Varna, Bulgara)')
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

        if (!result) return
        if (!result.rss) return
        if (!result.rss.channel) return
        if (result.rss.channel.length !== 1) return
        if (!result.rss.channel[0].item) return

        robot.emit('slack-attachment', {
          channel: msg.message.room,
          attachments: result.rss.channel[0].item.map(function (item) {
            if (!item.description) return
            if (item.description.length !== 1) return

            var text = item.description[0].match(descriptionTextMatcher)
            if (!text || text.length !== 2) return
            text = text[1]

            var imgUrl = item.description[0].match(imgMatcher)
            if (!imgUrl || imgUrl.length !== 2) return
            imgUrl = imgUrl[1]

            return {
              title: item.title,
              text: text,
              fallback: item.title + ' ' + text,
              thumb_url: imgUrl,
            }
          })
        })
      })
    })
  })

  robot.respond(/search for weather location (.+)$/i, function (msg) {
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

        if (!result) return
        if (!result.adc_database) return
        if (!result.adc_database.citylist) return
        if (result.adc_database.citylist.length !== 1) {
          msg.send('no matching locations found.')
          return
        }
        if (!result.adc_database.citylist[0].location) return
        if (result.adc_database.citylist[0].location.length === 0) {
          msg.send('no matching locations found.')
          return
        }

        searchCache = result.adc_database.citylist[0].location

        msg.send(result.adc_database.citylist[0].location.map(function (location) {
          return [
            'City: *',
            location.$.city,
            '* State: *',
            location.$.state,
            '* Location: *',
            location.$.location,
            '*'
          ].join('')
        }).join('\n'))
      })
    })
  })

  robot.respond(/remember weather location (.+)$/i, function (msg) {
    var toRemember = searchCache.filter(function (location) {
      return location.$.location === msg.match[1].trim()
    })

    if (toRemember.length !== 1) {
      msg.send('nothing found? maybe you should try to search first (hint: @' + robot.name + ' search for weather location <query>) and then I can remember it.')
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
      msg.send('nothing found? maybe you should try see all known locations first (hint: @' + robot.name + ' list known weather locations) and then use the `Location` to forget it.')
      return
    }

    var removed = robot.brain.data._weather.splice(toForgetIndex, 1)
    if (removed.length !== 1) {
      msg.send('nothing removed? maybe you should try see all known locations first (hint: @' + robot.name + ' list known weather locations) and then use the `Location` to forget it.')
      return
    }

    msg.send('ok. removed, *' + removed[0].c + ', ' + removed[0].s + '* _' + removed[0].l + '_')
  })

  robot.respond(/list known weather locations$/i, function (msg) {
    if (robot.brain.data._weather.length === 0) {
      msg.send('no locations i know. (hint: @' + robot.name + ' search for weather location <query>)')
      return
    }

    msg.send(robot.brain.data._weather.map(function (location) {
      return [
        'City: *',
        location.c,
        '* State: *',
        location.s,
        '* Location: *',
        location.l,
        '*'
      ].join('')
    }).join('\n'))
  })

}
