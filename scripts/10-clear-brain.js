// Description:
//   clear not used robot.brain.data
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   None
//
// Author:
//   multi

module.exports = function (robot) {

  robot.brain.on('loaded', function () {
    delete robot.brain.data.history

    robot.brain.save()
  })

}
