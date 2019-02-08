define(function(require, exports, module){

  var AppConfig = require('config');
  var BaseView  = require('core/base_view');
  var Session   = require('models/session_model');

  if(Session.get("login_failed_attempts") == null){
    Session.set("login_failed_attempts", 0);
  }

  var LoginView = BaseView.extend({
    template: _.template(require('text!templates/login.html')),
    eulaTemplate: _.template(require('text!templates/_eula.html')),
    domainNameTemplate: _.template(require("text!templates/_server_name.html")),
    selectTenantTemplate: _.template(require("text!templates/_tenant_select.html")),
    modal_html: _.template(require('text!templates/generic_modal.html')),
    touchedPoints: {},
    touchedPointCount: 0,
    hammerEvents: {
      'tap .selectTenant': 'selectTenant',
      'tap .agreeEula': 'submitEula',
      'tap .settings-img': 'openDomainPopUp',
      'doubletap .logo-img': 'openDomainPopUp',
      "submit form.loginForm": "login",
      'submit form.changeDomainName': 'save_server_name',
    },
    cleanupModals: function() {
      if($('.modal').length > 0){
        $('.modal' ).modal( 'hide' ).data( 'bs.modal', null );
        $('.modal').remove();
      }
    },
    openEulaPopup: function(token, url, tuRefnum) {
      this.cleanupModals();
      var eula_form = this.eulaTemplate({token: encodeURIComponent(token), tuRefnum: tuRefnum});
      var modal_title = "End User License Agreement";
      this.$el.append(this.modal_html({
        modal_id: "eula_popup",
        modal_title: modal_title,
        modal_body: "",
        backdrop: true,
        keyboard: false
      }));
      after(100, function(){
        // Load EULA html dynamically
        $('.modal-body').load(window.serverName + eulaUrl, function() {
          // Add Accept Button
          $('.modal-body').append(eula_form);
        })
        // Show Modal
        $('#eula_popup').modal('show');
      })
    },
    submitEula: function(e) {
      e.preventDefault();
      var that = this;
      var eula_token = $(e.target).data('eulatoken');
      var $form = $('form.loginForm');
      var obj = $form.serializeObject();
      obj.tenantUserRefnum = $(e.target).data('turefnum');
      obj.eulaToken = decodeURIComponent(eula_token);
      obj.accept = 1;
      this.cleanupModals();
      if(parseInt(Session.get("login_failed_attempts")) <= 3){
        Session.login(obj, function(someParams)
          {
            alert("this should not happen");
          });
      } else {
        showToast("For security reasons, your account is blocked, please try again after three minutes with correct password.");
      }
    },
    openTenantsPopUp: function(tenants) {
      this.cleanupModals();
      var content = this.selectTenantTemplate({tenants: tenants});
      var modal_title = "You have access to following systems, please select one.";
      this.$el.append(this.modal_html({
        modal_title: modal_title, modal_body: content, modal_id: "select_tenant_popup",
        backdrop: true,
        keyboard: false
      }));
      after(500, function(){
        $('#select_tenant_popup').modal('show');        
      })
    },
    selectTenant: function(e) {
      e.preventDefault();
      var that = this;
      var $form = $('form.loginForm');
      var obj = $form.serializeObject();
      obj.tenantUserRefnum = $(e.target).data('tenantuserrefnum');
      this.cleanupModals();
      if(parseInt(Session.get("login_failed_attempts")) <= 3){
        Session.login(obj, function(tenants, eulaToken, eulaUrl, tuRefnum)
          {
            that.openEulaPopup(eulaToken, eulaUrl, tuRefnum)
            // alert("this should not happen");
          });
      } else {
        showToast("For security reasons, your account is blocked, please try again after three minutes with correct password.");
      }
    },
    openDomainPopUp: function() {
      if($('.modal').length > 0){
        $('.modal' ).modal( 'hide' ).data( 'bs.modal', null );
        $('.modal').remove();
      }
      var new_form_p = this.domainNameTemplate({value: AppConfig.serverName});
      var modal_title = "Change domain or serverName";
      this.$el.append(this.modal_html({
        modal_title: modal_title, modal_body: new_form_p, modal_id: "change_domain_popup",
        backdrop: true,
        keyboard: false
      }));
      after(500, function(){
        $('#change_domain_popup').modal('show');
      })
    },
    save_server_name: function(event) {
      event.preventDefault();
      var $form = $(event.target);
      var obj = $form.serializeObject();
      var _this = this;
      var dbPromise = dbPromiseQuery(toUpdateSql("app_data", obj), _.values(obj), false);
      dbPromise.then(function(data){
        cl("OK DONE");
        window.serverName = obj.serverName;
        Session.set("ftu", true);
        $('#change_domain_popup').modal('hide');
      });
      dbPromise.catch(function(cause){
        alert(cause.message);
        errorLog(cause);
      });
      return false;
    },
    render: function() {
      var _this = this;
      _this.$el.html(_this.template({version: "Alpha"}));
      $('body').addClass('login-bg');
      after(0, function(){
        if(DatabaseHelper.getAppDB().openDBs["user_data.db"] != null){
          DatabaseHelper.getSecureDB().close();
        }
      });
      return this;
    },
    login: function(e) {
      e.preventDefault();
      var that = this;
      var $form = $(e.target);
      var obj = $form.serializeObject();
      if(parseInt(Session.get("login_failed_attempts")) <= 3){
        Session.login(obj, function(tenants, eulaToken, eulaUrl, tuRefnum)
          {
            if(tenants != null)
              that.openTenantsPopUp(tenants);
            else
              that.openEulaPopup(eulaToken, eulaUrl, tuRefnum);
          });
      } else {
        showToast("For security reasons, your account is blocked, please try again after three minutes with correct password.");
      }
      return false;
    }
  });

  return LoginView;
});
  