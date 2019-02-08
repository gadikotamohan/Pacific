define(function(require) {

  var jsSHA     = require('jsSHA');
  var encHelper = require('encryption_helper')

  var LoginHelper = {
    _is_authenticated: false,
    _db_details: null,
    _timeout: "Unable to reach server",
    _incorrect_db_details: "Server failed to return Database details.",
    _successCallback: null,
    _errorCallback: null,
    login: function(url, loginData, successCallback, errorCallback) {

      var that = this;

      that._successCallback = successCallback;
      that._errorCallback = errorCallback;

      var xhr = new XMLHttpRequest();
      xhr.onload = function() {
        try {
          response_json = JSON.parse(xhr.responseText)
        } catch(err) {
          response_json = JSON.parse(fixCrappyJSONStr(xhr.responseText))
        }

        if(response_json.code != 200) {
          that.failedLogginAttempt(response_json.msg);
          return;
        }

        after(0, function() {
          let appData = response_json.data.appData;
          let tenants = (response_json.data.tenants || []);
          let eulaToken = (response_json.data.eulaToken || null)
          if(appData != null && appData.length > 1) {
            that._db_details = {id: appData[0], key: appData[1]}
          }
          if(tenants.length > 0) {
            that._successCallback.apply(null, ["SELECT_TENANT", tenants]);
            return
          }
          else if (eulaToken != null) {
            let eulaUrl = response_json.data.eulaUrl;
            that._successCallback.apply(null, ["EULA", null, eulaToken, eulaUrl]);
            return
          }
          that._is_authenticated = true;
          that.loginApp(loginData)
        });
      }
      xhr.onerror = function() {
        // XHR failed for some reasons, Putting app in offline mode.
        // Select previous session tenant;
        tenantUserRefnum = that.getPeristed(loginData.email+"_last_tuRefnum");
        // Can't help if there's no tenantUserRefnum from previous session
        if(tenantUserRefnum == null) {
          that._errorCallback.apply(null, [that._timeout])
          return;
        }
        // Continue to use app offline
        loginData.tenantUserRefnum = tenantUserRefnum;
        after(0, function(){
          that._is_authenticated = false;
          that.loginApp(loginData);
        });
      }

      // Create FormData
      var params = [];
      for (var key in loginData) {
        params.push(key+"="+encodeURIComponent(loginData[key]))
      }
      params = "?"+params.join("&");
      // Send Request
      xhr.open("POST", url + params, true);
      xhr.send(null);
    },
    loginApp: function(credentials) {

      var that = this;
      var app_db = DatabaseHelper.getAppDB();
      var ssHelper = window.SecureStorageHelper;

      // Reset failed attempts
      app_db.transaction(
        function(tx) {
          var current_timestamp = strftime('%Y-%m-%d %H:%M:%S', new Date());
          tx.executeSql("INSERT INTO app_data(number_of_failed_attempts, updated_at) VALUES(?, ?)", [0, current_timestamp], 
            function(res) {
              cl("updated app_data");
            });
        }, 
        function(err){
          cl("failed to update app_data");
          cl("Error --> "+err.message);
          cl(err.stack);
        });

      var sha = new jsSHA("SHA-256", "TEXT");
      sha.update(credentials.email+"@@"+credentials.pswd)
      var aes_key = sha.getHash("HEX");

      if(that._is_authenticated) {
        // Online mode

        if(that._db_details == null || that._db_details["id"] == null || that._db_details["key"] == null) {
          that._errorCallback.apply(null, [that._incorrect_db_details])
          return;
        }

        // Save DB Id & Key
        that.setPersist(credentials.email+"_db_id", that._db_details["id"])
        ssHelper.set(that._db_details["id"], that._db_details["key"]);

        // Decrypt db_details["key"]
        let decrypted_str = encHelper.aesDecrypt(aes_key, that._db_details["key"])
        
        // Close Dialog
        window.plugins.spinnerDialog.hide();
        that.createSecureDB(credentials, that._db_details["id"], decrypted_str, credentials.tenantUserRefnum);
      }
      else {
        // Offline mode

        // Get DB Id
        var db_id = that.getPeristed(credentials.email+"_db_id") || ""
        if(db_id.length < 1) {
          that._errorCallback.apply(null, [that._timeout])
          return;
        }
        // Get DB Key
        ssHelper.get(db_id, function(isSuccess, value, errorMessage) {
          if(isSuccess) {
            // Decrypt value (aka dbKey)
            let decrypted_str = encHelper.aesDecrypt(aes_key, value)
            that.createSecureDB(credentials, db_id, decrypted_str, credentials.tenantUserRefnum);
          }
          else {
            that.failedLogginAttempt();
          }
        })
      }
    },
    createSecureDB: function(credentials, db_id, db_key, tenantRefnum="main") {

      var that = this;

      // NOTE: Key must be 32byte(256 bit) String.
      // TODO: Do nothing, use db_key as-is.
      
      DatabaseHelper.setSecureDB(db_id+"_"+tenantRefnum, db_key)
        .then(function(status){
          // Continue Login Flow
          after(0, function(){
            let lastTuRefnum = that.getPeristed(credentials.email+"_last_tuRefnum");
            // save tenantUserRefnum selection for offline access
            that.setPersist(credentials.email+"_last_tuRefnum", tenantRefnum);
            // First-Time user logic
            if (lastTuRefnum == null) {
              that._successCallback.apply(null, ["NEW_LOGIN"])
            }
            else {
              that._successCallback.apply(null, ["LOGIN"])
            }
          });            
        }) // End of .then
        .catch(function(cause){
          // Error logging and further actions  
          cl("Error creating/decrypting secure DB");
          errorLog(cause);
          that.failedLogginAttempt();
        })
    },
    failedLogginAttempt: function(msg = "Unable to login") {
      that = this
      var app_db = DatabaseHelper.getAppDB();
      app_db.transaction(
        function(tx){
          var current_timestamp = strftime('%Y-%m-%d %H:%M:%S', new Date());
          tx.executeSql("UPDATE app_data SET number_of_failed_attempts = number_of_failed_attempts + 1, updated_at = ?", [current_timestamp], 
            function(res){
              cl("updated app_data");
            });
        },
        function(err){
          cl("failed to update app_data");
          cl("Error --> "+err.message);
          cl(err.stack);
        });
      after(0, function() {
        that._errorCallback.apply(null, [msg])
      });
    },
    fixCrappyJSONStr: function(json_str) {
      return json_str.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2": ');
    },
    getPeristed: function(key) {
      if(!localStorage)
        return null;
      var data = localStorage.getItem(key);
      if(data && data[0] === '{'){
        return JSON.parse(data);
      } else {
        return data;
      }
    },
    get: function(key) {
      if(!sessionStorage)
        return null;
      var data = sessionStorage.getItem(key);
      if(data && data[0] === '{'){
        return JSON.parse(data);
      } else {
        return data;
      }
    },
    setPersist: function(key, value) {
      if(localStorage) {
        localStorage.setItem(key, value);
      }
    },
    set: function(key, value) {
      if(sessionStorage) {
        sessionStorage.setItem(key, value);        
      }
    }
  };

  return LoginHelper;

});



  // var login = $.ajax({
  //   url : url,
  //   data : loginData,
  //   type : 'POST',
  //   dataType : 'TEXT',
  //   timeout: 30000
  // });

  // login.done(function(response) {

  //   try {
  //     response_json = JSON.parse(response)
  //   } catch(err) {
  //     response_json = JSON.parse(fixCrappyJSONStr(response))
  //   }

  //   if(response_json.code != 200) {
  //     after(0, function(){
  //       that.failedLogginAttempt(response_json.msg);
  //     })
  //   }

  //   after(0, function() {
  //     let appData = response_json.data.appData;
  //     let tenants = (response_json.data.tenants || []);
  //     let eulaToken = (response_json.data.eulaToken || null)
  //     if(appData != null && appData.length > 1) {
  //       that._db_details = {id: appData[0], key: appData[1]}
  //     }
  //     if(tenants.length > 0) {
  //       that._successCallback.apply(null, ["SELECT_TENANT", tenants]);
  //       return
  //     }
  //     else if (eulaToken != null) {
  //       let eulaUrl = response_json.data.eulaUrl;
  //       that._successCallback.apply(null, ["EULA", null, eulaToken, eulaUrl]);
  //       return
  //     }
  //     that._is_authenticated = true;
  //     that.loginApp(loginData)
  //   });
  // });

  // login.fail(function(xhr, textStatus, errorThrown) {

  //   if(textStatus != "timeout" || textStatus != "error") {
  //     that._errorCallback.apply(null, ["Unknown Error"])
  //     return;
  //   }

  //   // Select previous session tenant;
  //   tenantUserRefnum = that.getPeristed(loginData.email+"_last_tuRefnum");
  //   // Can't help if there's no tenantUserRefnum from previous session
  //   if(tenantUserRefnum == null) {
  //     that._errorCallback.apply(null, [that._timeout])
  //     return;
  //   }
  //   // Continue to use app offline
  //   loginData.tenantUserRefnum = tenantUserRefnum;
  //   after(0, function(){
  //     that._is_authenticated = false;
  //     that.loginApp(loginData);
  //   });

  // });