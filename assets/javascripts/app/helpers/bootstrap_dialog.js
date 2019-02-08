define(function(require, exports, module) {
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // bootstrap Dialog
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  var bootstrap = {};
  var a = /\/static\/(img|avatars)\//ig;
  bootstrap.Dialog = function(elementId)
  {
    this.ele = elementId;
    this.$ele = $('#'+elementId);
    this.modal_content_template = _.template(require('text!templates/generic_modal.html'));
  };
  bootstrap.Dialog.prototype.setOnLoad = function(func)
  {
    this.onShow = func
  };
  bootstrap.Dialog.prototype.setOnHide = function(func)
  {
    this.onHide = func;
  };

  bootstrap.Dialog.prototype.handleBackButton = function(event) {
    event.preventDefault();
  }

  bootstrap.Dialog.prototype.setFullScreen = function() {
    HeightPercent = 0.97
    WidthPercent = 0.97

    // Calculate Height & Width
    height = ($(window).height() * HeightPercent);
    width = ($(window).width() * WidthPercent);

    // Resize Modal
    this.$ele.find('.modal-dialog').css({
      width: width+"px",
      height:height+"px",
      margin: "1em",
      'max-height':'100%',
    });

    // Apply resize to Modal-Body as well
    this.$ele.find('.modal-body').css({
      width: width+"px",
      height: (height * 0.98) + "px"
    })
  }

  bootstrap.Dialog.prototype.show = function(Title, Url, WidthPercent, HeightPercent)
  {
    // width = null;
    // height = null;

    __bootstrap_dialog = this;
    // var ScreenDim = dijit.getViewport();
    // this.dlg.dimensions = [ ScreenDim.w * WidthPercent, ScreenDim.h * HeightPercent ];
    if($('.modal').length > 0){
      $('.modal' ).modal( 'hide' ).data( 'bs.modal', null );
      $('.modal').remove();
    }
    if($("#"+this.ele).length > 0){
      this.$ele.replaceWith(
        this.modal_content_template({
          modal_title: Title,
          modal_body: '',
          modal_id: this.ele
        })
      )
    }
    else{
      $('body').append(this.modal_content_template({
          modal_title: Title,
          modal_body: '',
          modal_id: this.ele
        })
      );
    }
    this.$ele = $("#"+this.ele);
    if(Url != null){
      $ajax = $.ajax({
        url: Url,
        dataType: "TEXT"
      });
      $ajax.done(function(response){
        // set content to body
        __bootstrap_dialog.$ele.find(".modal-body").html(response);
        __bootstrap_dialog.setFullScreen();
        __bootstrap_dialog.$ele.modal('show');
      });
      $ajax.fail(function(){
        // set content to body
        __bootstrap_dialog.$ele.find(".modal-body").html("Server error occured please try later");
        __bootstrap_dialog.$ele.modal('show');
      });
    }
    else {
      this.$ele.find('.modal-body').html(this.content);
      this.setFullScreen();
      this.$ele.modal('show');
    }
    $('body').on('hidden.bs.modal', "#"+this.ele, function () {
      $(this).removeData('bs.modal');
      if(typeof(__bootstrap_dialog.onHide) != "undefined")
        after(0, function(){__bootstrap_dialog.onHide();});
      document.removeEventListener("backButton", __bootstrap_dialog.handleBackButton)
    });
    $('body').on('shown.bs.modal', "#"+this.ele, function () {
      if(typeof(__bootstrap_dialog.onShow) != "undefined")
        after(0, function(){__bootstrap_dialog.onShow();});
      document.addEventListener("backButton", __bootstrap_dialog.handleBackButton)
    });
    $('body').on('show.bs.modal', "#"+this.ele, function () {
      // if(HeightPercent == null || HeightPercent.length == 0)
      //   HeightPercent = 1

      // if(WidthPercent == null || WidthPercent.length == 0)
      //   WidthPercent = 1
      
      // // Calculate Height & Width
      // height = height = ($(window).height() * HeightPercent);
      // width = ($(window).width() * WidthPercent);

      // // Resize Modal
      // $(this).find('.modal-dialog').css({
      //   width: width+"px",
      //   height:height+"px",
      //   'max-height':'100%'
      // });

      // // Apply resize to Modal-Body as well
      // $(this).find('.modal-body').css({
      //   width: width+"px",
      //   height: (height * 0.9) + "px",
      //   'overflow-y': "auto"
      // })
    });
  };
  bootstrap.Dialog.prototype.setContent = function(Str)
  {
    this.content = Str.replace(a, "./img/static/");
    this.$ele.find(".modal-body").html(this.content);
    // this.$ele.find('.modal-body').html(Str);
  };
  bootstrap.Dialog.prototype.hide = function()
  {
    this.$ele.modal('hide');
    this.$ele.removeData('bs.modal');  // to be safe.
    this.$ele.remove(); // remove dom ele
  };
  return bootstrap;
});