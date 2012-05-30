/*! jQuery Graylog2 Shell - v0.1.0 - 2012-05-31
* https://github.com/robertkowalski/jquery.graylog2shell
* Copyright (c) 2012 Robert Kowalski; Licensed GPL */

(function($) {

  var Shell = function() {
    var self = this;
    
    if ($.isFunction(self._init)) {
      self._init.apply(self, arguments);
    }
  };

  Shell.prototype = {

    _init: function(opts, element) {
      var self = this, 
          options = {};

      self.defaults = $.fn.shell.defaults;
      $.extend(true, options, self.defaults, opts);

      self.options = options;
      self.$element = $(element);
      self._createContainerIfNotExists();

      self._setWidthOfInput();
      self._bindEventsFromKeyboard();
      self.focus();
    },

    /**
     * Focus the input field
     * @public
     */
    focus: function() {
      var self = this;

      self.$element.find("input").focus();
    },

    /**
     * Creates a container for the shell if not present
     * @private
     */
    _createContainerIfNotExists: function() {
      var self = this,
          containerExists = self._testForContainer();

      if (!containerExists) {
        self._renderShellHtml();
      }
    },

    /**
     * Tests if a container is present
     * @private
     */
    _testForContainer: function() {
      var self = this,
          $container = $("#shell-container");

      if ($container && $container.length) {
        return true;
      }
    },

    /**
     * Create HTML for the Shell
     * @private
     */
    _createShellHtml: function() {
      var html = '<div id="shell-container">\
                    <ul id="shell">\
                      <li>\
                        <span class="shell-prompt">rocko #</span>\
                        <input class="shell-command-input" type="text" spellcheck="false">\
                      </li>\
                    </ul>\
                  </div>';

      return html;
    },

    /**
     * Render Container HTML
     * @private
     */
    _renderShellHtml: function() {
      var self = this,
          html = self._createShellHtml();

      self.$element.html(html);
    },

    /**
     * Set the width of the input
     * @private
     */
    _setWidthOfInput: function() {
      var $container = $("#shell-container"),
          $prompt = $container.find(".shell-prompt"),
          spacer = 30,
          width = $container.outerWidth(false) - $prompt.outerWidth(false) - spacer;

      $container
        .find("input")
        .css("width", width);
    },

    /**
     * Bind events from keyboard
     * Submit with enter and show last command after "arrow up"
     * @private
     */
    _bindEventsFromKeyboard: function() {
      var self = this,
          $container = $("#shell-container"),
          $input = $container.find("input"),
          code,
          lastCommand,
          value;

      $input.bind("keyup", function(e) {
        code = e.which;
        if (code === 13) { // "Enter" key
          self._handleEnterPress();
        } else if (code === 38) { // "Up arrow" key
          lastCommand = self.lastCommand;
          value = $input.val();
          if (lastCommand && value !== lastCommand) {
            $input.val(lastCommand);
          }
        }
      });
    },

    /**
     * Actions after pressing enter with input
     * @private
     */
    _handleEnterPress: function() {
      var self = this,
          $container = $("#shell-container"),
          $input = $container.find("input"),
          value = $input.val();

      if (!$.trim(value).length) {
        return;
      } else if (value === "clear") {
        self._clearShell();
        return;
      }

      self._processInput(value);
      self.lastCommand = value;
      $input.val("");
    },

    /**
     * A clear command like in bash
     * @private
     */
    _clearShell: function() {
      var $shellLines = $(".shell-old-input, .shell-wait");

      $shellLines.remove();
    },

    /**
     * Process input 
     * @private
     * @param {String} input
     */
    _processInput: function(input) {
      var self = this,
          $shell = $('#shell'),
          $input = $shell.find(".shell-command-input"),
          $prompt = $shell.find(".shell-prompt").first(),
          $oldInput = $shell.find(".shell-old-input"),
          htmlWaiting = '<li class="shell-wait"><div class="shell-loading"></div><div>Calculating</div></li>',
          htmlInput = '<li><span class="shell-prompt">' + $prompt.text() + '</span>' + '<span class="shell-old-input">' + $input.val() + '</span></li>';

      $shell.append(htmlWaiting);
      self._addLine(htmlInput);

      $input.attr("disabled", "disabled");
      self._makeAjaxCall(input);
    },

    /**
     * Sends Ajax calls
     * @private
     * @param {String} input
     */
    _makeAjaxCall: function(input) {
      var self = this;

      $.ajax({
        type: "POST",
        url: "analytics/shell",
        dataType: "json",
        data: { cmd : input },
        success: function(data) {

        },
        error: function() {
          self._renderCallback({code: "error", reason: "Internal error."});
        }
      });
    },

    /**
     * Adds lines to the shell
     * @private
     */
    _addLine: function(line) {
      var self = this,
          $shell = $('#shell'),
          $input = $shell.find(".shell-command-input"),
          $oldInput = $shell.find(".shell-old-input");

      if (!$oldInput || !$oldInput.length) {
        $input.parent()
          .parent()
          .prepend(line);
      } else {
        $oldInput.last()
          .append(line);
      }
    },

    /**
     * Builds lines for the shell
     * @private
     */
    _buildResultLine: function(cssClass, msg) {
      var self = this;

      return '<li class="' + cssClass + '">' + self._getTimestamp() + ' - ' + msg + '</li>';
    },

    /**
     * Builds times, like 12:35:23
     * @private
     */
    _getTimestamp: function() {
      var self = this,
          date = new Date();

      return self._dateHelper(date.getHours()) + ":" + self._dateHelper(date.getMinutes()) + ":" + self._dateHelper(date.getSeconds());
    },

    /**
     * Adds leading zeros to number under 10
     * @private
     * @param {String, Number} datePartial
     */
    _dateHelper: function(datePartial) {
      var number = +datePartial;

      if (number < 10) {
        number = "0" + number;
      }

      return number;
    },

    _renderCallback: function(data) {
      var self = this,
          html;

      if (!data) {
        html = self._buildResultLine("shell-error", "Internal error - Undefined result.");
        self._addLine(html);
        return;
      }

      if (data.code && data.code === "error") {
        html = self._buildResultLine("shell-error", "Internal error.");
        self._addLine(html);
        return;
      }


    }

  };

  $.fn.extend({
    shell: function(options) {
      var args = Array.prototype.slice.call(arguments), 
          method = args.shift();

      return this.each(function(index, element) {
          var instance = $.data(element, "shell") || $.data(element, "shell", new Shell(options, element));
          if (method && typeof method === "string" && method.charAt(0) !== "_" && $.isFunction(instance[method])) {
            instance[method].apply(instance, args);
          }
      });
    }
  });

  $.fn.shell.defaults = {

  };


}(jQuery));
