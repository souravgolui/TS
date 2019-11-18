const FCM = require('fcm-notification')
const config = require('../config')

var fcmClient = new FCM(config.FCM_JSON_PATH)

module.exports.pushNotification = function (token, title, text) {
  var message = {
    data: {},
    notification: {
      title: title,
      body: text
    },
    token: token
  }

  fcmClient.send(message, function (err, response) {
    if (err) {
      console.log('error found', err)
    }
  })
}
