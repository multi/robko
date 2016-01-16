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

  robot.brain.data.history = undefined

  robot.brain.save()

}
