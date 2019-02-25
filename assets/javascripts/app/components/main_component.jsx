define(function(require) {

  const React = require('react');
  const ReactRouter = require('react-router-dom');
  const LoginComponent  = require('components/login_component');
  const HomeComponent   = require('components/home_component');

  var Component = class MainComponent extends React.Component {
    constructor(props) {
      super(props);
    }

    render() {
      return (
        <div>
          <div>
            <ReactRouter.Route exact path="/"     component={LoginComponent}  />
            <ReactRouter.Route exact path="/home" component={HomeComponent}   />
          </div>
        </div>
      );
    }
  }
  
  return Component;
});