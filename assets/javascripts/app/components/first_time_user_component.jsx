define(function(require) {

  const React = require('react');

  var UserFetcher = require('fetchers/user_fetcher');

  var Component = class FirstTimeUserComponent extends React.Component {
    constructor(props) {
      super(props);
    }

    componentDidMount() {
      var that = this;

      // Run Admin Fetcher
      var fetcher = new UserFetcher();
      fetcher.then(function(done) {
        return dbPromiseQuery("UPDATE app_data SET first_time_user = 2", [], false);
      })
      .then(function(res) {
        window.location.hash = "users"
      })
      .catch(function(cause){
        alert("Something went wrong while syncing data from server. \n"+cause.message);
        lockApp();
        errorLog(cause);
      })
    }

    render() {
      return (
        <div className="container ftu_screen">  
          <div className="row">
            <div className="col-md-12">
              <h3> Please wait while we setup application for you ...</h3>
            </div>
          </div>
          <div className="container">
            <div className="col-md-12 messages">
            </div>
          </div>
        </div>
      );
    }
  }
  
  return Component;
});
