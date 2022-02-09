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
    msg.http('https://www.varnalab.org/bg/about').get()(function (err, res, body) {
      if (err) {
        msg.send('network error: ' + err)
        return
      }

      var handler = new htmlparser.DefaultHandler()
      var parser = new htmlparser.Parser(handler)

      parser.parseComplete(body)

      var whoIsHere = select(handler.dom, '.widget_whois_wrapper .widget_whois_container ul li')

      if (!whoIsHere || whoIsHere.length < 1) {
        msg.send('something goes wrong')
        return
      }

      whoIsHere = whoIsHere.map(function (obj) {
        return obj.children[0]
      })

      msg.send(whoIsHere.filter(function (obj) {
        return obj.type === 'text'
      }).map(function (obj) {
        return '*' + obj.raw + '*'
      }).join(', '))
    })
  })

}
