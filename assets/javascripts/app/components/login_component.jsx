define(function(require) {

  const React = require('react');
  const eulaFallbackText = require('text!../../../public/eula.sample.html')
  const initialState = {
    formData: null,
    loginType: null,
    loginData: null
  }

  var Config = require("config");
  var LoginHelper = require("login_helper");

  var Component = class LoginComponent extends React.Component {
    constructor(props) {
      super(props);
      this.state = initialState
      this.Config = require('config')
      this.LoginHelper = require('login_helper')
      this.handleSubmit = this.handleSubmit.bind(this);
      this.handleEulaSubmit = this.handleEulaSubmit.bind(this);
      this.handleTenantSelect = this.handleTenantSelect.bind(this);
    }

    componentDidMount() { }

    handleSubmit(event) {
      event.preventDefault();
      let data = $(event.target).serializeObject();
      this.state.formData = data;
      this.doLogin();
    }

    handleEulaSubmit(event) {
      event.preventDefault();
      let eulaToken = this.state.loginData.token
      this.state.formData.accept = "1"
      this.state.formData.eulaToken = eulaToken;
      this.doLogin();
    }

    handleTenantSelect(event) {
      event.preventDefault();
      let tenantRefnum = event.target.id;
      this.state.formData.tenantUserRefnum = tenantRefnum
      this.doLogin();
    }

    setEulaContent(text) {
      let ele = document.getElementById("eula_text_container")
      if (ele != null)
        ele.innerHTML = text

    }

    fetchAppendEula() {
      var that = this;
      let fullUrl = this.Config.serverName + this.state.loginData.url
      fetch(fullUrl)
        .then(function(response) {
          if(response.status != 200)
            throw new Error("Invalid Response code for EULA url: "+response.status)
          return response.text();
        })
        .then(function(response_text) {
          that.setEulaContent(response_text);
        })
        .catch(function(error) {
          console.error(error);
          console.log("Using fallback EULA content")
          that.setEulaContent(eulaFallbackText);
        })
    }

    doLogin() {
      var that = this;
      let url = this.Config.serverName + this.Config.login.path;
      let data = this.state.formData;

      window.plugins.spinnerDialog.show("Log-in", "Please wait..", true)

      this.LoginHelper.login(url, data,
        function(type, tenantsList, eulaToken, eulaUrl) {
          window.plugins.spinnerDialog.hide();
          that.state.loginType = type
          if (type == "SELECT_TENANT") {
            that.state.loginData = { tenants: tenantsList }
          }
          else if (type == "EULA") {
            that.state.loginData = { url: eulaUrl, token: eulaToken }
          }
          else {
            // Login Flow Successful,
            // Take user to Home Page
            window.location.hash = "home";
          }
          that.setState(that.state);
        },
        function(err) {
          var _login_component = that;
          window.plugins.spinnerDialog.hide();
          that.setState(initialState, function() {
            _login_component.forceUpdate();
          });
          alert(err);          
        });
    }

    render() {
      if (this.state.loginType == "SELECT_TENANT")
        return this.renderTenantsList();
      else if (this.state.loginType == "EULA")
        return this.renderEULA()
      else
        return this.renderForm();
    }

    renderTenantsList() {
      var tenants = this.state.loginData.tenants;
      var elements = [];

      for (let i = 0; i < tenants.length; i++) {
        elements.push(
          <div className="col-md-4 col-sm-6 padding-15">
            <button className="btn btn-block btn-default" id={tenants[i].tenantUserRefnum} onClick={this.handleTenantSelect}>
              {tenants[i].name}
            </button>
          </div>
        );
      }

      return (
        <div className="">
          <br/>
          <div className="row">
            {elements}
          </div>
          <br/>
        </div>
      );
    }

    renderEULA() {
      this.fetchAppendEula();

      return (
        <div className="jumbotron">
          <br/>
          <div id="eula_text_container"></div>
          <br/>
          <button className="btn btn-primary pull-right" onClick={this.handleEulaSubmit}>
            {"Accept & Continue"}
          </button>
          <br/>
        </div>
      )
    }

    renderForm() {
      return (
        <div className="vertical-center">
          <form className="form col-md-4 col-sm-10" onSubmit={this.handleSubmit}>
            <div className="row">
              <input type="email" name="email" className="form-control" placeholder="Email" required="required" />
            </div>
            <div className="row">
              <input type="password" name="pswd" className="form-control" placeholder="Password" required="required" />
            </div>
            <br/>
            <div className="row">
              <input type="submit" className="btn btn-block btn-primary" value="Log In" />
            </div>
          </form>
        </div>
      )
    }
  }
  
  return Component;
});