define(function(require, exports, module){
  var CapsicoConfig = require('config');
  function DatabaseHelperClass(password) {
    return this;
  }
  function DatabaseHelperClass(){
    this.secure_db = undefined;
    return this;
  }
  DatabaseHelperClass.prototype.getSecureDB = function(){
    return this.secure_db;
  }
  DatabaseHelperClass.prototype.getAppDB = function(){
    return this.app_db;
  }
  DatabaseHelperClass.prototype.setSecureDB = function(db_name, password){
    var _self = this;
    var p = new Promise(function(resolve, reject){
      persistence.store.sqlcipher.config(
        persistence,
        `${db_name}.db`,
        password,
        '0.0.1',                // DB version
        'Enc db',               // DB display name
        5 * 1024 * 1024,        // DB size (WebSQL fallback only)
        0,                      // SQLitePlugin Background processing disabled
        2                       // DB location (iOS only), 0 (default): Documents, 1: Library, 2: Library/LocalDatabase
      );
      // Get Connection
      _self.secure_db = persistence_sqlcipher.getConnection();
      // Run a Test transaction
      persistence_sqlcipher.transaction(function(tr) { /* Empty Transac */ }, 
        function(error) { 
          reject(error);
        }, 
        function(success) { 
          persistence_sqlcipher.migrations.init(function() {
            // Optional callback to be executed after initialization
            var t = require('user_db_migrations');
            persistence_sqlcipher.migrate(function(){
              resolve(true)
            })
          });
        });
    });
    return p;
  }

  DatabaseHelperClass.prototype.setAppDB = function(){
    var _self = this;
    var p = new Promise(function(resolve, reject){
    persistence_sqlite.store.cordovasql.config(
      persistence_sqlite,
      'app_data.db',
      '0.0.1',                // DB version
      'My database',          // DB display name
      5 * 1024 * 1024,        // DB size (WebSQL fallback only)
      0,                      // SQLitePlugin Background processing disabled
      2                       // DB location (iOS only), 0 (default): Documents, 1: Library, 2: Library/LocalDatabase
    );
    _self.app_db = persistence_sqlite.getConnection();
    persistence_sqlite.migrations.init(function() {
      // Optional callback to be executed after initialization
      var t = require('app_db_migrations');
      persistence_sqlite.migrate(function(){
        resolve(true);
      })
    });

    });
    return p;
  }
  var instance;
  DatabaseHelper = {
    getInstance: function(){
      if (instance == null) {
        instance = new DatabaseHelperClass();
        // Hide the constructor so the returned objected can't be new'd...
        instance.constructor = null;
      }
      return instance.setAppDB();
    },
    setSecureDB: function(db_name, password){
      _that = this;
      return instance.setSecureDB(db_name, password);
    },
    setAppDB: function(callback){
      return instance.setAppDB(callback);
    },
    getSecureDB: function(){
      return instance.getSecureDB();
    },
    getAppDB: function(){
      return instance.getAppDB();
    },
    deleteDB: function(name){
      var p = new Promise(function(resolve, reject){
        window.sqlitePlugin.deleteDatabase({name: name, location: 2}, function(success){
          resolve(true);
        }, function(error){
          errorLog(error);
          reject(error);
        });
      });
      return p;
    }
 };
 return DatabaseHelper;
});