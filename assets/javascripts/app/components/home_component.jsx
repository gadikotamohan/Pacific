define(function(require) {

  const React = require('react');

  var Component = class HomeComponent extends React.Component {
    constructor(props) {
      super(props);
    }

    render() {
      return (
        <div>
          <h1><center>Home</center></h1>
        </div>
      );
    }
  }
  
  return Component;
});
