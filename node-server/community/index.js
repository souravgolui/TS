const communities = require('./route')

function initCommunities(app) {
  app.use('/communities', communities)
}

module.exports = initCommunities