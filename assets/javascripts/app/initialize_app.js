require([
  'capsico_app',
  'helpers/bootstrap_helpers',
  'models/session_model'
], function(CapsicoApp, bootstrapHelpers, Session) {
  $.fn.serializeObject = function () {
      "use strict";
      var a = {}, b = function (b, c) {
          var d = a[c.name];
          "undefined" != typeof d && d !== null ? $.isArray(d) ? d.push(c.value) : a[c.name] = [d, c.value] : a[c.name] = c.value
      };
      return $.each(this.serializeArray(), b), a
  };
  var Backbone = require('backbone');

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
      redirect_from = Backbone.history.location.hash
      db = DatabaseHelper.getSecureDB();
      Session.unset('authenticated');
      if (!redirect_from.startsWith("#login"))
        {
          Session.set('redirectFrom', Backbone.history.location.hash);
        }
      if(db != null)
        {
          db.close();
        }
      console.log("redirectFrom = ", Backbone.history.location.hash);
      window.app.router.navigate("#login", {trigger: true, replace: true});
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