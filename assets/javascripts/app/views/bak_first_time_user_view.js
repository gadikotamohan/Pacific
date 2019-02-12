define(function(require, exports, module){

  var BaseView    = require('core/base_view');

  var FirstTimeUserView = BaseView.extend({
    template: _.template(require("text!templates/first_time_user.html")),
    render: function() {
      var __first_time_user = this;
      this.$el.html(this.template());

      // Sync data to/from Server
      after(3000, function() {
        Backbone.history.navigate('home', { trigger : true, replace: true });
      })
     
      return this;
    }
  });

  return FirstTimeUserView;
});