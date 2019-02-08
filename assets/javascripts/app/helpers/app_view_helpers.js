// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Date extensions
// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**
 * Takes a date time string as 'YYYY.MM.DD' where the separator characters don't matter.
 * 
 * @param DateTimeStr
 * @returns {Date}
 */
function parseDate(DateTimeStr)
{
  var yea = DateTimeStr.substring( 0,  4);
  var mon = DateTimeStr.substring( 5,  7);
  var day = DateTimeStr.substring( 8, 10);
  
  var d = new Date(yea, mon-1, day);

  return d;
}

Date.distance_of_time_in_seconds = function(from_data, to_date)
{
  var diff = Math.abs(from_data - to_date);
  return diff/1000;
}

Date.distance_of_time_in_minutes = function(from_data, to_date)
{
  return Math.floor(Date.distance_of_time_in_seconds(from_date, to_date)/60);
}

Date.prototype.getAge = function()
{
  var today = new Date();
  var age = today.getFullYear() - this.getFullYear();
  // compare month and day to check if birthday has happened already. If not, substract 1. to age.
  if (today.getMonth() < this.getMonth() || today.getMonth() == this.getMonth() && today.getDate() < this.getDate())
    --age;
  return age;
}

// range
Number.prototype.between = function(a, b) {
  var min = Math.min.apply(Math, [a, b]),
    max = Math.max.apply(Math, [a, b]);
  return this >= min && this <= max;
};


// Alias methods

function cl(obj){
  console.log(obj);
}

function after(ms, cb) {
  return setTimeout(cb, ms);
};

function fixCrappyJSONStr(json_str){
  return json_str.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2": ');
}


// Toast messages
function showToast(message) {
  window.plugins.toast.show(
    message, 'long', 'center', function(a){}, function(b){}
  );
}

function toUpdateSql(tableName, object, where_condition){
  // "UPDATE table_name SET column1=value1,column2=value2,..."
  var update_sql = "UPDATE "+tableName+" SET %%COLUMN_VALUE%% WHERE %%CONDITION%%";
  var column_values = []
  _.each(object, function (value, key) {  
    column_values.push(key+"=?");
  });
  where_condition_1 = _.map(where_condition, function(value, key){
    sql_value = undefined
    if(value instanceof Array){
      sql_value = "\'"+value.join(",")+"\'";
    } else if(typeof(value) == "string" || typeof(value) == "boolean"){
      sql_value = "\'"+value+"\'";
    } else {
      sql_value = value
    }
    return key+"="+sql_value
  })
  if(where_condition_1.length == 0){
    return update_sql.replace("%%COLUMN_VALUE%%", column_values.join(",")).replace("WHERE %%CONDITION%%", "");
  } else {
    return update_sql.replace("%%COLUMN_VALUE%%", column_values.join(",")).replace("%%CONDITION%%", where_condition_1.join(" AND "));
  }
  
}

function toInsertSql(tableName, object){
  var insert_sql = "INSERT INTO "+tableName+"(%%COLUMNS%%) values(%%VALUES%%)"
  var columns = [];
  var values = []
  var columns = _.keys(object);
  var values = _.filter(Array(columns.length+1).join("?$").split("$"), function(e){ return e.length > 0 });
  return insert_sql.replace("%%COLUMNS%%", columns.join(",")).replace("%%VALUES%%", values)
}

function toDeleteSql(tableName, where_condition){
  if(where_condition == null){
    var e = new CustomError("where_condition is undefined");
  }

  var delete_sql = "DELETE from "+tableName + " WHERE %%CONDITIONS%%";
  where_condition_1 = _.map(where_condition, function(value, key){
    sql_value = undefined
    if(value instanceof Array){
      sql_value = "\'"+value.join(",")+"\'";
    } else if(typeof(value) == "string" || typeof(value) == "boolean"){
      sql_value = "\'"+value+"\'";
    } else {
      sql_value = value
    }
    return key+"="+sql_value
  });
  return delete_sql.replace("%%CONDITIONS%%", where_condition_1.join(" AND "));
}

// function toQuerySql(tableName, condition){
//   var insert_sql = "select * from "+tableName+" WHERE %%CONDITIONS%"
//   var columns = [];
//   var values = []
//   var columns = _.keys(object);
//   var values = _.filter(Array(columns.length+1).join("?$").split("$"), function(e){ return e.length > 0 });
//   return insert_sql.replace("%%COLUMNS%%", columns.join(",")).replace("%%VALUES%%", values)
// }

function RiskScale(score){
  return score < 0.4 ? 1 : score < 0.55 ? 2 : score < 0.70 ? 3 : score < 0.9 ? 4 : 5;
}


Array.prototype.isExists = function(element){
  return this.indexOf(element) != -1
}


function $http(url){
 
  // A small example of object
  var core = {

    // Method that performs the ajax request
    ajax : function (method, url, args) {

      // Creating a promise
      var promise = new Promise( function (resolve, reject) {

        // Instantiates the XMLHttpRequest
        var client = new XMLHttpRequest();
        var uri = url;
        if(method == "GET"){
          if (args) {
            uri += '?';
            var argcount = 0;
            for (var key in args) {
              if (args.hasOwnProperty(key)) {
                if (argcount++) {
                  uri += '&';
                }
                uri += encodeURIComponent(key) + '=' + encodeURIComponent(args[key]);
              }
            }
          }
          client.open(method, uri);
          client.send();
        } else {
            var params = JSON.stringify(args);
            client.open(method, uri, true);

            client.setRequestHeader("Content-type", "application/json; charset=utf-8");
            client.send(params);
        }
        var rejectFunc = function(statusCode){
          if(this.status == 401){
            reject(new NotAuthorized("Looks like user session has timed out"));
          } else {
            reject(new InternalServerError("Server responded with "+this.status));
          }

        }
        client.onload = function () {
          if (this.status >= 200 && this.status < 300) {
            // Performs the function "resolve" when this.status is equal to 2xx
            var data = JSON.parse(this.response);
            if(data.code >=200 && data.code < 300){
              resolve(data);
            }
            else{params
              rejectFunc(data.code);
            }
          } else {
            // Performs the function "reject" when this.status is different than 2xx
            rejectFunc(this.status);
          }
        };
        client.onerror = function () {
          reject(new UnableToConnect("Unable to connect to server"));
        };
      });

      // Return the promise
      return promise;
    }
  };

  // Adapter pattern
  return {
    'get' : function(args) {
      return core.ajax('GET', url, args);
    },
    'post' : function(args) {
      return core.ajax('POST', url, args);
    },
    'put' : function(args) {
      return core.ajax('PUT', url, args);
    },
    'delete' : function(args) {
      return core.ajax('DELETE', url, args);
    }
  };
};


function CustomError(message) {
    this.message = (message || "");
}
CustomError.prototype = new Error();


function UnableToConnect(message) {
    this.message = (message || "");
}
UnableToConnect.prototype = new Error();


function NotAuthorized(message) {
    this.message = (message || "");
}
NotAuthorized.prototype = new Error();

function InternalServerError(message) {
    this.message = (message || "");
}
InternalServerError.prototype = new Error();


function errorLog(error){
  cl(error.message);
  cl(error.stack);
}
function dbPromiseQuery(sqlString, params, secureDB){
  // signature --> sqlString, params --> array
  var db = undefined;
  var DatabaseHelper = require('database_helper');
  if(secureDB){
    db = DatabaseHelper.getSecureDB();
  } else {
    db = DatabaseHelper.getAppDB();
  }
  cl("DOING QUERY --> "+sqlString);
  var p = new Promise(function(resolve, reject){
    db.executeSql(sqlString, params, function(res){
      cl("DONE QUERY SUCCESS --> "+sqlString);
      resolve(res);
    }, function(error){
      // Log error
      cl("DONE QUERY HAS ERROR --> "+sqlString);
      errorLog(error);
      reject(error);
    });
  });
  return p;
}


function areObjectsEqual(object1, object2){
  var result = _.chain(object1)
    .keys()
    .every(function(currentKey) {
        return _.has(object2, currentKey) &&
            _.isEqual(object1[currentKey], object2[currentKey]);
    }).value();
  return result;
}