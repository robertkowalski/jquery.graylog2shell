/*
 * jquery.graylog2shell
 * https://github.com/robertkowalski/jquery.graylog2shell
 *
 * Copyright (c) 2012 Robert Kowalski
 * Licensed under the GPL license.
 */

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
      var oldPrompt = $(".shell-prompt").first().html(),
          $shellLines = $(".old-input, .shell-wait");

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
          $oldInput = $shell.find(".old-input"),
          htmlWaiting = '<li class="shell-wait"><div class="shell-loading"></div><div>Calculating</div></li>',
          htmlInput = '<li><span class="shell-prompt">' + $prompt.text() + '</span>' + '<span class="old-input">' + $input.val() + '</span></li>';

      $shell.append(htmlWaiting);

      if (!$oldInput || !$oldInput.length) { 
        $input.parent()
          .parent()
          .prepend(htmlInput);
      } else {
        $oldInput.last()
          .append(htmlInput);
      }

      $input.attr("disabled", "disabled");
      self._makeAjaxCall(input);
    },

    /**
     * Sends Ajax calls
     * @private
     * @param {String} input
     */
    _makeAjaxCall: function(input) {

      $.ajax({
        type: "POST",
        url: "analytics/shell",
        dataType: "json",
        data: { cmd : input },
        success: function(data) {

        },
        error: function(data) {

        }
      });
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
