// Description:
//   bless hubot with angel abilities (see. organic, organic-angel)
//
// Dependencies:
//   uuid, organic-angel, angelscripts-cellcmds
//
// Configuration:
//   HUBOT_ENDPOINT - required (eg. `http://hubot.example.com`)
//   ORGANIC_CELLS_PATH - optional (defaults to `cells`)
//
// Commands:
//   hubot cells? list
//   hubot cell add {name}
//   hubot cell del {name}
//   hubot cell json {name}
//   hubot cell {name} angel {cmd}
//
// Author:
//   multi

var path = require('path')
var fs = require('fs')
var exec = require('child_process').exec

var uuid = require('uuid')

var ORGANIC_CELLS_PATH = process.env.ORGANIC_CELLS_PATH || 'cells'

module.exports = function (robot) {

  try {
    fs.statSync(ORGANIC_CELLS_PATH)
  }
  catch (e) {
    fs.mkdirSync(ORGANIC_CELLS_PATH)
  }

  if (!robot.brain.data._cells) {
    robot.brain.data._cells = {}
  }

  var getCellNames = function () {
    var names = []
    for (var cellName in robot.brain.data._cells) {
      names.push(cellName)
    }
    return names
  }

  robot.respond(/cells? list/, function (msg) {
    var cellNames = getCellNames()
    if (cellNames.length === 0) {
      msg.send('no cells, i know :(')
      return
    }

    msg.send(cellNames.join(', '))
  })

  robot.respond(/cell add (.*)/, function (msg) {
    if (robot.brain.data._cells[msg.match[1]]) {
      msg.send([
        'cell ',
        msg.match[1],
        ' already added.'
      ].join(''))

      return
    }

    var token = uuid.v1()
    robot.brain.data._cells[msg.match[1]] = token
    msg.send([
      'ok ',
      msg.match[1],
      ' added.\nplease post cell.json eg. *`curl -H \'cell-token: ',
      token,
      '\' -H \'Content-Type: application/json\' -d @dna/_staging/cell.json ',
      process.env.HUBOT_ENDPOINT + '/hubot/organic-cells`*',
      '\n*NOTE: make sure that `source` includes robko ssh key, eg. `ssh -i keys/id_rsa -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no -o IdentitiesOnly=yes user@host`*'
    ].join(''))
  })

  robot.respond(/cell del (.*)/, function (msg) {
    if (!robot.brain.data._cells[msg.match[1]]) {
      msg.send([
        'cell ',
        msg.match[1],
        ' not found!'
      ].join(''))

      return
    }

    fs.unlink(
      path.join(ORGANIC_CELLS_PATH, robot.brain.data._cells[msg.match[1]] + '.json'),
      function (err) {
        if (err) {
          console.error(err)
          msg.send('unlink error: ' + err)
        }

        delete robot.brain.data._cells[msg.match[1]]
        msg.send([
          'ok ',
          msg.match[1],
          ' deleted.'
        ].join(''))
      }
    )
  })

  robot.respond(/cell json (.*)/, function (msg) {
    if (!robot.brain.data._cells[msg.match[1]]) {
      msg.send([
        'cell ',
        msg.match[1],
        ' not found!'
      ].join(''))

      return
    }

    fs.readFile(
      path.join(ORGANIC_CELLS_PATH, robot.brain.data._cells[msg.match[1]] + '.json'),
      function (err, data) {
        if (err) {
          console.error(err)
          msg.send('read error: ' + err)
          return
        }

        msg.send(data.toString('utf8'))
      }
    )
  })

  robot.respond(/cell (.*) angel (.*)/, function (msg) {
    if (!robot.brain.data._cells[msg.match[1]]) {
      msg.send([
        'cell ',
        msg.match[1],
        ' not found!'
      ].join(''))

      return
    }

    var jsonFile = path.join(ORGANIC_CELLS_PATH, robot.brain.data._cells[msg.match[1]] + '.json')

    fs.readFile(
      jsonFile,
      function (err, data) {
        if (err) {
          msg.send('readFile error: ' + err)
          return
        }

        var cellJSON
        try {
          cellJSON = JSON.parse(data)
        }
        catch (e) {
          msg.send('cell.json parse error')
          return
        }


        if (!cellJSON[msg.match[2]]) {
          msg.send([
            'error: cell.json doesn\'t contain ',
            msg.match[2]
          ].join(''))

          return
        }

        msg.send([
          'running `angel cell ',
          msg.match[2],
          '` on *',
          msg.match[1],
          '*'
        ].join(''))

        exec(
          [
            'node ./node_modules/.bin/angel cell ',
            msg.match[2],
            ' ',
            jsonFile
          ].join(''),
          function (err, stdout, stderr) {
            if (err) {
              msg.send('stderr: ' + stderr + ' err: ' + err)
              return
            }

            msg.send(stdout)
          }
        )
      }
    )
  })

  robot.router.post('/hubot/organic-cells', function (req, res) {
    // XXX nice to have: cell.json validation
    if (!req.headers['cell-token'] || !req.body) {
      res.status(400).end()
      return
    }

    var cellNameByToken

    for (var cellName in robot.brain.data._cells) {
      if (robot.brain.data._cells[cellName] === req.headers['cell-token']) {
        cellNameByToken = cellName
        break
      }
    }

    if (!cellNameByToken) {
      res.status(404).end()
      return
    }

    robot.brain.data._cells[cellNameByToken] = uuid.v1()

    fs.writeFile(
      path.join(ORGANIC_CELLS_PATH, robot.brain.data._cells[cellNameByToken] + '.json'),
      JSON.stringify(req.body, null, 2),
      function (err) {
        if (err) {
          res.status(500).end(err.toString())
          return
        }

        res.end('added')
      }
    )
  })
}
