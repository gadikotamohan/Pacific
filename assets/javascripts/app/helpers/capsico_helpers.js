function alertException(e, Msg)
  {
    alert((Msg == null ? "" : Msg) + (e.message ? e.message : e.description ? e.description : e) + (e.isEmpty ? "" : "\n\n" + PrintObject(e)));
  }

function isFunction(obj)
  {
    return !!(obj && obj.constructor && obj.call && obj.apply);
  };

function PrintObject(Obj, level)
  {
    if (level == null)
      level = 0;
    else if (level > 5)
      return Obj + "\n";
    var Str = "";
    for ( var prop in Obj)
      {
        var o = Obj[prop];
        if (isFunction(o) == true)
          continue;
        for (var i = 0; i < level; ++i)
          Str += "  ";
        Str += prop + ": ";
        var type = typeof o;
        if (type == "object")
          Str += PrintObject(o, level + 1)+'\n';
        else if (type == "Array")
          for (var i = 0; i < o.length; ++i)
            PrintObject(o[i], level + 1)
        else
          Str += Obj[prop] + "\n";
      }
    return Str;
  }

function setInnerHtml(elementId, Str)
  {
    var e = document.getElementById(elementId);
    if (e == null)
     alertThrow("Cannot find element '" + elementId + "' in the DOM");
    e.innerHTML = Str;
  }

var SuperDOM = {
    getElement : function(e, throwMsg)
      {
        if (e == null)
          return throwMsg != null ? alertThrow(throwMsg) : null;
        if (typeof e == "string")
        {
          e = document.getElementById(e);
          if (e == null)
            return throwMsg != null ? alertThrow(throwMsg) : null;
        }
        return e;
      },
    setInnerHTML: function(e, Str)
      {
        SuperDOM.getElement(e, "Cannot find element '" + e + "' in the DOM").innerHTML = Str;
      },
    addCSSToParent: function(e, className, Str)
      {
        SuperDOM.getElement(e, Str).parentNode.classList.add(className);
      }
  }


function compareValues(v1, v2)
  {
    return v1 == v2 ? 0 : v1 > v2 ? 1 : -1;
  }

function alertThrow(msg)
 {
   alert(msg);
   throw msg;
 }

function randomPick(Obj1, Obj2, cutoff)
  {
    return Math.random() < cutoff ? Obj1 : Obj2;
  }

function randomBetween(min, max)
 {
   return Math.floor((Math.random() * (max-min)) + min);
 }

// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Date extensions
// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**
 * Takes a date time string as 'YYYY.MM.DD HH.MM.SS.mmmZ' where the separator characters don't matter.
 * 
 * @param DateTimeStr
 * @returns {Date}
 */
function parseDateTime(DateTimeStr)
  {
    var yea = DateTimeStr.substring( 0,  4);
    var mon = DateTimeStr.substring( 5,  7);
    var day = DateTimeStr.substring( 8, 10);
    var hou = DateTimeStr.substring(11, 13);
    var min = DateTimeStr.substring(14, 16);
    var sec = DateTimeStr.substring(17, 19);
    var mil = DateTimeStr.substring(20, 23);
    var tzp = DateTimeStr.charAt(23);
    var tzh = DateTimeStr.substring(24, 26);
    var tzm = DateTimeStr.substring(26, 28);
    
    var d = new Date(yea, mon-1, day, hou, min, sec, mil);
    d._timezone = { str: tzp+tzh+tzm, h: tzp=='+'?+tzh:-tzh, m: tzp=='+'?+tzm:-tzm };
    d.adjustToLocalTime();
    return d;
  }

Date.prototype.adjustToLocalTime = function()
 {
   var coh = this.getTimezoneOffset()/60 + this._timezone.h;
   var com = this.getTimezoneOffset()%60 + this._timezone.m;
   this.setHours  (this.getHours  ()-coh);
   this.setMinutes(this.getMinutes()-com);
 }

Date.prototype.adjustFromLocalTime = function()
{
  if (this._timezone == null)
   return this;
  var d = new Date(this);
  d._timezone = this._timezone;
  var coh = d.getTimezoneOffset()/60 + d._timezone.h;
  var com = d.getTimezoneOffset()%60 + d._timezone.m;
  d.setHours  (d.getHours  ()+coh);
  d.setMinutes(d.getMinutes()+com);
  return d;
}

Date.prototype.getAge = function()
  {
    var today = new Date();
    var age = today.getFullYear() - this.getFullYear();
    // compare month and day to check if birthday has happened already. If not, substract 1. to age.
    if (today.getMonth() < this.getMonth() || today.getMonth() == this.getMonth() && today.getDate() < this.getDate())
      --age;
    return age;
  }
Date.prototype.diffDays = function(laterDate)
  {
    var d = Math.floor((laterDate - this) / (1000 * 60 * 60 * 24));
    if (this.getDate() != laterDate.getDate())
      ++d;
    return d;
  }

Date.prototype.getDayOfYear = function()
  {
    return Math.ceil((this - new Date(this.getFullYear(), 0, 1)) / 86400000);
  };

Date.prototype.getDaysSince = function(someDate)
  {
    var x = (this.getTime() - someDate.getTime()) / 86400000;
    return -1 < x && x < 1 && this.getDate() == someDate.getDate() ? 0 : x > 0 ? (x > 1 ? Math.ceil(x) : 1) : (x < -1 ? Math.ceil(x) : -1);
  };

Date.prototype.getHoursSince = function(someDate)
  {
    var x = (this.getTime() - someDate.getTime()) / 3600000;
    return -1 < x && x < 1 && this.getDate() == someDate.getDate() ? 0 : x > 0 ? (x > 1 ? Math.ceil(x) : 1) : (x < -1 ? Math.ceil(x) : -1);
  };

Date.prototype.getMinutesSince = function(someDate)
  {
    var x = (this.getTime() - someDate.getTime()) / 60000;
    return -1 < x && x < 1 && this.getDate() == someDate.getDate() ? 0 : x > 0 ? (x > 1 ? Math.ceil(x) : 1) : (x < -1 ? Math.ceil(x) : -1);
  };

Date.prototype.addHours = function(h)
  {
    this.setTime(this.getTime() + (h * 60 * 60 * 1000));
    return this;
  };

Date.prototype.roundDownHour = function(h)
  {
    this.setMinutes(0);
    this.setSeconds(0);
    this.setMilliseconds(0);
    return this;
  };

Date.prototype.addDays = function(d)
  {
    this.setDate(this.getDate() + d);
    return this;
  };

Date.prototype.roundDownDay = function(h)
  {
    this.setHours(0);
    this.setMinutes(0);
    this.setSeconds(0);
    this.setMilliseconds(0);
    return this;
  };

Date.prototype.DATE_MONTHS = new Array('Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec');
Date.prototype.DATE_DAYS = new Array('Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat');

Date.prototype.printDayWithTH = function()
  {
    var d = this.getDate();
    return d + "<SUP style='font-size:60%;'>" + (d == 1 || d == 21 ? "st" : d == 2 || d == 22 ? "nd" : d == 3 || d == 23 ? "rd" : "th") + "</SUP>";
  };

Date.prototype.print24hTime = function(Timezone)
  {
    return (this.getHours() < 10 ? "0" : "") + this.getHours() + ":" + (this.getMinutes() < 10 ? "0" : "") + this.getMinutes()
         + (Timezone == true && this._timezone != null ? " ("+this._timezone.str+")" : "");
  };

Date.prototype.printShort = function(PrintTime)
  {
    return this.__printShort(PrintTime, false);
  };
Date.prototype.printShortInTZ = function(PrintTime, PrintTimezone)
  {
    return this.adjustFromLocalTime().__printShort(PrintTime, true);
  };
Date.prototype.__printShort = function(PrintTime, Timezone)
  {
    return this.DATE_MONTHS[this.getMonth()] + "/" + this.getDate() + "/" + this.getFullYear() 
        + (PrintTime == true ? " " + this.print24hTime(Timezone) : "")
        ;
  };

Date.prototype.printFriendly = function(PrintYear, PrintTime)
  {
    return this.__printFriendly(PrintYear, PrintTime, false);
  };
Date.prototype.printFriendlyInTZ = function(PrintYear, PrintTime)
  {
    return this.adjustFromLocalTime().__printFriendly(PrintYear, PrintTime, true);
  };
Date.prototype.__printFriendly = function(PrintYear, PrintTime, Timezone)
  {
    return this.DATE_DAYS[this.getDay()] + ", " + this.DATE_MONTHS[this.getMonth()] + " " + this.printDayWithTH() 
          + (PrintYear == true ? " " + this.getFullYear() : "")
          + (PrintTime == true ? ", at " + this.print24hTime(Timezone) : "");
  };

Date.prototype.print = function() // "2010.10.06_01.50.56.123+0400"
  {
    var d = this.adjustFromLocalTime();
    return d.getFullYear() 
         + "." + (d.getMonth       () <    9 ? "0" : "") + (d.getMonth() + 1) 
         + "." + (d.getDate        () <   10 ? "0" : "") + d.getDate  () 
         + "_" + (d.getHours       () <   10 ? "0" : "") + d.getHours () 
         + "." + (d.getMinutes     () <   10 ? "0" : "") + d.getMinutes() 
         + "." + (d.getSeconds     () <   10 ? "0" : "") + d.getSeconds()
         + "." + (d.getMilliseconds() >= 100 ? "" : d.getMilliseconds() >= 10 ? "0" : "00") + d.getMilliseconds()
         + (d._timezone?d._timezone.str:"");
  };

Date.prototype.printContextual = function()
 {
   return this.__printContextual(false);
 }
Date.prototype.printContextualInTZ = function()
 {
   return this.adjustFromLocalTime().__printContextual(true);
 }
Date.prototype.__printContextual = function(xxx)
  {
    var today = new Date();
    if (xxx == true)
      {
        today._timezone = this._timezone;
        today = today.adjustFromLocalTime();
      }
      
    var Days = this.getDaysSince(today);
    
    if (Days == 0) // today
      {
        var Minutes = today.getMinutesSince(this);
        if (Minutes < 10)
          return "moments ago at " + this.print24hTime(xxx);
        if (Minutes < 60)
          return "about " + Minutes + " minutes ago at " + this.print24hTime(xxx);
        var Hours = today.getHoursSince(this);
        if (Hours < 4)
          return "about " + Hours + " hours ago at " + this.print24hTime(xxx);
        return "at " + this.print24hTime(xxx) + " today";
      }
    
    if (Days > -8 && Days < -1) // last week
     return "last " + this.DATE_DAYS[this.getDay()] + " (" + this.printDayWithTH() + ") at " + this.print24hTime(xxx);
    if (Days == -1) // yesterday
     return "at " + this.print24hTime(xxx) + " yesterday";
    if (Days == 1) // tomorrow
     return "at " + this.print24hTime(xxx) + " tomorrow";
    if (Days > 1 && Days < 8) // this week
     return "this " + this.DATE_DAYS[this.getDay()] + " (" + this.printDayWithTH() + ") at " + this.print24hTime(xxx);
    return "on " + xxx == true ? this.printFriendlyInTZ(true, true) : this.printFriendly(true, true);
  }



/**
 * Adds/substract randomly between minDays and maxDays number of days to this date
 * and sets the hours within the range prescribed (min/maxHour).
 */
Date.prototype.addRandomDeltaDays = function(minDays, maxDays, minHour, maxHour)
 {
   var days    = Math.floor((Math.random() * (maxDays-minDays)) + minDays);
   var hours   = Math.floor((Math.random() * (maxHour-minHour)) + minHour);
   var minutes = Math.floor((Math.random() * 60));
   this.setDate(this.getDate()+days);
   this.setHours(hours);
   this.setMinutes(minutes);
   return this;
 }

/**
 * Adds/substract randomly between minDays and maxDays number of days to this date
 * and sets the hours within the range prescribed (min/maxHours).
 */
Date.prototype.addRandomDeltaHours = function(minHours, maxHours)
 {
   var hours   = Math.floor((Math.random() * (maxHours-minHours)) + minHours);
   var minutes = Math.floor((Math.random() * 60));
   this.setHours(this.getHours()+hours);
   this.setMinutes(minutes);
   return this;
 }


// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Radio buttons and check boxes
// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var Radio = {
  header : function(Values, Before, After)
    {
      var Str ='';
      for (var i = 0; i < Values.length; ++i)
       Str += Before + Values[i][1] + After + '\n';
      return Str;
    },
  gen : function(ContainerId, ElementId, Values, Before, After, onChange, Default, Mode, noLabels)
    {
    if (Default != null && Default.indexOfSE!=null)
      Default = Default.length == 0 ? null : Default[0];
      var Str = '';
      var input = '<INPUT id="' + ElementId + '" name="' + ElementId + '"'
      if (Default != null)
        input += ' value="' + Default + '"';
      input += ' type="hidden">';
      for (var i = 0; i < Values.length; ++i)
        {
          var v = Values[i];
          Str += Before + (i==0?input:'') + '<A id="RADIO_' + ElementId + '_' + i + '" class="Radio_' + (Default == v[0] ? 'ON' : 'OFF') + '" title="' + v[2] + '" href="javascript:Radio.click(\'' + ElementId
              + '\', \'' + v[0] + '\', \'RADIO_' + ElementId + '_' + i + '\', ' + onChange + ','+Mode+');' + '">' + (noLabels==true?'&nbsp;':v[1]) + '</A>' + After + '\n';
        }
      if (ContainerId == null)
       return Str;
      setInnerHtml(ContainerId, Str);
    },
  click : function(ElementId, Value, TriggerId, onChange, Mode)
    {
      var e = document.getElementById(ElementId);
      if (e == null)
        return;
      if (e.value == Value && Mode==null)
        {
          e.value = '';
          e = document.getElementById(TriggerId);
          e.className = e.className.split("_")[0] + "_OFF";
        }
      else
        {
          e.value = Value;
          e = document.getElementById(TriggerId);
          var ClassName = e.className.split("_")[0];
          e.className = ClassName + "_ON";
          ClassName = ClassName + "_OFF";
          for (var i = 0; i < 20; ++i)
            {
              var r = document.getElementById("RADIO_" + ElementId + "_" + i);
              if (r == null)
                break;
              if (r.className == e.className && r != e)
                {
                  r.className = ClassName;
                  break;
                }
            }
        }

      if (onChange != null)
        onChange(ElementId);
    },
  get : function(ElementId)
    {
      var e = document.getElementById(ElementId);
      return e == null ? null : e.value;
    }
};


var Dropdown = {
    gen : function(ContainerId, ElementId, Values, firstEmpty, onChange, Default)
      {
        var Str = '<SELECT id="' + ElementId + '" name="' + ElementId + '"';
        if (onChange != null)
          Str+=' onChange="'+onChange+'"';
        Str+='>';
        if (firstEmpty == true)
         Str+='<OPTION value=""></OPTION>';
        for (var i = 0; i < Values.length; ++i)
          {
            var v = Values[i];
            Str += '<OPTION ' + (Default == v[0] ? 'selected' : '') + ' value="'+v[0]+'">'+v[1]+'</OPTION>';
          }
        Str+='</SELECT>';
        if (ContainerId == null)
         return Str;
        setInnerHtml(ContainerId, Str);
      },
    get : function(elementId)
      {
        var e = document.getElementById(elementId);
        return e.selectedIndex == -1 ? null : e.options[e.selectedIndex].value;
      },
    set : function(elementId, value)
      {
        var e = document.getElementById(elementId);
        var o = e.options;
        for (var i = 0; i < o.length; ++i)
         if (o[i].value == v || o[i].label == v || o[i].text == v)
          {
            e.selectedIndex = i;
            return;
          }
      }
  };


var Checkbox = {
  header: Radio.header, 
  gen : function(ContainerId, ElementId, Values, Before, After, onChange, Defaults, noLabels)
    {
    if (Defaults != null && Defaults.indexOfSE==null)
     Defaults = [Defaults];
      var Str = '';
      for (var i = 0; i < Values.length; ++i)
        {
          var v = Values[i];
          var match = Defaults != null && Defaults.indexOfSE(v[0]) != -1;
          Str += Before + '<A href="javascript:Checkbox.click(\'' + ElementId + '_' + i + '\', ' + onChange + ');' + '" id="CHECKBOX_' + ElementId + '_' + i + '" class="Checkbox_'
              + (match ? 'ON' : 'OFF') + '" title="' + v[2] + '"><INPUT id="' + ElementId + '_' + i + '" name="' + ElementId + v[0] + '" type="hidden" value="' + (match ? '1' : '0') + '">' + (noLabels==true?'':v[1])
              + '</A>' + After + '\n';
        }
      if (ContainerId == null)
       return Str;
      setInnerHtml(ContainerId, Str);
    },
  click : function(ElementId, onChange)
    {
      var e = document.getElementById(ElementId);
      if (e == null)
        return;
      if (e.value != 0)
        {
          e.parentNode.className = e.parentNode.className.split("_")[0] + "_OFF";
          e.value = 0;
        }
      else
        {
          e.parentNode.className = e.parentNode.className.split("_")[0] + "_ON";
          e.value = 1;
        }
      if (onChange != null)
       onChange(ElementId);
    },
  get : function(ElementId)
    {
      var vals = [];
      for (var i = 0; i < 20; ++i)
        {
          var r = document.getElementById(ElementId + "_" + i);
          if (r == null)
            break;
          if (r.value != 0)
            vals.push(r.name.substring(ElementId.length));
        }
      return vals;
    }
};

var Rating = {
  gen : function(ContainerId, ElementId, label, maxValue, onChange, Default)
  {
    var Str = '<INPUT id="' + ElementId + '" name="' + ElementId + '"'
    if (Default != null)
      Str += ' value="' + Default + '"';
    Str += ' type="hidden"><SPAN id="' + ElementId + '_STARS" class="RatingStars">';

    for (var i = 1; i <= maxValue; ++i)
    {
      var match = Default != null && i <= Default;
      Str += '<A href="javascript:Rating.click(\'' + ElementId + '\', ' + i + ', ' + maxValue + ', ' + onChange + ', \'' + onChange
          + '\');' + '"><IMG src="img/star' + (match == true ? "On" : "Off") + '.gif"></A>\n';
    }
    Str += '</SPAN><SPAN class="RatingLabel">' + label + '</SPAN>';
    if (ContainerId == null)
      return Str;
    setInnerHtml(ContainerId, Str);
  },
  click : function(ElementId, v, maxValue, onChange, onChangeStr)
  {
    var e = document.getElementById(ElementId);
    if (e == null)
      return;
    e.value = v;
    var Str = "";
    for (var i = 1; i <= maxValue; ++i)
    {
      var match = i <= v;
      Str += '<A href="javascript:Rating.click(\'' + ElementId + '\', ' + i + ', ' + maxValue + ', ' + onChange + ');'
          + '"><IMG src="img/star' + (match == true ? "On" : "Off") + '.gif"></A>\n';
    }
    setInnerHtml(ElementId + '_STARS', Str);
    if (onChange != null)
      onChange(ElementId);
  },
  get : function(ElementId)
  {
    var e = document.getElementById(ElementId);
    return e == null ? null : e.value;
  }
};

var Ranking = {
  gen : function(ContainerId, ElementId, Values, onChange, Defaults)
  {

    if (Defaults != null && typeof Defaults == "string")
      Defaults = Defaults.split(",");
    if (Defaults != null && typeof Defaults == "Array" && Defaults.length > 0)
      {
        for (var i = 0; i < Defaults.length; ++i)
         if (Values.getSE(Defaults[i], 0) == null)
          {
            Defaults = null;
            break;
          }
      }
    else
     Defaults = null;

    if (Defaults == null)
     {
       Defaults = [];
       for (var i = 0; i < Values.length; ++i)
        Defaults.push(Values[i][0]);
     }

    var Str = '<INPUT id="' + ElementId + '" name="' + ElementId + '" value="' + Defaults + '" type="hidden">'
             +'<SPAN id="' + ElementId + '_RANKING" class="Ranking">';
    for (var i = 0; i < Defaults.length; ++i)
    {
      var v = Values.getSE(Defaults[i], 0, "Cannot locate option XXX");
      var Prev = '<A href="javascript:Checkbox.click(\'' + ElementId + '\', '+i+', -1, ' + onChange + ');' + '"><IMG class="left" src="img/arrow-left.gif"></A>';
      var Next = '<A href="javascript:Checkbox.click(\'' + ElementId + '\', '+i+',  1, ' + onChange + ');' + '"><IMG class="right" src="img/arrow-right.gif"></A>';
      Str += (i==0?'':Prev) + '<SPAN id="'+ElementId+'_'+v[0]+'">'+v[1]+'</SPAN>' + (i==Values.length-1?'':Next) + '\n';
    }
    Str+='</SPAN>';
    if (ContainerId == null)
      return Str;
    setInnerHtml(ContainerId, Str);
  },
  click : function(ElementId, i, direction, onChange)
  {
    var e = document.getElementById(ElementId);
    //childNode[4].parentNode.insertBefore(childNode[4], childNode[3]);
    if (e == null)
      return;
    if (e.value != 0)
    {
      e.parentNode.className = e.parentNode.className.split("_")[0] + "_OFF";
      e.value = 0;
    }
    else
    {
      e.parentNode.className = e.parentNode.className.split("_")[0] + "_ON";
      e.value = 1;
    }
    if (onChange != null)
      onChange(ElementId);
  },
  get : function(ElementId)
  {
    var vals = [];
    for (var i = 0; i < 20; ++i)
    {
      var r = document.getElementById(ElementId + "_" + i);
      if (r == null)
        break;
      if (r.value != 0)
        vals.push(r.name.substring(ElementId.length));
    }
    return vals;
  }
};



// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Array extensions
// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

if (!Array.prototype.randomElement)
  Array.prototype.randomElement = function()
    {
      return this[Math.floor((Math.random() * this.length))];
    }

if (!Array.prototype.indexOfSE)
  Array.prototype.indexOfSE = function(obj, field, throwMsg)
    {
      if (field == null)
       {
         for (var i = 0; i < this.length; i++)
          if (this[i] == obj)
           return i;
       }
      else
       {
         for (var i = 0; i < this.length; i++)
          if (this[i][field] == obj)
           return i;
       }
      if (throwMsg != null)
       alertThrow(throwMsg);
      return -1;
    };
    
if (!Array.prototype.getSE)
  Array.prototype.getSE = function(obj, field, throwMsg)
    {
      if (field == null)
       {
         for (var i = 0; i < this.length; i++)
          if (this[i] == obj)
           return this[i];
       }
      else
       {
         for (var i = 0; i < this.length; i++)
          if (this[i][field] == obj)
           return this[i];
       }
      if (throwMsg != null)
        alertThrow(throwMsg);
    };


// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// String extensions
// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
if (!String.prototype.trim)
  String.prototype.trim = function()
    {
      return this.replace(TextUtil.REGEX_TRIM, "");
    };

if (!String.prototype.endsWith)
  String.prototype.endsWith = function(str)
    {
      return this.match(str + "$") != null;
    };

if (!String.prototype.startsWith)
  String.prototype.startsWith = function(str)
    {
      return this.match("^" + str) == str;
    };

if (!String.prototype.isEmpty)
  String.prototype.isEmpty = function()
    {
      for (var i = 0; i < this.length; ++i)
        {
          var c = this[i];
          if (c != ' ' && c != '\t' && c != '\n' && c != '\r')
            return false;
        }
      return true;
    };
    
if (!String.prototype.printFuncParam)
  String.prototype.printFuncParam = function()
    {
      return this.replace(TextUtil.REGEX_SL, "\\\\").replace(TextUtil.REGEX_DQ, "&quot;").replace(TextUtil.REGEX_SQ, "\\\'");
    };

if (!String.prototype.printHtmlAttrValue)
  String.prototype.printHtmlAttrValue = function()
    {
      return this.replace(TextUtil.REGEX_SL, "\\\\").replace(TextUtil.REGEX_DQ, "&quot;");
    };
        
    
if (!String.prototype.highlight)
 String.prototype.highlight = function(Regex, ClassName)
  {
    return this.replace(Regex, '<SPAN class="'+ClassName+'">$1</SPAN>');
  } 

var TextUtil = {
  REGEX_DQ : /\"/g,
  REGEX_SQ : /\'/g,
  REGEX_SL : /\\/g,
  REGEX_SPACES : /\s/g,
  REGEX_TRIM : /^\s+|\s+$/g,
  REGEX_NL : /\r\n|(\n?)<\s*\/?\s*BR\s*>|\n/g,
  printFuncParam : function(Str)
    {
      return Str == null ? "" : Str.printFuncParam();
    },
  isNullOrEmpty : function(Str)
    {
      return Str ? Str.isEmpty() : true;
    },
  print : function(val, def)
    {
      return this.isNullOrEmpty(val) ? def : val;
    },
  replaceNewLinesWithBreaks : function(Str)
    {
      return Str == null ? "" : Str.replace(this.REGEX_NL, "\n<BR>");
    },
  replaceNewLinesWithSpaces : function(Str)
    {
      return Str == null ? "" : Str.replace(this.REGEX_NL, " ");
    },
  replaceNewLinesWithCommas : function(Str)
    {
      return Str == null ? "" : Str.replace(this.REGEX_NL, ", ");
    },
  replaceSpacesWithNBSPs : function(Str)
    {
      return Str == null ? "" : Str.replace(StringProcessor.REGEX_SPACES, "&nbsp;");
    },
  REGEX_DictMatch : /\[\^([^\^]*)\^\]/g,
  dictionaryMatchHighlight: function(Str, ClassName)
   {
     return Str == null ? "" : Str.highlight(this.REGEX_DictMatch, ClassName)
   }
};


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Number exception
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var NumberUtil = {
  printWith1Dec: function(n)
   {
     return ~~(n*10)/10.0;
   },
  printWith2Dec: function(n)
   {
     return ~~(n*100)/100.0;
   },
  printPercentWith1Dec: function(Total, Sub)
   {
     return NumberUtil.printWith1Dec(100.0 * ((Sub * 1.0) / (Total * 1.0)));
   },
  printPercentWith2Dec: function(Total, Sub)
   {
     return NumberUtil.printWith2Dec(100.0 * ((Sub * 1.0) / (Total * 1.0)));
   },
  printPerformancePerSecondWith1Dec: function(DurationMillis, Count)
   {
     return NumberUtil.printWith1Dec(1000.0 * Count / DurationMillis);
   },
  printPerformancePerSecondWith2Dec: function(DurationMillis, Count)
   {
     return NumberUtil.printWith2Dec(1000.0 * Count / DurationMillis);
   },
  printPerformancePerMillisWith1Dec: function(DurationMillis, Count)
   {
     return NumberUtil.printWith1Dec(1.0*Count / DurationMillis);
   },
  printPerformancePerMillisWith2Dec: function(DurationMillis, Count)
   {
     return NumberUtil.printWith2Dec(1.0*Count / DurationMillis);
   },
  printWithThousands: function(n)
   {
     return n==null?"N/A":n.toLocaleString();
   }
}

// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Misc
// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function PaintTableStrObj(itemList, tableClass, tableStyle, PainterObj)
  {
    var Str = '<TABLE border="0px" cellspacing="0px" class="' + tableClass + '" style="' + tableStyle + '">\n';
    var count = 0;
    if (PainterObj.init != null)
      PainterObj.init();
    if (PainterObj.paintFirst != null)
      Str+=PainterObj.paintFirst();
    if (itemList != null)
      for (var i = 0; i < itemList.length; ++i)
        if (PainterObj.check == null || PainterObj.check(itemList[i]) == true)
          Str += PainterObj.paint(i, ++count, itemList[i]);
    if (PainterObj.paintLast != null)
      Str+=PainterObj.paintLast(count);
    Str += '</TABLE>\n';
    return Str;
  }

// Bad stuff, for backwards compatibility with core written in a rush a week ago!!!
function PaintTableStr(itemList, tableClass, tableStyle, PainterFunc)
  {
    return PaintTableStrObj(itemList, tableClass, tableStyle, {
      paint : PainterFunc
    });
  }

function PaintTable(elementId, itemList, tableClass, tableStyle, PainterObj)
  {
    var Str = PaintTableStrObj(itemList, tableClass, tableStyle, PainterObj);
    if (elementId == null)
     return Str;
    setInnerHtml(elementId, Str);
  }



function PromptBeforeProceeding(Text, Url, Post)
  {
    if (confirm(Text) == true)
      {
        var Form = document.createElement("FORM");
        Form.method = Post == true ? "POST" : "GET";
        Form.action = Url;
        document.body.appendChild(Form);
        Form.submit();
      }
  }

function HoldMomentarily(elementIds, size)
  {
    for (var i = 0; i < elementIds.length; ++i)
      {
        var e = document.getElementById(elementIds[i]);
        if (e != null)
          e.innerHTML = '<BR><CENTER><IMG src="/static/img/progress.gif" width="' + (size == null ? "20px" : size) + '"></CENTER><BR>';
      }
  }

var DelayedEvent = {
  register : function(elementId, timing, func)
    {
      var to = DelayedEvent.eventList[elementId];
      if (to != null)
        {
          window.clearTimeout(to);
        }
      DelayedEvent.eventList[elementId] = setTimeout(function()
        {
          delete DelayedEvent.eventList[elementId];
          func();
        }, timing);
    },
  eventList : new Object()
};

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
function debounce(func, wait, immediate)
  {
    var timeout;
    return function()
      {
        var context = this, args = arguments;
        var later = function()
          {
            timeout = null;
            if (!immediate)
              func.apply(context, args);
          };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow)
          func.apply(context, args);
      };
  };

  
 var getAbsoluteUrl = (function()
  {
    var a;

    return function(url)
      {
        if (!a)
          a = document.createElement('a');
        a.href = url;

        return a.href;
      };
  })();


function playAvatar()
 {
    setTimeout(function() {
        alicejs.cheshire({"elems": ["HEADER_AVATAR"], "duration": {"value": "3000ms","randomness": "40%"},"timing": "ease-in-out","rotate": randomBetween(0, 540)+"%","flip": "left","turns": randomPick(2, 3, 50),"fade": "in","overshoot": randomBetween(30, 60)+"%","backfaceVisibility": "visible"});
    }, 20);
 }

function makeAvatarName(person)
 {
    return person.picture==true?cleanAvatarName(person.nameStandard):'default'+person.gender;
 }
function cleanAvatarName(name)
{
   return name.replace(/[^a-zA-Z0-9]/g, "");
}


function FactoryRegistry(baseTypeName, funcNames)
{
  this._classNames= new SortedObjectMap();
  this._baseTypeName = baseTypeName;
  this._funcNames    = funcNames;
  this._funcNames.push("init");
  
  this.register = function(typeName, defaultParamObject)
    {
      if (defaultParamObject == null)
        defaultParamObject = { };
      if (this._classNames.put(typeName, defaultParamObject) == false)
       alertThrow("System error: the "+this._baseTypeName+" '"+typeName+"' is being registered more than once.");
      var className = this._baseTypeName+"_"+typeName;
      var pro = window[className];
      if (pro == null)
       alertThrow("System error: the class '"+className+"' cannot be found.");
      var cla = new pro();
      var Str = "";
      for (var i = 0; i < this._funcNames.length; ++i)
       {
         if (cla[this._funcNames[i]] == null)
           {
             if (Str.length != 0)
               Str+=", "
             Str+=this._funcNames[i]+"()";
           }
       }
      if (Str.length != 0)
       alertThrow("System error: the class '"+className+"' is missing methods "+Str+".");
    };
    
  this.getInstance = function(typeName, paramObject)
   {
     var defaultParamObject = this._classNames.get(typeName);
     if (defaultParamObject == null)
      return null;
     var Obj = new window[this._baseTypeName+"_"+typeName];
     return { obj: Obj, init: Obj.init(paramObject==null?defaultParamObject : paramObject) };
   }
 }
