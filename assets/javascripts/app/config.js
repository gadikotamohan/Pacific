
define(function(require, exports, module) {
  var AppConfig = {
    defaultPassword: "demo",
    serverName: (window.serverName == null || window.serverName.length == 0) ? "https://demo.capsicohealth.com" : window.serverName,
    users: {
      list: {
        path: "/admin/svc/admin/users"
      }
    },
    login:{
      params:{
        email: "user@example.com",
        pswd: ""
      },
      path: "/admin/svc/Login"
    }
  };
  return jQuery.extend(true, {serverName: window.serverName}, AppConfig);
});