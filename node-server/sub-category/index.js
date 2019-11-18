const subcategory = require('./route');

function initSubCategory(app) {
    app.use('/sub_category', subcategory)
}

module.exports = initSubCategory