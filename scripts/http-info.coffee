# Description:
#   Returns title and description when links are posted
#
# Dependencies:
#   "jsdom": "0.8.10"
#   "lodash": "4.0.0"
#
# Configuration:
#   HUBOT_HTTP_INFO_IGNORE_URLS - RegEx used to exclude Urls
#   HUBOT_HTTP_INFO_IGNORE_USERS - Comma-separated list of users to ignore
#   HUBOT_HTTP_INFO_IGNORE_DESC - Optional boolean indicating whether a site's meta description should be ignored
#
# Commands:
#   http(s)://<site> - prints the title and meta description for sites linked.
#
# Author:
#   ajacksified, multi

jsdom = require 'jsdom'
some  = require 'lodash/some'

module.exports = (robot) ->

  ignoredusers = []
  if process.env.HUBOT_HTTP_INFO_IGNORE_USERS?
    ignoredusers = process.env.HUBOT_HTTP_INFO_IGNORE_USERS.split(',')

  robot.hear /(http(?:s?):\/\/(\S*))/i, (msg) ->
    url = msg.match[1]

    username = msg.message.user.name
    if some(ignoredusers, (user) -> user == username)
      console.log 'ignoring user due to blacklist:', username
      return

    # filter out some common files from trying
    ignore = url.match(/\.(png|jpe?g|gif|txt|zip|rar|tar\.bz|tar\.gz|tar|jsx?|s?css|jade)/)

    ignorePattern = process.env.HUBOT_HTTP_INFO_IGNORE_URLS
    if !ignore && ignorePattern
      ignore = url.match(ignorePattern)

    jquery = '//code.jquery.com/jquery-1.12.0.min.js'

    done = (errors, window) ->
      unless errors
        $ = window.$
        title = $('head title').text().replace(/(\r\n|\n|\r)/gm,'').replace(/\s{2,}/g,' ').trim()
        description = $('head meta[name=description]')?.attr('content')?.replace(/(\r\n|\n|\r)/gm,'')?.replace(/\s{2,}/g,' ')?.trim() || ''

        if title and description and not process.env.HUBOT_HTTP_INFO_IGNORE_DESC
          msg.send "#{title}\n#{description}"

        else if title
          msg.send "#{title}"

    unless ignore
      jsdom.env
        url: url
        scripts: [ jquery ]
        done: done
