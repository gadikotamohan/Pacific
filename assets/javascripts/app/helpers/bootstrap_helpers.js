define(function(require, exports, module) {
  if(typeof($) == "undefined"){
    var $            = require('jquery');
  }
  setupBootStrapNavLinks = function(){
    $(document).on('click','.navbar-collapse.in',function(e) {
      if( $(e.target).is('a') && $(e.target).attr('class') != 'dropdown-toggle' ) {
        $(this).collapse('hide');
      }
    });
  }
});