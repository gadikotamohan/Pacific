define(function(require) {

  var CapsicoApp = function() {
    var React = require('react');
    var ReactDOM = require('react-dom');

    class Hello extends React.Component {
      render() {
        return React.createElement('div', null, `Hello ${this.props.toWhat}`);
      }
    }

    ReactDOM.render(
      React.createElement(Hello, {toWhat: 'World'}, null),
      document.getElementById('root')
    );
  }

  return CapsicoApp;
  
});