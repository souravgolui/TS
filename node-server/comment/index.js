const comments = require('./route')

function initComments(app) {
  app.use('/comments', comments)
}

module.exports = initComments