define([
  'underscore',
  'backbone'
], function(_, Backbone){

  var BaseView = Backbone.View.extend({
    close : function(){
      if(this.childViews){
        this.childViews.close();
      }
      $('link[rel="stylesheet"]').remove();
      $('head').append($('<link href="css/main.css" rel="stylesheet" type="text/css" />'));
      $('.modal-backdrop').remove();
      $('body').removeClass('modal-open');
      this.remove();
    }
  });

  return BaseView;

});