const events = require('./route')

function initEvents (app) {
  app.use('/events', events)
}

module.exports = initEvents
