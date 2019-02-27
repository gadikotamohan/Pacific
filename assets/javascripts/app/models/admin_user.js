define(function(require, exports, module) {

  var User = {}

  User.fromJSON = function(jsonObjectArr) {
    var db = DatabaseHelper.getSecureDB();
    var promises = []
    for(let i=0; i<jsonObjectArr.length; i++) {
      let json = jsonObjectArr[i];
      let dbP = dbPromiseQuery("SELECT * from users where personRefnum = ? LIMIT 1", [json.personRefnum], true);
      dbP.then(function(res) {
        // Prepare Data
        let obj = { personRefnum: json.personRefnum, data: JSON.stringify(json) }
        let condition = { personRefnum: obj.personRefnum }
        let values = _.values(obj);
        // Check if INSERT OR UPDATE
        if(res.rows.length > 0) {
          return dbPromiseQuery(toUpdateSql("users", obj, condition), values, true)
        } else {
          return dbPromiseQuery(toInsertSql("users", obj), values, true)
        }
      })
      .then(function(res) {
        return res;
      })
      .catch(function(error) {
        errorLog(error);
      })
      promises.push(dbP);
    }
    return Promise.all(promises);
  }

  return User;
});