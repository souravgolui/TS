module.exports.getId = function (jediClass, jedi) {
  if (jediClass === 'dark') {
    return jedi.secret_profile_id.toString()
  } else {
    return jedi._id.toString()
  }
}