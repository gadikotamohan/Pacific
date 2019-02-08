define(function(require, exports, module) {
  require('helpers/bootstrap_dialog');
  require('helpers/bootstrap_calendar');
  require('helpers/bootstrap_ajax');
  var bootstrap = {
    Dialog       : require('helpers/bootstrap_dialog').Dialog,
    Calendar     : require('helpers/bootstrap_calendar').Calendar,
    ajaxUrl      : require('helpers/bootstrap_ajax').ajaxUrl,
    ajaxUrlMulti : require('helpers/bootstrap_ajax').ajaxUrlMulti
  };

  return bootstrap;

})