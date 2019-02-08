define(function(require, exports, module) {

  var FloriaDate = require('floria/date');

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // bootstrap Calendar
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  bootstrap = {};
  bootstrap.Calendar = function(containerId, elementId, onValueSelectedFunc, min, datePattern, v, fieldName)
  {
    var lthis = this;
    var date_obj = null;

    try {
      date_obj = (v == null ? null : FloriaDate.parseDateTime(v)); 
      date_obj.toISOString();
    }
    catch(error) {
      console.error("Error while parsing date: ", v)
      date_obj = null;
    }
    
    // Create an hidden Input with id=elementId
    var hidden = document.createElement("INPUT");
    hidden.setAttribute("type", "hidden");
    hidden.setAttribute("id", elementId);
    hidden.setAttribute("name", fieldName);
    hidden.setAttribute("value", date_obj==null?"":date_obj.toISOString());

    // Create an INPUT with id="HOLDER_"+elementId
    var newItem = document.createElement("INPUT");
    newItem.setAttribute("type", "text");
    newItem.setAttribute("id", "HOLDER_"+elementId);
    newItem.setAttribute("class", "datepicker")
    newItem.setAttribute("name", "HOLDER_"+fieldName);
    newItem.setAttribute("readonly", "true")
    newItem.setAttribute("value", v==null?"":v);

    // Append the INPUT to containerId element
    var e = document.getElementById(containerId);
    e.parentNode.insertBefore(hidden, e);
    e.parentNode.insertBefore(newItem, e);
    // Fix for Calendar dropdown rendering far away
    e.parentNode.style.position = "relative"

    // Date picker options
    var opts = {
      date: date_obj,
      maxDate: new Date(),
      format: "YYYY-MMM-DD",
      useCurrent: false,
      focusOnShow: false,
      ignoreReadonly: true
    }

    // Init datepicker on elementId
    $("#HOLDER_"+elementId).datetimepicker(opts);

    $("#HOLDER_"+elementId).on("dp.change", function(event) {
      val = event.target.value.split("-").reverse().join("-")
      new_date = new Date(val)
      document.getElementById(elementId).value = new_date.toISOString();
    })

    this.destroy = function() {
      $("#HOLDER_"+elementId).datetimepicker("destroy");
    }
  };
  return bootstrap;
});