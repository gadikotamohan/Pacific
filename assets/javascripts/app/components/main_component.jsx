define(function(require) {

  const React = require('react');
  const ReactRouter = require('react-router-dom');

  const LoginComponent          = require('components/login_component');
  const FirstTimeUserComponent  = require('components/first_time_user_component');
  const UserListComponent       = require('components/user_list_component');

  var Component = class MainComponent extends React.Component {
    constructor(props) {
      super(props);
    }

    render() {
      return (
        <div>
          <div>
            <ReactRouter.Route exact path="/"                   component={LoginComponent}          />
            <ReactRouter.Route exact path="/first_time_user"    component={FirstTimeUserComponent}  />
            <ReactRouter.Route exact path="/users"              component={UserListComponent}       />
          </div>
        </div>
      );
    }
  }
  
  return Component;
});