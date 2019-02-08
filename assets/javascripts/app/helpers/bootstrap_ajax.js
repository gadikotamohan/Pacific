define(function(require, exports, module) {
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // bootstrap AJAX
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  bootstrap = {};
  var c = require('config');
  bootstrap.ajaxUrl = function(Url, Method, ErrorMsg, SuccessFunc, ErrorFunc)
  {
    if(Url.indexOf("/") == 0){
      Url = c.serverName+Url;
    }
    __ajax_url = this;
    this.errorFunc = ErrorFunc;
    this.successFunc = SuccessFunc;
    ajaxError = function(jqXHR, textStatus, errorThrown)
    {
      error = jqXHR.responseJSON || { code: jqXHR.status, message: "Error", errors: [] };
      try
      {
        var msg = error == null ? null : error.message ? error.message : error.msg;
        if (__ajax_url.errorMsg != null)
          alert(__ajax_url.errorMsg + "\n\n" + msg);
        if (__ajax_url.errorFunc != null){
          after(0, function(){
            __ajax_url.errorFunc(error.code, msg, error.errors)
          });
        }
        // if (error != null && error.code == 401)
        // {
        //   var lthis = this;
        //   console.log("Login required --> error "+data.code);
        // }
        // else
        // {
        //   var msg = error == null ? null : error.message ? error.message : error.msg;
        //   if (__ajax_url.errorMsg != null)
        //     alert(__ajax_url.errorMsg + "\n\n" + msg);
        //   if (__ajax_url.errorFunc != null){
        //     after(0, function(){
        //       __ajax_url.errorFunc(error.code, msg, error.errors)
        //     });
        //   }
        // }
      }
      catch (e)
      {
        SuperDOM.alertException(e, "Caught exception in bootstrap.ajaxUrl.error(): ");
      }
    }

    ajaxDone = function(data, textStatus, jqXHR){
      try
      {
        if (data == null)
          throw ("An error occurred: no JSON data for " + this.url);
        if (data.code == undefined)
          throw ("An error occurred: invalid JSON data for " + this.url);
        if (data.code == 401)
        {
            var lthis = this;
            console.log("Login required --> error "+data.code);
            // bootstrap.PopupLogin.show(true, function() { dojo.xhr(lthis.method, lthis); });
         }
        else if (data.code != 200)
          ajaxError(jqXHR, textStatus, "Error code --> "+data.code);
        else if (__ajax_url.successFunc != null)
          after(0, function(){__ajax_url.successFunc(data.data);});
      }
      catch (e)
      {
        SuperDOM.alertException(e, "Caught exception in bootstrap.ajaxUrl.load(): ");
      }
    }

    $ajax = $.ajax({
      url: Url,
      method: Method,
      dataType: "TEXT",
      timeout: 10000
    });
    $ajax.error = $ajax.fail;
    $ajax.error(function(jqXHR, textStatus, errorThrown) {
      console.log(textStatus, errorThrown);
      ajaxError(jqXHR, textStatus, errorThrown);
    });
    $ajax.done(function(data, textStatus, jqXHR){
      var data_1 = undefined;
      try{
        data_1 = JSON.parse(data);        
      } catch(error){
        cl(error.message);
        cl(error.stack);
        data_1 = JSON.parse(fixCrappyJSONStr(data));
      }

      ajaxDone(data_1, textStatus, jqXHR);
    });
  };
    

  bootstrap.ajaxUrlMulti = function(AjaxInfos, Func)
  {
    var results=[];
    AjaxInfos_1 = _.map(AjaxInfos, function(ele){
      if(ele.url.indexOf("/") == 0){
        return c.serverName+ele.url;
      } else {
        return ele.url;
      }
    });
    h = AjaxInfos_1.reduce(function(prev, cur, index) {
      return prev.then(function(data) {
        return $.ajax({url: cur, dataType: "JSON", timeout: 10000}).then(function(data) {
          console.log("step 1." + index);
          results.push(data.data || {});
        });
      })
    }, $().promise())
    h.done(function() {
      // last ajax call done
      // all results are in the results array
      after(100, function(){
        Func(results);
      });

    });
    h.fail(function(error){
      after(100, function(){
        Func(results);
      });
      cl(error.message);
      cl(error.stack);
    });
  }
    

  return bootstrap;
});