
define(function(require, exports, module) {
  var AppConfig = {
    defaultPassword: "demo",
    serverName: (window.serverName == null || window.serverName.length == 0) ? "https://172.16.0.30:8443" : window.serverName,
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
  return AppConfig;
});