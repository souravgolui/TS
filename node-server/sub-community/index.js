const subcommunity = require('./route');

function initSubsubCommunity(app) {
    app.use('/sub_community', subcommunity)
}

module.exports = initSubsubCommunity