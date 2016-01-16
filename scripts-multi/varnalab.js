// Description:
//   show who is in VarnaLab
//
// Dependencies:
//   htmlparser
//   soupselect
//
// Configuration:
//   None
//
// Commands:
//   hubot who is in VarnaLab - show who is in VarnaLab
//
// Author:
//   multi

var select = require('soupselect').select
var htmlparser = require('htmlparser')

module.exports = function (robot) {

  robot.respond(/who is in varnalab/i, function (msg) {
    msg.http('http://varnalab.org').get()(function (err, res, body) {
      if (err) {
        msg.send('error: ' + err)
        return
      }

      var handler = new htmlparser.DefaultHandler()
      var parser = new htmlparser.Parser(handler)

      parser.parseComplete(body)

      var whoIsHere = select(handler.dom, '.teaser-who-is-here .teaser-text-with-icon')

      if (!whoIsHere || whoIsHere.length !== 1) {
        msg.send('something goes wrong')
        return
      }

      whoIsHere = whoIsHere[0].children

      if (whoIsHere.length < 1) {
        msg.send('something goes wrong')
        return
      }

      if (!whoIsHere[0].children || whoIsHere[0].children.length === 0) {
        msg.send('something goes wrong')
        return
      }

      // msg.send(whoIsHere[0].children[0].raw)
      msg.send(whoIsHere.filter(function (obj) {
        return obj.type === 'text'
      }).map(function (obj) {
        return '*' + obj.raw + '*'
      }).join(', '))
    })
  })

}
