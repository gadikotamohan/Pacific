define([
  'jquery',
  'underscore',
  'backbone',
  'core/base_router',
  'views/login_view',
  'views/first_time_user_view',
  'views/home_view',
  'models/session_model'
], function($, _,  Backbone, BaseRouter, LoginView, FirstTimeUserView, HomeView, Session){

  var Backbone = require('backbone');
  var Session = require('models/session_model');

  var BaseRouter = require('core/base_router');
  var CapsicoRouter = BaseRouter.extend({
    routes: {
      home: function() {
        try {
          var home_view = new HomeView();
          this.changeView(home_view);
        }
        catch(error) {
          console.log("Error --> "+error.message);
          console.log("Error stack --> "+error.stack);
        }
      },
      first_time_user: function(){
        var first_time_user_view = new FirstTimeUserView();
        this.changeView(first_time_user_view);
      },
      login: function(){
        var login_view = new LoginView();
        this.changeView(login_view);
      },
      "*default": function(){
        this.home();
      }
    },
    skipAuth: ['#login'],
    preventAccessWhenAuth : ['#login'],
    before: function(args, next){
      //Checking if user is authenticated or not
      //then check the path if the path requires authentication
      var isAuth = Session.get('authenticated');
      // var isFirstTime = Session.get('first_time_user');
      var path = Backbone.history.location.hash;
      var needAuth = !_.contains(this.skipAuth, path);
      var cancleAccess = _.contains(this.preventAccessWhenAuth, path);
      // if(isFirstTime){
      //   // First time user
      //   this.navigate('first_time_user', { trigger : true });
      // }
      // else{
      if(needAuth && !isAuth){
        //If user gets redirect to login because wanted to access
        // to a route that requires login, save the path in session
        // to redirect the user back to path after successful login
        Session.set('redirectFrom', path);
        this.navigate('login', { trigger : true });
      }else if(isAuth && cancleAccess){
        // User is authenticated and tries to go to login, register ...
        // so redirect the user to home page
        this.navigate('users', { trigger : true });
      }else{
        //No problem, handle the route!!
        return next();
      }
    },
    changeView : function(view){
      //Close is a method in BaseView
      //that check for childViews and 
      //close them before closing the 
      //parentView
      function setView(view){
        if(this.currentView){
          this.currentView.close();
        }
        this.currentView = view;
        $('.container').html(view.render().$el);
      }
      setView(view);
    },
    getCurrentView: function(){
      return this.currentView;
    },
    fetchError : function(error){
      //If during fetching data from server, session expired
      // and server send 401, call getAuth to get the new CSRF
      // and reset the session settings and then redirect the user
      // to login
      if(error.status === 401){
        Session.getAuth(function(){
          Backbone.history.navigate('login', { trigger : true });
        });
      }
    }    

  });

  return CapsicoRouter;
});