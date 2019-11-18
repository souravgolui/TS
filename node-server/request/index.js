const requests = require('./route')

function initRequests (app) {
  app.use('/requests', requests)
}

module.exports = initRequests
