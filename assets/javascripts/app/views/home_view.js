define(function(require, exports, module){

  var BaseView  = require('core/base_view');

  var HomeView = BaseView.extend({
    render: function() {
      var _this = this;
      $('head').append($('<link href="css/capsicoForms.css" rel="stylesheet" type="text/css" />'));
      $('body').removeClass('home-bg');
      $('body').removeClass('login-bg');

      _this.$el.html("<h4><center>Hello</center></h4>");
      return this;
    }
  });

  return HomeView;
})