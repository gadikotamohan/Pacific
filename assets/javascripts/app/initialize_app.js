require([
  'capsico_app',
  'helpers/bootstrap_helpers'
], function(CapsicoApp, bootstrapHelpers) {
  $.fn.serializeObject = function () {
      "use strict";
      var a = {}, b = function (b, c) {
          var d = a[c.name];
          "undefined" != typeof d && d !== null ? $.isArray(d) ? d.push(c.value) : a[c.name] = [d, c.value] : a[c.name] = c.value
      };
      return $.each(this.serializeArray(), b), a
  };

  var startApp = function() {
    setTimeout(function(){
      setupBootStrapNavLinks();
      window.app = new CapsicoApp();
    }, 0);
  }

  var getUnixTimestamp = function() {
    // Returns time in milliseconds
    return Math.round((new Date()).getTime());
  }

  var lockApp = function(){
    setTimeout(function(){
      redirect_from = "" // Current location
      db = DatabaseHelper.getSecureDB();
      if (!redirect_from.startsWith("#login"))
        {
          // Save current_location as redirect_from 
        }
      if(db != null)
        {
          db.close();
        }
      // TODO Naviate to Login
    }, 0);
  }

  var onPause = function(event) {
    current_time = getUnixTimestamp();
    console.log("Application Paused at: ", current_time);
    localStorage.setItem("pause_timestamp", current_time);
  }

  var onResume = function(event) {
    current_time = getUnixTimestamp();
    console.log("Application Resume at: ", current_time);
    pause_time = localStorage.getItem("pause_timestamp", current_time);
    if (current_time - pause_time >= 10000) {
      lockApp();
    }
  }

  if (!!window.cordova) {
    document.addEventListener("deviceready", startApp, false);
    document.addEventListener("pause", onPause, false);
    document.addEventListener("resume", onResume, false);
  } else {
    startApp();
  }
  window.startApp = startApp;
  window.lockApp = lockApp;
});