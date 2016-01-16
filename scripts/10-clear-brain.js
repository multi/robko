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

  delete robot.brain.data.history

  robot.brain.save()

}
