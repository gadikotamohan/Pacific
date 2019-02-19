
define(function(require, exports, module) {
  var AppConfig = {
    defaultPassword: "demo",
    serverName: (window.serverName == null || window.serverName.length == 0) ? "https://demo.capsicohealth.com" : window.serverName,
    login:{
      params:{
        email: "user@example.com",
        pswd: ""
      },
      path: "/web/svc/Login"
    }
  };
  return AppConfig;
});