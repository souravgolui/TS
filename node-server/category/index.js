const categories = require('./route')

function initCategories (app) {
  app.use('/categories', categories)
}

module.exports = initCategories
