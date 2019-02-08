define(function(require, exports, module) {

  var AppConfig = require('config');
  var Backbone  = require('backbone')
  var LoginHelper = require('login_helper')
    
  var SessionModel = Backbone.Model.extend({
      
      path: AppConfig.login.path,
      isAuthenticated: false,
      db_details: null,
      host: AppConfig.serverName,
      url: AppConfig.serverName + AppConfig.login.path,
      initialize : function() {
        if(Storage && sessionStorage){
          this.supportStorage = true;
        }
      },
      login : function(credentials, tenantsCallback){
        var that = this;
        var tenantUserRefnum = credentials.tenantUserRefnum;
        var url = window.serverName + AppConfig.login.path;

        var loginCallback = function(type, tenantsList, eulaToken, eulaUrl) {
          // Close Loading Dialog
          window.plugins.spinnerDialog.hide();
          window.plugins.spinnerDialog.hide();

          that.set('authenticated', true);
          if(that.get('redirectFrom') != null){
            var path = that.get('redirectFrom');
            that.unset('redirectFrom');
          }

          if(type == "SELECT_TENANT") {
            tenantsCallback.apply(null, [tenantsList]);
          }
          else if (type == "EULA") {
            tenantsCallback.apply(null, [null, eulaToken, eulaUrl, credentials.tenantUserRefnum]);
          }
          else if (type == "LOGIN") {
            // Sync data in background
            Backbone.history.navigate((path || "#home"), { trigger : true, replace: true });

          }
          else {
            Backbone.history.navigate("#first_time_user", { trigger : true, replace: true });
          }

        }
        var errorCallback = function(errorMessage) {
          // Close Loading Dialog
          window.plugins.spinnerDialog.hide();
          window.plugins.spinnerDialog.hide();
          alert(errorMessage);
        }

        window.plugins.spinnerDialog.show("Signing in", "Please wait..", true);
        LoginHelper.login(url, credentials, loginCallback, errorCallback);
      }
  });

  return new SessionModel();
});



