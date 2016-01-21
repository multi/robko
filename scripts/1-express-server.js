// Description:
//   Hubot Express 4 server
//
// Dependencies:
//   express
//   morgan
//   body-parser
//   toobusy-js
//   basic-auth
//
// Configuration:
//   EXPRESS_PORT - required
//   EXPRESS_BIND_ADDRESS
//   EXPRESS_USER
//   EXPRESS_PASSWORD
//   EXPRESS_STATIC
//
// Commands:
//   None
//
// Author:
//   multi

var express = require('express')
var morgan = require('morgan')
var bodyParser = require('body-parser')
var toobusy = require('toobusy-js')
var basicAuth = require('basic-auth')

process.on('uncaughtException', function (err) {
  switch (err.errno) {
    case 'EADDRINUSE':
    case 'ETIMEDOUT':
      process.exit(1)
  }
})

function unauthorized(res) {
  res.setHeader('WWW-Authenticate', 'Basic realm=Authorization Required')
  res.sendStatus(401)
}

function auth (req, res, next) {
  var user = basicAuth(req)

  switch (true) {
    case !user:
    case !user.name:
    case !user.pass:
    case user.name !== process.env.EXPRESS_USER:
    case user.pass !== process.env.EXPRESS_PASSWORD:
      return unauthorized(res)

    default:
      next()
  }
}

module.exports = function (robot) {

  var app = express()

  app.use(function (req, res, next) {
    res.setHeader('X-Powered-By', 'hubot/' + robot.name)
    next()
  })

  app.use(morgan('combined'))

  app.use(function (req, res, next) {
    if (toobusy()) {
      res.sendStatus(503)
    } else {
      next()
    }
  })

  // app.use(bodyParser.urlencoded({extended: true}))
  app.use(bodyParser.json())

  if (process.env.EXPRESS_USER && process.env.EXPRESS_PASSWORD) {
    app.use(auth)
  }

  if (process.env.EXPRESS_STATIC) {
    app.use(express.static(process.env.EXPRESS_STATIC))
  }

  robot.router = app
  robot.server = app.listen(
    process.env.EXPRESS_PORT,
    process.env.EXPRESS_BIND_ADDRESS || '127.0.0.1'
  )
  robot.logger.info('Hubot Express 4 - started.')

  robot.brain.on('close', function () {
    robot.server.close()
  })
}
