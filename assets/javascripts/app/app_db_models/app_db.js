define(function(require, exports, module) {
  // "CREATE TABLE IF NOT EXISTS app_data(id integer primary key AUTOINCREMENT,
  // first_time_user INTEGER DEFAULT 0, 
  // last_try DATETIME,
  // number_of_failed_attempts INTEGER DEFAULT 0,
  // created_at DATETIME,
  // signed_in_at DATETIME, updated_at DATETIME)"
  var AppData = persistence_sqlite.define('app_data', {
    last_try: "DATE",
    number_of_failed_attempts: "INT",
    created_at: "DATE",
    signed_in_at: "DATE"
  });
  AppData.first = function(){
    var p = new Promise(function(resolve, reject){
      AppData.all().one(null, function(app_data){
        resolve(app_data)
      })
    }, function(error){
      errorLog(error);
      reject(error)
    });
    return p;
  }
  AppData.prototype.save = function(){
    persistence_sqlite.add(this);
  }
  return AppData;
});