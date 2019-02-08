define(function(require, exports, module) {
  var app_db_migration = require('text!../database/migrations/app_db.json')
  var config = require('config')
  var app_db_migration = JSON.parse(app_db_migration);
  _.each(app_db_migration.migrations, function(migration){
    persistence_sqlite.defineMigration(migration.version, {
      up: function() {
        var that = this;
        _.each(migration.up, function(sql_stmnt){
          console.log("Executing "+sql_stmnt);
          that.executeSql(sql_stmnt);
        })
      }
    });
  })
  var AppData = require('app_db_models/app_db');
  var Session = require('models/session_model')

  persistence_sqlite.defineMigration(3, {
    up: function() {
      var app_data = new AppData();
      app_data.first_time_user = 0;
      console.log("inserting new row");
      persistence_sqlite.add(app_data);
      persistence_sqlite.flush();
      Session.set('ftu', true);
    }
  });

  return app_db_migration
});