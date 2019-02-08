try {
  if (!window) {
    window = {};
    //exports.console = console;
  }
} catch (e) {
  window = {};
  exports.console = console;
}

var persistence = (window && window.persistence_sqlite) ? window.persistence_sqlite : initPersistence(window.persistence_sqlite || {});
;

if (!persistence.store) {
  persistence.store = {};
}



/**
 * Default type mapper. Override to support more types or type options.
 */
var defaultTypeMapper = {
  /**
   * SQL type for ids
   */
  idType: "VARCHAR(32)",

  /**
   * SQL type for class names (used by mixins)
   */
  classNameType: "TEXT",

  /**
   * Returns SQL type for column definition
   */
  columnType: function(type){
    switch(type) {
    case 'JSON': return 'TEXT';
    case 'BOOL': return 'INT';
    case 'DATE': return 'INT';
    default: return type;
    }
  },

  inVar: function(str, type){
    return str;
  },
  outVar: function(str, type){
    return str;
  },
  outId: function(str){
    return "'" + str + "'";
  },
  /**
   * Converts a value from the database to a value suitable for the entity
   * (also does type conversions, if necessary)
   */
  dbValToEntityVal: function(val, type){
    if (val === null || val === undefined) {
      return val;
    }
    switch (type) {
      case 'DATE':
        // SQL is in seconds and JS in miliseconds
        if (val > 1000000000000) {
          // usually in seconds, but sometimes it's milliseconds
          return new Date(parseInt(val, 10));
        } else {
          return new Date(parseInt(val, 10) * 1000);
        }
      case 'BOOL':
        return val === 1 || val === '1';
        break;
      case 'INT':
        return +val;
        break;
      case 'BIGINT':
        return +val;
        break;
      case 'JSON':
        if (val) {
          return JSON.parse(val);
        }
        else {
          return val;
        }
        break;
      default:
        return val;
    }
  },

  /**
   * Converts an entity value to a database value, inverse of
   *   dbValToEntityVal
   */
  entityValToDbVal: function(val, type){
    if (val === undefined || val === null) {
      return null;
    }
    else if (type === 'JSON' && val) {
      return JSON.stringify(val);
    }
    else if (val.id) {
      return val.id;
    }
    else if (type === 'BOOL') {
      return (val === 'false') ? 0 : (val ? 1 : 0);
    }
    else if (type === 'DATE' || val.getTime) {
      // In order to make SQLite Date/Time functions work we should store
      // values in seconds and not as miliseconds as JS Date.getTime()
      val = new Date(val);
      return Math.round(val.getTime() / 1000);
    }
    else if(type === 'VARCHAR(32)'){
      return val.toString();
    }
    else {
      return val;
    }
  },
  /**
   * Shortcut for inVar when type is id -- no need to override
   */
  inIdVar: function(str){
    return this.inVar(str, this.idType);
  },
  /**
   * Shortcut for outVar when type is id -- no need to override
   */
  outIdVar: function(str){
    return this.outVar(str, this.idType);
  },
  /**
   * Shortcut for entityValToDbVal when type is id -- no need to override
   */
  entityIdToDbId: function(id){
    return this.entityValToDbVal(id, this.idType);
  }
}

function config(persistence, dialect) {
  var argspec = persistence.argspec;

  persistence.typeMapper = dialect.typeMapper || defaultTypeMapper;

  persistence.generatedTables = {}; // set

  /**
   * Synchronize the data model with the database, creates table that had not
   * been defined before
   *
   * @param tx
   *            transaction object to use (optional)
   * @param callback
   *            function to be called when synchronization has completed,
   *            takes started transaction as argument
   */
  persistence.schemaSync = function (tx, callback, emulate) {
    var args = argspec.getArgs(arguments, [
        { name: "tx", optional: true, check: persistence.isTransaction, defaultValue: null },
        { name: "callback", optional: true, check: argspec.isCallback(), defaultValue: function(){} },
        { name: "emulate", optional: true, check: argspec.hasType('boolean') }
      ]);
    tx = args.tx;
    callback = args.callback;
    emulate = args.emulate;

    if(!tx) {
      var session = this;
      this.transaction(function(tx) { session.schemaSync(tx, callback, emulate); });
      return;
    }
    var queries = [], meta, colDefs, otherMeta, tableName;

  var tm = persistence.typeMapper;
    var entityMeta = persistence.getEntityMeta();
    for (var entityName in entityMeta) {
      if (entityMeta.hasOwnProperty(entityName)) {
        meta = entityMeta[entityName];
        if (!meta.isMixin) {
          colDefs = [];
          for (var prop in meta.fields) {
            if (meta.fields.hasOwnProperty(prop)) {
              colDefs.push([prop, meta.fields[prop]]);
            }
          }
          for (var rel in meta.hasOne) {
            if (meta.hasOne.hasOwnProperty(rel)) {
              otherMeta = meta.hasOne[rel].type.meta;
              colDefs.push([rel, tm.idType]);
              queries.push([dialect.createIndex(meta.name, [rel]), null]);
            }
          }
          for (var i = 0; i < meta.indexes.length; i++) {
            queries.push([dialect.createIndex(meta.name, meta.indexes[i].columns, meta.indexes[i]), null]);
          }
        }
        for (var rel in meta.hasMany) {
          if (meta.hasMany.hasOwnProperty(rel) && meta.hasMany[rel].manyToMany) {
            tableName = meta.hasMany[rel].tableName;
            if (!persistence.generatedTables[tableName]) {
              var otherMeta = meta.hasMany[rel].type.meta;
              var inv = meta.hasMany[rel].inverseProperty;
              // following test ensures that mixin mtm tables get created with the mixin itself
              // it seems superfluous because mixin will be processed before entitites that use it
              // but better be safe than sorry.
              if (otherMeta.hasMany[inv].type.meta != meta)
                continue;
              var p1 = meta.name + "_" + rel;
              var p2 = otherMeta.name + "_" + inv;
              queries.push([dialect.createIndex(tableName, [p1]), null]);
              queries.push([dialect.createIndex(tableName, [p2]), null]);
              var columns = [[p1, tm.idType], [p2, tm.idType]];
              if (meta.isMixin)
                columns.push([p1 + "_class", tm.classNameType])
              if (otherMeta.isMixin)
                columns.push([p2 + "_class", tm.classNameType])
              queries.push([dialect.createTable(tableName, columns), null]);
              persistence.generatedTables[tableName] = true;
            }
          }
        }
        if (!meta.isMixin) {
          colDefs.push(["id", tm.idType, "PRIMARY KEY"]);
          persistence.generatedTables[meta.name] = true;
          queries.push([dialect.createTable(meta.name, colDefs), null]);
        }
      }
    }
    var fns = persistence.schemaSyncHooks;
    for(var i = 0; i < fns.length; i++) {
      fns[i](tx);
    }
    if(emulate) {
      // Done
      callback(tx);
    } else {
      executeQueriesSeq(tx, queries, function(_, err) {
          callback(tx, err);
        });
    }
  };

  /**
   * Persists all changes to the database transaction
   *
   * @param tx
   *            transaction to use
   * @param callback
   *            function to be called when done
   */
  persistence.flush = function (tx, callback) {
    var args = argspec.getArgs(arguments, [
        { name: "tx", optional: true, check: persistence.isTransaction },
        { name: "callback", optional: true, check: argspec.isCallback(), defaultValue: null }
      ]);
    tx = args.tx;
    callback = args.callback;

    var session = this;
    if(!tx) {
      this.transaction(function(tx) { session.flush(tx, callback); });
      return;
    }
    var fns = persistence.flushHooks;
    persistence.asyncForEach(fns, function(fn, callback) {
        fn(session, tx, callback);
      }, function() {
        // After applying the hooks
        var persistObjArray = [];
        for (var id in session.trackedObjects) {
          if (session.trackedObjects.hasOwnProperty(id)) {
            persistObjArray.push(session.trackedObjects[id]);
          }
        }
        var removeObjArray = [];
        for (var id in session.objectsToRemove) {
          if (session.objectsToRemove.hasOwnProperty(id)) {
            removeObjArray.push(session.objectsToRemove[id]);
            delete session.trackedObjects[id]; // Stop tracking
          }
        }
        session.objectsToRemove = {};
        if(callback) {
          persistence.asyncParForEach(removeObjArray, function(obj, callback) {
              remove(obj, tx, callback);
            }, function(result, err) {
              if (err) return callback(result, err);
              persistence.asyncParForEach(persistObjArray, function(obj, callback) {
                  save(obj, tx, callback);
                }, callback);
            });
        } else { // More efficient
          for(var i = 0; i < persistObjArray.length; i++) {
            save(persistObjArray[i], tx);
          }
          for(var i = 0; i < removeObjArray.length; i++) {
            remove(removeObjArray[i], tx);
          }
        }
      });
  };

  /**
   * Remove all tables in the database (as defined by the model)
   */
  persistence.reset = function (tx, callback) {
    var args = argspec.getArgs(arguments, [
        { name: "tx", optional: true, check: persistence.isTransaction, defaultValue: null },
        { name: "callback", optional: true, check: argspec.isCallback(), defaultValue: function(){} }
      ]);
    tx = args.tx;
    callback = args.callback;

    var session = this;
    if(!tx) {
      session.transaction(function(tx) { session.reset(tx, callback); });
      return;
    }
    // First emulate syncing the schema (to know which tables were created)
    this.schemaSync(tx, function() {
        var tableArray = [];
        for (var p in persistence.generatedTables) {
          if (persistence.generatedTables.hasOwnProperty(p)) {
            tableArray.push(p);
          }
        }
        function dropOneTable () {
          var tableName = tableArray.pop();
          tx.executeSql("DROP TABLE IF EXISTS `" + tableName + "`", null, function () {
              if (tableArray.length > 0) {
                dropOneTable();
              } else {
                cb();
              }
            }, cb);
        }
        if(tableArray.length > 0) {
          dropOneTable();
        } else {
          cb();
        }

        function cb(result, err) {
          session.clean();
          persistence.generatedTables = {};
          if (callback) callback(result, err);
        }
      }, true);
  };

  /**
   * Converts a database row into an entity object
   */
  function rowToEntity(session, entityName, row, prefix) {
    prefix = prefix || '';
    if (session.trackedObjects[row[prefix + "id"]]) { // Cached version
      return session.trackedObjects[row[prefix + "id"]];
    }
    var tm = persistence.typeMapper;
    var rowMeta = persistence.getMeta(entityName);
    var ent = persistence.define(entityName); // Get entity
    if(!row[prefix+'id']) { // null value, no entity found
      return null;
    }
    var o = new ent(session, undefined, true);
    o.id = tm.dbValToEntityVal(row[prefix + 'id'], tm.idType);
    o._new = false;
    for ( var p in row) {
      if (row.hasOwnProperty(p)) {
        if (p.substring(0, prefix.length) === prefix) {
          var prop = p.substring(prefix.length);
          if (prop != 'id') {
            o._data[prop] = tm.dbValToEntityVal(row[p], rowMeta.fields[prop] || tm.idType);
          }
        }
      }
    }
    return o;
  }

  /**
   * Internal function to persist an object to the database
   * this function is invoked by persistence.flush()
   */
  function save(obj, tx, callback) {
    var meta = persistence.getMeta(obj._type);
    var tm = persistence.typeMapper;
    var properties = [];
    var values = [];
    var qs = [];
    var propertyPairs = [];
    if(obj._new) { // Mark all properties dirty
      for (var p in meta.fields) {
        if(meta.fields.hasOwnProperty(p)) {
          obj._dirtyProperties[p] = true;
        }
      }
    }
    for ( var p in obj._dirtyProperties) {
      if (obj._dirtyProperties.hasOwnProperty(p)) {
        properties.push("`" + p + "`");
        var type = meta.fields[p] || tm.idType;
        values.push(tm.entityValToDbVal(obj._data[p], type));
        qs.push(tm.outVar("?", type));
        propertyPairs.push("`" + p + "` = " + tm.outVar("?", type));
      }
    }
    var additionalQueries = [];
    for(var p in meta.hasMany) {
      if(meta.hasMany.hasOwnProperty(p)) {
        additionalQueries = additionalQueries.concat(persistence.get(obj, p).persistQueries());
      }
    }
    executeQueriesSeq(tx, additionalQueries, function() {
        if (!obj._new && properties.length === 0) { // Nothing changed and not new
          if(callback) callback();
          return;
        }
        obj._dirtyProperties = {};
        if (obj._new) {
          properties.push('id');
          values.push(tm.entityIdToDbId(obj.id));
          qs.push(tm.outIdVar('?'));
          var sql = "INSERT INTO `" + obj._type + "` (" + properties.join(", ") + ") VALUES (" + qs.join(', ') + ")";
          obj._new = false;
          tx.executeSql(sql, values, callback, callback);
        } else {
          var sql = "UPDATE `" + obj._type + "` SET " + propertyPairs.join(',') + " WHERE id = " + tm.outId(obj.id);
          tx.executeSql(sql, values, callback, callback);
        }
      });
  }

  persistence.save = save;

  function remove (obj, tx, callback) {
    var meta = persistence.getMeta(obj._type);
  var tm = persistence.typeMapper;
    var queries = [["DELETE FROM `" + obj._type + "` WHERE id = " + tm.outId(obj.id), null]];
    for (var rel in meta.hasMany) {
      if (meta.hasMany.hasOwnProperty(rel) && meta.hasMany[rel].manyToMany) {
        var tableName = meta.hasMany[rel].tableName;
        //var inverseProperty = meta.hasMany[rel].inverseProperty;
        queries.push(["DELETE FROM `" + tableName + "` WHERE `" + meta.name + '_' + rel + "` = " + tm.outId(obj.id), null]);
      }
    }
    executeQueriesSeq(tx, queries, callback);
  }

  /**
   * Utility function to execute a series of queries in an asynchronous way
   * @param tx the transaction to execute the queries on
   * @param queries an array of [query, args] tuples
   * @param callback the function to call when all queries have been executed
   */
  function executeQueriesSeq (tx, queries, callback) {
    // queries.reverse();
    var callbackArgs = [];
    for ( var i = 3; i < arguments.length; i++) {
      callbackArgs.push(arguments[i]);
    }
    persistence.asyncForEach(queries, function(queryTuple, callback) {
        tx.executeSql(queryTuple[0], queryTuple[1], callback, function(_, err) {
            console.log(err.message);
            callback(_, err);
          });
      }, function(result, err) {
        if (err && callback) {
          callback(result, err);
          return;
        }
        if(callback) callback.apply(null, callbackArgs);
      });
  }

  persistence.executeQueriesSeq = executeQueriesSeq;

  /////////////////////////// QueryCollection patches to work in SQL environment

  /**
   * Function called when session is flushed, returns list of SQL queries to execute
   * (as [query, arg] tuples)
   */
  persistence.QueryCollection.prototype.persistQueries = function() { return []; };

  var oldQCClone = persistence.QueryCollection.prototype.clone;

  persistence.QueryCollection.prototype.clone = function (cloneSubscribers) {
    var c = oldQCClone.call(this, cloneSubscribers);
    c._additionalJoinSqls = this._additionalJoinSqls.slice(0);
    c._additionalWhereSqls = this._additionalWhereSqls.slice(0);
    c._additionalGroupSqls = this._additionalGroupSqls.slice(0);
    c._manyToManyFetch = this._manyToManyFetch;
    return c;
  };

  var oldQCInit = persistence.QueryCollection.prototype.init;

  persistence.QueryCollection.prototype.init = function(session, entityName, constructor) {
    oldQCInit.call(this, session, entityName, constructor);
    this._manyToManyFetch = null;
    this._additionalJoinSqls = [];
    this._additionalWhereSqls = [];
    this._additionalGroupSqls = [];
  };

  var oldQCToUniqueString = persistence.QueryCollection.prototype.toUniqueString;

  persistence.QueryCollection.prototype.toUniqueString = function() {
    var s = oldQCToUniqueString.call(this);
    s += '|JoinSQLs:';
    for(var i = 0; i < this._additionalJoinSqls.length; i++) {
      s += this._additionalJoinSqls[i];
    }
    s += '|WhereSQLs:';
    for(var i = 0; i < this._additionalWhereSqls.length; i++) {
      s += this._additionalWhereSqls[i];
    }
    s += '|GroupSQLs:';
    for(var i = 0; i < this._additionalGroupSqls.length; i++) {
      s += this._additionalGroupSqls[i];
    }
    if(this._manyToManyFetch) {
      s += '|ManyToManyFetch:';
      s += JSON.stringify(this._manyToManyFetch); // TODO: Do something more efficient
    }
    return s;
  };

  persistence.NullFilter.prototype.sql = function (meta, alias, values) {
    return "1=1";
  };

  persistence.AndFilter.prototype.sql = function (meta, alias, values) {
    return "(" + this.left.sql(meta, alias, values) + " AND "
    + this.right.sql(meta, alias, values) + ")";
  };

  persistence.OrFilter.prototype.sql = function (meta, alias, values) {
    return "(" + this.left.sql(meta, alias, values) + " OR "
    + this.right.sql(meta, alias, values) + ")";
  };

  persistence.PropertyFilter.prototype.sql = function (meta, alias, values) {
    var tm = persistence.typeMapper;
    var aliasPrefix = alias ? "`" + alias + "`." : "";
    var sqlType = meta.fields[this.property] || tm.idType;
    if (this.operator === '=' && this.value === null) {
      return aliasPrefix + '`' + this.property + "` IS NULL";
    } else if (this.operator === '!=' && this.value === null) {
      return aliasPrefix + '`' + this.property + "` IS NOT NULL";
    } else if (this.operator === 'in') {
      var vals = this.value;
      var qs = [];
      for(var i = 0; i < vals.length; i++) {
        qs.push('?');
        values.push(tm.entityValToDbVal(vals[i], sqlType));
      }
      if(vals.length === 0) {
        // Optimize this a little
        return "1 = 0";
      } else {
        return aliasPrefix + '`' + this.property + "` IN (" + qs.join(', ') + ")";
      }
    } else if (this.operator === 'not in') {
      var vals = this.value;
      var qs = [];
      for(var i = 0; i < vals.length; i++) {
        qs.push('?');
        values.push(tm.entityValToDbVal(vals[i], sqlType));
      }

      if(vals.length === 0) {
        // Optimize this a little
        return "1 = 1";
      } else {
        return aliasPrefix + '`' + this.property + "` NOT IN (" + qs.join(', ') + ")";
      }
    } else {
      var value = this.value;
      if(value === true || value === false) {
        value = value ? 1 : 0;
      }
      values.push(tm.entityValToDbVal(value, sqlType));
    return aliasPrefix + '`' + this.property + "` " + this.operator + " " + tm.outVar("?", sqlType);
   }
  };

  // QueryColleciton's list

  /**
   * Asynchronous call to actually fetch the items in the collection
   * @param tx transaction to use
   * @param callback function to be called taking an array with
   *   result objects as argument
   */
  persistence.DbQueryCollection.prototype.list = function (tx, callback) {
    var args = argspec.getArgs(arguments, [
        { name: 'tx', optional: true, check: persistence.isTransaction, defaultValue: null },
        { name: 'callback', optional: false, check: argspec.isCallback() }
      ]);
    tx = args.tx;
    callback = args.callback;

    var that = this;
    var session = this._session;
    if(!tx) { // no transaction supplied
      session.transaction(function(tx) {
          that.list(tx, callback);
        });
      return;
    }
    var entityName = this._entityName;
    var meta = persistence.getMeta(entityName);
    var tm = persistence.typeMapper;

    // handles mixin case -- this logic is generic and could be in persistence.
    if (meta.isMixin) {
      var result = [];
      persistence.asyncForEach(meta.mixedIns, function(realMeta, next) {
        var query = that.clone();
        query._entityName = realMeta.name;
        query.list(tx, function(array) {
          result = result.concat(array);
          next();
        });
      }, function() {
        var query = new persistence.LocalQueryCollection(result);
        query._orderColumns = that._orderColumns;
        query._reverse = that._reverse;
        // TODO: handle skip and limit -- do we really want to do it?
        query.list(null, callback);
      });
      return;
    }

    function selectAll (meta, tableAlias, prefix) {
      var selectFields = [ tm.inIdVar("`" + tableAlias + "`.id") + " AS " + prefix + "id" ];
      for ( var p in meta.fields) {
        if (meta.fields.hasOwnProperty(p)) {
          selectFields.push(tm.inVar("`" + tableAlias + "`.`" + p + "`", meta.fields[p]) + " AS `"
            + prefix + p + "`");
        }
      }
      for ( var p in meta.hasOne) {
        if (meta.hasOne.hasOwnProperty(p)) {
          selectFields.push(tm.inIdVar("`" + tableAlias + "`.`" + p + "`") + " AS `"
            + prefix + p + "`");
        }
      }
      return selectFields;
    }
    var args = [];
    var mainPrefix = entityName + "_";

    var mainAlias = 'root';
    var selectFields = selectAll(meta, mainAlias, mainPrefix);

    var joinSql = '';
    var additionalWhereSqls = this._additionalWhereSqls.slice(0);
    var mtm = this._manyToManyFetch;
    if(mtm) {
      joinSql += "LEFT JOIN `" + mtm.table + "` AS mtm ON mtm.`" + mtm.inverseProp + "` = `root`.`id` ";
      additionalWhereSqls.push("mtm.`" + mtm.prop + "` = " + tm.outId(mtm.id));
    }

    joinSql += this._additionalJoinSqls.join(' ');

    for ( var i = 0; i < this._prefetchFields.length; i++) {
      var prefetchFieldParts = this._prefetchFields[i].split('.');
      var prefetchField = prefetchFieldParts[0];
      var eName = entityName;
      if(prefetchFieldParts.length > 1){
        prefetchField = prefetchFieldParts[1];
        eName = prefetchFieldParts[0];
      }
      var theMeta = persistence.getMeta(eName);
      var thisMeta = theMeta.hasOne[prefetchField].type.meta;
      if (thisMeta.isMixin)
        throw new Error("cannot prefetch a mixin");
      var tableAlias = thisMeta.name + '_' + prefetchField + "_tbl";
      var PrefetchFrom = mainAlias;
      if(prefetchFieldParts.length > 1){
        PrefetchFrom = eName + '_' + eName + "_tbl";;
      }
      selectFields = selectFields.concat(selectAll(thisMeta, tableAlias,
          prefetchField + "_"));
      joinSql += "LEFT JOIN `" + thisMeta.name + "` AS `" + tableAlias
      + "` ON `" + tableAlias + "`.`id` = `" + PrefetchFrom + '`.`' + prefetchField + "` ";

    }

    var whereSql = "WHERE "
    + [ this._filter.sql(meta, mainAlias, args) ].concat(additionalWhereSqls).join(' AND ');

    var sql = "SELECT " + selectFields.join(", ") + " FROM `" + entityName
    + "` AS `" + mainAlias + "` " + joinSql + " " + whereSql;

    if(this._additionalGroupSqls.length > 0) {
      sql += this._additionalGroupSqls.join(' ');
    }

    if(this._orderColumns.length > 0) {
      sql += " ORDER BY "
      + this._orderColumns.map(
        function (c) {
          return (c[2] ? "`" : "LOWER(`") + mainPrefix + c[0] + (c[2] ? "` " : "`) ")
          + (c[1] ? "ASC" : "DESC");
        }).join(", ");
    }
    if(this._limit >= 0) {
      sql += " LIMIT " + this._limit;
    }
    if(this._skip > 0) {
      sql += " OFFSET " + this._skip;
    }
    session.flush(tx, function () {
        tx.executeSql(sql, args, function (rows) {
            var results = [];
            if(that._reverse) {
              rows.reverse();
            }
            for ( var i = 0; i < rows.length; i++) {
              var r = rows[i];
              var e = rowToEntity(session, entityName, r, mainPrefix);
              for ( var j = 0; j < that._prefetchFields.length; j++) {
                
                var prefetchFieldParts = that._prefetchFields[j].split('.');
                var prefetchField = prefetchFieldParts[0];
                var eName = entityName;
                if(prefetchFieldParts.length > 1){
                  prefetchField = prefetchFieldParts[1];
                  eName = prefetchFieldParts[0];
                }
                var theMeta = persistence.getMeta(eName);
                var thisMeta = theMeta.hasOne[prefetchField].type.meta;
                
                e._data_obj[prefetchField] = rowToEntity(session, thisMeta.name, r, prefetchField + '_');
                session.add(e._data_obj[prefetchField]);
              }
              results.push(e);
              session.add(e);
            }
            callback(results);
            that.triggerEvent('list', that, results);
          });
      });
  };

  /**
   * Asynchronous call to remove all the items in the collection.
   * Note: does not only remove the items from the collection, but
   * the items themselves.
   * @param tx transaction to use
   * @param callback function to be called when clearing has completed
   */
  persistence.DbQueryCollection.prototype.destroyAll = function (tx, callback) {
    var args = argspec.getArgs(arguments, [
        { name: 'tx', optional: true, check: persistence.isTransaction, defaultValue: null },
        { name: 'callback', optional: true, check: argspec.isCallback(), defaultValue: function(){} }
      ]);
    tx = args.tx;
    callback = args.callback;

    var that = this;
    var session = this._session;
    if(!tx) { // no transaction supplied
      session.transaction(function(tx) {
          that.destroyAll(tx, callback);
        });
      return;
    }
    var entityName = this._entityName;
    var meta = persistence.getMeta(entityName);
    var tm = persistence.typeMapper;

    // handles mixin case -- this logic is generic and could be in persistence.
    if (meta.isMixin) {
      persistence.asyncForEach(meta.mixedIns, function(realMeta, next) {
        var query = that.clone();
        query._entityName = realMeta.name;
        query.destroyAll(tx, callback);
      }, callback);
      return;
    }

    var joinSql = '';
    var additionalWhereSqls = this._additionalWhereSqls.slice(0);
    var mtm = this._manyToManyFetch;
    if(mtm) {
      joinSql += "LEFT JOIN `" + mtm.table + "` AS mtm ON mtm.`" + mtm.inverseProp + "` = `root`.`id` ";
      additionalWhereSqls.push("mtm.`" + mtm.prop + "` = " + tm.outId(mtm.id));
    }

    joinSql += this._additionalJoinSqls.join(' ');

    var args = [];
    var whereSql = "WHERE "
    + [ this._filter.sql(meta, null, args) ].concat(additionalWhereSqls).join(' AND ');

    var selectSql = "SELECT id FROM `" + entityName + "` " + joinSql + ' ' + whereSql;
    var deleteSql = "DELETE FROM `" + entityName + "` " + joinSql + ' ' + whereSql;
    var args2 = args.slice(0);

    session.flush(tx, function () {
        tx.executeSql(selectSql, args, function(results) {
            for(var i = 0; i < results.length; i++) {
              delete session.trackedObjects[results[i].id];
              session.objectsRemoved.push({id: results[i].id, entity: entityName});
            }
            that.triggerEvent('change', that);
            tx.executeSql(deleteSql, args2, callback, callback);
          }, callback);
      });
  };

  /**
   * Asynchronous call to count the number of items in the collection.
   * @param tx transaction to use
   * @param callback function to be called when clearing has completed
   */
  persistence.DbQueryCollection.prototype.count = function (tx, callback) {
    var args = argspec.getArgs(arguments, [
        { name: 'tx', optional: true, check: persistence.isTransaction, defaultValue: null },
        { name: 'callback', optional: false, check: argspec.isCallback() }
      ]);
    tx = args.tx;
    callback = args.callback;

    var that = this;
    var session = this._session;
    if(tx && !tx.executeSql) { // provided callback as first argument
      callback = tx;
      tx = null;
    }
    if(!tx) { // no transaction supplied
      session.transaction(function(tx) {
          that.count(tx, callback);
        });
      return;
    }
    var entityName = this._entityName;
    var meta = persistence.getMeta(entityName);
    var tm = persistence.typeMapper;

    // handles mixin case -- this logic is generic and could be in persistence.
    if (meta.isMixin) {
      var result = 0;
      persistence.asyncForEach(meta.mixedIns, function(realMeta, next) {
        var query = that.clone();
        query._entityName = realMeta.name;
        query.count(tx, function(count) {
          result += count;
          next();
        });
      }, function() {
        callback(result);
      });
      return;
    }

    var joinSql = '';
    var additionalWhereSqls = this._additionalWhereSqls.slice(0);
    var mtm = this._manyToManyFetch;
    if(mtm) {
      joinSql += "LEFT JOIN `" + mtm.table + "` AS mtm ON mtm.`" + mtm.inverseProp + "` = `root`.`id` ";
      additionalWhereSqls.push("mtm.`" + mtm.prop + "` = " + tm.outId(mtm.id));
    }

    joinSql += this._additionalJoinSqls.join(' ');
    var args = [];
    var whereSql = "WHERE " + [ this._filter.sql(meta, "root", args) ].concat(additionalWhereSqls).join(' AND ');

    var sql = "SELECT COUNT(*) AS cnt FROM `" + entityName + "` AS `root` " + joinSql + " " + whereSql;

    session.flush(tx, function () {
        tx.executeSql(sql, args, function(results) {
            callback(parseInt(results[0].cnt, 10));
          });
      });
  };

  persistence.ManyToManyDbQueryCollection.prototype.persistQueries = function() {
    var queries = [];
    var meta = persistence.getMeta(this._obj._type);
    var inverseMeta = meta.hasMany[this._coll].type.meta;
    var tm = persistence.typeMapper;
    var rel = meta.hasMany[this._coll];
    var inv = inverseMeta.hasMany[rel.inverseProperty];
    var direct = rel.mixin ? rel.mixin.meta.name : meta.name;
    var inverse = inv.mixin ? inv.mixin.meta.name : inverseMeta.name;

    // Added
    for(var i = 0; i < this._localAdded.length; i++) {
      var columns = [direct + "_" + this._coll, inverse + '_' + rel.inverseProperty];
      var vars = [tm.outIdVar("?"), tm.outIdVar("?")];
      var args = [tm.entityIdToDbId(this._obj.id), tm.entityIdToDbId(this._localAdded[i].id)];
      if (rel.mixin) {
        columns.push(direct + "_" + this._coll + "_class");
        vars.push("?");
        args.push(meta.name);
      }
      if (inv.mixin) {
        columns.push(inverse + "_" + rel.inverseProperty + "_class");
        vars.push("?");
        args.push(inverseMeta.name);
      }
      queries.push(["INSERT INTO " + rel.tableName +
            " (`" + columns.join("`, `") + "`) VALUES (" + vars.join(",") + ")", args]);
    }
    this._localAdded = [];
    // Removed
    for(var i = 0; i < this._localRemoved.length; i++) {
    queries.push(["DELETE FROM  " + rel.tableName +
          " WHERE `" + direct + "_" + this._coll + "` = " + tm.outIdVar("?") + " AND `" +
          inverse + '_' + rel.inverseProperty +
          "` = " + tm.outIdVar("?"), [tm.entityIdToDbId(this._obj.id), tm.entityIdToDbId(this._localRemoved[i].id)]]);
    }
    this._localRemoved = [];
    return queries;
  };
};

if (typeof exports !== 'undefined') {
  exports.defaultTypeMapper = defaultTypeMapper;
  exports.config = config;
}
else {
  persistence = window.persistence || persistence || {};
  persistence.store.sql = {
    defaultTypeMapper: defaultTypeMapper,
    config: config
  };
}




persistence.store.cordovasql = {};

/**
 * Configure the database connection (either sqliteplugin or websql)
 *
 * @param persistence
 * @param dbname
 * @param dbversion
 * @param description
 * @param size
 * @param backgroundProcessing
 * @param iOSLocation
 */
persistence.store.cordovasql.config = function (persistence, dbname, dbversion, description, size, backgroundProcessing, iOSLocation) {
  var conn = null;
  var native_conn = null;
  /**
   * Create a transaction
   *
   * @param callback
   *            the callback function to be invoked when the transaction
   *            starts, taking the transaction object as argument
   */
  persistence.transaction = function (callback) {
    if (!conn) {
      throw new Error("No ongoing database connection, please connect first.");
    } else {
      conn.transaction(callback);
    }
  };

  persistence.db = persistence.db || {};
  persistence.db.implementation = "unsupported";
  persistence.db.conn = null;

  /* Find out if sqliteplugin is loaded. Otherwise, we'll fall back to WebSql */
  if (window && 'sqlitePlugin' in window) {
    persistence.db.implementation = 'sqliteplugin';
  } else if (window && window.openDatabase) {
    persistence.db.implementation = "websql";
  } else {
    // Well, we are stuck!
  }

  /*
   * Cordova SqlitePlugin
   */
  persistence.db.sqliteplugin = {};

  /**
   * Connect to Sqlite plugin database
   *
   * @param dbname
   * @param backgroundProcessing
   * @param iOSLocation
   * @returns {{}}
   */
  persistence.db.sqliteplugin.connect = function (dbname, backgroundProcessing, iOSLocation) {
    var that = {};
    var conn = window.sqlitePlugin.openDatabase({name: dbname, location: (iOSLocation || 0)});
    native_conn = conn;
    that.transaction = function (fn) {
      return conn.transaction(function (sqlt) {
        return fn(persistence.db.sqliteplugin.transaction(sqlt));
      });
    };
    return that;
  };

  /**
   * Run transaction on Sqlite plugin database
   *
   * @param t
   * @returns {{}}
   */
  persistence.db.sqliteplugin.transaction = function (t) {
    var that = {};
    that.executeSql = function (query, args, successFn, errorFn) {
      if (persistence.debug) {
        console.log(query, args);
      }
      t.executeSql(query, args, function (_, result) {
        if (successFn) {
          var results = [];
          for (var i = 0; i < result.rows.length; i++) {
            results.push(result.rows.item(i));
          }
          successFn(results);
        }
      }, errorFn);
    };
    return that;
  };

  /*
   * WebSQL
   */
  persistence.db.websql = {};

  /**
   * Connect to the default WebSQL database
   *
   * @param dbname
   * @param dbversion
   * @param description
   * @param size
   * @returns {{}}
   */
  persistence.db.websql.connect = function (dbname, dbversion, description, size) {
    var that = {};
    var conn = openDatabase(dbname, dbversion, description, size);

    that.transaction = function (fn) {
      return conn.transaction(function (sqlt) {
        return fn(persistence.db.websql.transaction(sqlt));
      });
    };
    return that;
  };

  /**
   * Run transaction on WebSQL database
   *
   * @param t
   * @returns {{}}
   */
  persistence.db.websql.transaction = function (t) {
    var that = {};
    that.executeSql = function (query, args, successFn, errorFn) {
      if (persistence.debug) {
        console.log(query, args);
      }
      t.executeSql(query, args, function (_, result) {
        if (successFn) {
          var results = [];
          for (var i = 0; i < result.rows.length; i++) {
            results.push(result.rows.item(i));
          }
          successFn(results);
        }
      }, errorFn);
    };
    return that;
  };

  /**
   * Connect() wrapper
   *
   * @param dbname
   * @param dbversion
   * @param description
   * @param size
   * @param backgroundProcessing
   * @param iOSLocation
   * @returns {*}
   */
  persistence.db.connect = function (dbname, dbversion, description, size, backgroundProcessing, iOSLocation) {
    if (persistence.db.implementation == "sqliteplugin") {
      return persistence.db.sqliteplugin.connect(dbname, backgroundProcessing, iOSLocation);
    } else if (persistence.db.implementation == "websql") {
      return persistence.db.websql.connect(dbname, dbversion, description, size);
    }

    return null;
  };

  persistence.getConnection = function(){
    return native_conn;
  }

  /**
   * Set the sqlite dialect
   *
   * @type {{createTable: createTable, createIndex: createIndex}}
   */
  persistence.store.cordovasql.sqliteDialect = {

    /**
     * columns is an array of arrays, e.g. [["id", "VARCHAR(32)", "PRIMARY KEY"], ["name", "TEXT"]]
     *
     * @param tableName
     * @param columns
     * @returns {string}
     */
    createTable: function (tableName, columns) {
      var tm = persistence.typeMapper;
      var sql = "CREATE TABLE IF NOT EXISTS `" + tableName + "` (";
      var defs = [];
      for (var i = 0; i < columns.length; i++) {
        var column = columns[i];
        defs.push("`" + column[0] + "` " + tm.columnType(column[1]) + (column[2] ? " " + column[2] : ""));
      }
      sql += defs.join(", ");
      sql += ')';
      return sql;
    },

    /**
     * columns is array of column names, e.g. ["id"]
     * @param tableName
     * @param columns
     * @param options
     * @returns {string}
     */
    createIndex: function (tableName, columns, options) {
      options = options || {};
      return "CREATE " + (options.unique ? "UNIQUE " : "") + "INDEX IF NOT EXISTS `" + tableName + "__" + columns.join("_") +
        "` ON `" + tableName + "` (" +
        columns.map(function (col) {
          return "`" + col + "`";
        }).join(", ") + ")";
    }
  };

  // Configure persistence for generic sql persistence, using sqliteDialect
  persistence.store.sql.config(persistence, persistence.store.cordovasql.sqliteDialect);

  // Make the connection
  conn = persistence.db.connect(dbname, dbversion, description, size, backgroundProcessing, iOSLocation);
  if (!conn) {
    throw new Error("No supported database found in this browser.");
  }
};


var setupPeristenceSqliteMigrations = function(){
  var Migrator = {
    migrations: [],
    
    version: function(callback) {
      persistence_sqlite.transaction(function(t){
        t.executeSql('SELECT current_version FROM schema_version', null, function(result){
          if (result.length == 0) {
            t.executeSql('INSERT INTO schema_version VALUES (0)', null, function(){
              callback(0);
            });
          } else {
            callback(result[0].current_version);
          }
        });
      });
    },
    
    setVersion: function(v, callback) {
      persistence_sqlite.transaction(function(t){
        t.executeSql('UPDATE schema_version SET current_version = ?', [v], function(){
          Migrator._version = v;
          if (callback) callback();
        });
      });
    },
    
    setup: function(callback) {
      persistence_sqlite.transaction(function(t){
        t.executeSql('CREATE TABLE IF NOT EXISTS schema_version (current_version INTEGER)', null, function(){
          // Creates a dummy migration just to force setting schema version when cleaning DB
          Migrator.migration(0, { up: function() { }, down: function() { } });
          if (callback) callback();
        });
      });
    },
    
    // Method should only be used for testing
    reset: function(callback) {
      // Creates a dummy migration just to force setting schema version when cleaning DB
      Migrator.migrations = [];
      Migrator.migration(0, { up: function() { }, down: function() { } });
      Migrator.setVersion(0, callback);
    },
    
    migration: function(version, actions) {
      Migrator.migrations[version] = new Migration(version, actions);
      return Migrator.migrations[version];
    },
    
    migrateUpTo: function(version, callback) {
      var migrationsToRun = [];
      
      function migrateOne() {
        var migration = migrationsToRun.pop();
        
        if (!migration) callback();
        
        migration.up(function(){
          if (migrationsToRun.length > 0) {
            migrateOne();
          } else if (callback) {
            callback();
          }
        });
      }
      
      this.version(function(currentVersion){
        for (var v = currentVersion+1; v <= version; v++)
          migrationsToRun.unshift(Migrator.migrations[v]);
        
        if (migrationsToRun.length > 0) {
          migrateOne();
        } else if (callback) {
          callback();
        }
      });
    },
    
    migrateDownTo: function(version, callback) {
      var migrationsToRun = [];
      
      function migrateOne() {
        var migration = migrationsToRun.pop();
        
        if (!migration) callback();
        
        migration.down(function(){
          if (migrationsToRun.length > 0) {
            migrateOne();
          } else if (callback) {
            callback();
          }
        });
      }
      
      this.version(function(currentVersion){
        for (var v = currentVersion; v > version; v--)
          migrationsToRun.unshift(Migrator.migrations[v]);
        
        if (migrationsToRun.length > 0) {
          migrateOne();
        } else if (callback) {
          callback();
        }
      });
    },
    
    migrate: function(version, callback) {
      if ( arguments.length === 1 ) {
        callback = version;
        version = this.migrations.length-1;
      }
      
      this.version(function(curVersion){
        if (curVersion < version)
          Migrator.migrateUpTo(version, callback);
        else if (curVersion > version)
          Migrator.migrateDownTo(version, callback);
        else
          callback();
      });
    }
  }

  var Migration = function(version, body) {
    this.version = version;
    // TODO check if actions contains up and down methods
    this.body = body;
    this.actions = [];
  };

  Migration.prototype.executeActions = function(callback, customVersion) {
    var actionsToRun = this.actions;
    var version = (customVersion!==undefined) ? customVersion : this.version;
    
    persistence_sqlite.transaction(function(tx){
      function nextAction() {
        if (actionsToRun.length == 0)
          Migrator.setVersion(version, callback);
        else {
          var action = actionsToRun.pop();
          action(tx, nextAction);
        }
      }
      
      nextAction();
    });
  }

  Migration.prototype.up = function(callback) {
    if (this.body.up) this.body.up.apply(this);
    this.executeActions(callback);
  }

  Migration.prototype.down = function(callback) {
    if (this.body.down) this.body.down.apply(this);
    this.executeActions(callback, this.version-1);
  }

  Migration.prototype.createTable = function(tableName, callback) {
    var table = new ColumnsHelper();
    
    if (callback) callback(table);
    
    var column;
    var sql = 'CREATE TABLE ' + tableName + ' (id VARCHAR(32) PRIMARY KEY';
    while (column = table.columns.pop())
      sql += ', ' + column;
    
    this.executeSql(sql + ')');
  }

  Migration.prototype.dropTable = function(tableName) {
    var sql = 'DROP TABLE ' + tableName;
    this.executeSql(sql);
  }

  Migration.prototype.addColumn = function(tableName, columnName, columnType) {
    var sql = 'ALTER TABLE ' + tableName + ' ADD ' + columnName + ' ' + columnType;
    this.executeSql(sql);
  }

  Migration.prototype.removeColumn = function(tableName, columnName) {
    this.action(function(tx, nextCommand){
      var sql = 'select sql from sqlite_master where type = "table" and name == "'+tableName+'"';
      tx.executeSql(sql, null, function(result){
        var columns = new RegExp("CREATE TABLE `\\w+` |\\w+ \\((.+)\\)").exec(result[0].sql)[1].split(', ');
        var selectColumns = [];
        var columnsSql = [];
        
        for (var i = 0; i < columns.length; i++) {
          var colName = new RegExp("((`\\w+`)|(\\w+)) .+").exec(columns[i])[1];
          if (colName == columnName) continue;
          
          columnsSql.push(columns[i]);
          selectColumns.push(colName);
        }
        columnsSql = columnsSql.join(', ');
        selectColumns = selectColumns.join(', ');
        
        var queries = [];
        queries.unshift(["ALTER TABLE " + tableName + " RENAME TO " + tableName + "_bkp;", null]);
        queries.unshift(["CREATE TABLE " + tableName + " (" + columnsSql + ");", null]);
        queries.unshift(["INSERT INTO " + tableName + " SELECT " + selectColumns + " FROM " + tableName + "_bkp;", null]);
        queries.unshift(["DROP TABLE " + tableName + "_bkp;", null]);
        
        persistence_sqlite.executeQueriesSeq(tx, queries, nextCommand);
      });
    });
  }

  Migration.prototype.addIndex = function(tableName, columnName, unique) {
    var sql = 'CREATE ' + (unique === true ? 'UNIQUE' : '') + ' INDEX ' + tableName + '_' + columnName + ' ON ' + tableName + ' (' + columnName + ')';
    this.executeSql(sql);
  }

  Migration.prototype.removeIndex = function(tableName, columnName) {
    var sql = 'DROP INDEX ' + tableName + '_' + columnName;
    this.executeSql(sql);
  }

  Migration.prototype.executeSql = function(sql, args) {
    this.action(function(tx, nextCommand){
      tx.executeSql(sql, args, nextCommand);
    });
  }

  Migration.prototype.action = function(callback) {
    this.actions.unshift(callback);
  }

  var ColumnsHelper = function() {
    this.columns = [];
  }

  ColumnsHelper.prototype.text = function(columnName) {
    this.columns.unshift(columnName + ' TEXT');
  }

  ColumnsHelper.prototype.integer = function(columnName) {
    this.columns.unshift(columnName + ' INT');
  }

  ColumnsHelper.prototype.real = function(columnName) {
    this.columns.unshift(columnName + ' REAL');
  }

  ColumnsHelper.prototype['boolean'] = function(columnName) {
    this.columns.unshift(columnName + ' BOOL');
  }

  ColumnsHelper.prototype.date = function(columnName) {
    this.columns.unshift(columnName + ' DATE');
  }

  ColumnsHelper.prototype.json = function(columnName) {
    this.columns.unshift(columnName + ' TEXT');
  }

  // Makes Migrator and Migration available to tests
  persistence_sqlite.migrations = {};
  persistence_sqlite.migrations.Migrator = Migrator;
  persistence_sqlite.migrations.Migration = Migration;
  persistence_sqlite.migrations.init = function() { Migrator.setup.apply(Migrator, Array.prototype.slice.call(arguments, 0))};

  persistence_sqlite.migrate = function() { Migrator.migrate.apply(Migrator, Array.prototype.slice.call(arguments, 0))};
  persistence_sqlite.defineMigration = function() { Migrator.migration.apply(Migrator, Array.prototype.slice.call(arguments, 0))};

}


window.persistence_sqlite = persistence;
setupPeristenceSqliteMigrations();