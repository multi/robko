# Description:
#   Because animals are animals. http://animalsbeingdicks.com/
#
# Dependencies:
#   "htmlparser": "1.7.6"
#   "soupselect": "0.2.0"
#
# Configuration:
#   None
#
# Commands:
#   hubot animal me - Grab a random gif from animalsbeingdicks
#
# Author:
#   unsay

Select     = require("soupselect").select
HtmlParser = require "htmlparser"

module.exports = (robot) ->
  robot.respond /animal me/i, (msg) ->
    randimalMe msg, (url) ->
      msg.send url

randimalMe = (msg, cb) ->
  msg.http("http://animalsbeingdicks.com/random")
    .get() (err, res, body) ->
      if err
        msg.send "http error: #{err}"
        return
      animalMe msg, res.headers.location, (location) ->
        cb location

animalMe = (msg, location, cb) ->
  msg.http(location)
    .get() (err, res, body) ->
      if err
        msg.send "http error: #{err}"
        return
      handler = new HtmlParser.DefaultHandler()
      parser  = new HtmlParser.Parser handler

      parser.parseComplete body
      img = Select handler.dom, "#content .post .entry img"

      cb img[0].attribs.src
