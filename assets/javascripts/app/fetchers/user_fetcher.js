define(function(require) {
  var CapsicoConfig = require('config');
  var User = require('models/admin_user')

  var returnMethod = function() {

    var promise = new Promise(function(resolve, reject) {

      var users_list_url = CapsicoConfig.serverName + CapsicoConfig.users.list.path;
      fetch(users_list_url + "?Size=10000")
        .then(function(response) {
          if(response.status != 200)
            throw new Error("Invalid Response code for User Fetcher: "+response.status)
          return response.json();
        })
        .then(function(json) {
          return User.fromJSON(json.data);
        })
        .then(function(result) {
          resolve({})
        })
        .catch(function(error) {
          console.error("~~> Error while syncing Users List")
          console.error("Message: ", error.message)
          reject(error)
        })
    })
    return promise;
  }
  
  return returnMethod;
});