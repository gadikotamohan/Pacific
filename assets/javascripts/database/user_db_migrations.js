define(function(require, exports, module) {
  var _            = require('underscore');
  user_db_migration = require('text!../database/migrations/user_db.json')
  user_db_migration = JSON.parse(user_db_migration);
  _.each(user_db_migration.migrations, function(migration){
    persistence_sqlcipher.defineMigration(migration.version, {
      up: function() {
        var that = this;
        _.each(migration.up, function(sql_stmnt){
          cl(sql_stmnt);
          that.executeSql(sql_stmnt)
        })
      }
    });
  })

  return user_db_migration;
});