/*
 * jquery.graylog2shell
 * https://github.com/robertkowalski/jquery.graylog2shell
 *
 * Copyright (c) 2012 Robert Kowalski
 * Licensed under the GPL license.
 */

(function($, window) {

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
          $input = $shell.find("#shell-command-input"),
          $prompt = $shell.find(".shell-prompt").first(),
          $oldInputContainer = $shell.find("#shell-oldinput-container"),
          htmlWaiting = '<div class="shell-wait"><div class="shell-loading"></div><div>Calculating</div></div>',
          htmlInput = '<div class="shell-history-line"><span class="shell-prompt">' + $prompt.text() + '&nbsp;</span>' + '<span class="shell-old-input">' + $input.val() + '</span></div>',
          history = self.options.history;

      $shell.append(htmlWaiting);

      if (history) {
        $oldInputContainer.append(htmlInput);
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
      var self = this;

      $.ajax({
        type: "POST",
        url: "analytics/shell",
        dataType: "json",
        data: { cmd : input },
        success: function(data) {
          self._renderCallback(data);
        },
        error: function() {
          self._renderCallback({code: "error", reason: "Internal error."});
        }
      });
    },

    /**
     * Builds lines for the shell
     * @private
     */
    _buildResultLine: function(cssClass, msg) {
      var self = this;

      return '<div class="' + cssClass + '">' + self._getTimestamp() + ' - ' + msg + '</div>';
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
     * Adds leading zeros to numbers under 10
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

    /**
     * Prepares shell results and adds them to the shell / results
     * @private
     * @param {Object} data
     */
    _renderCallback: function(data) {
      var self = this,
          $shell = $('#shell'),
          $oldInputContainer = $shell.find("#shell-oldinput-container"),
          $waiting = $shell.find('.shell-wait'),
          $input = $shell.find("#shell-command-input"),
          history = self.options.history,
          html,
          $contentInner,
          result;

      $waiting.remove();
      $input.attr("disabled", "");

      if ($oldInputContainer.find('.shell-history-line').length >= 15) {
        $oldInputContainer.find('.shell-history-line').first().remove();
        $oldInputContainer.find('.shell-history-result-line').first().remove();
      }

      if (!data) {
        html = self._buildResultLine("shell-error shell-history-result-line", "Internal error - Undefined result.");
        $oldInputContainer.append(html);
        return;
      }

      if (data.code && data.code === "error") {
        html = self._buildResultLine("shell-error shell-history-result-line", data.reason);
        $oldInputContainer.append(html);
        return;
      }

      if (!data.op) {
        self._logToConsole("Found no data.op or other suitable data");
        return;
      }

      if (data.op === "findresult") {
        $contentInner = $("#content-inner");
        $contentInner.html(data.content);
        return;
      }

      if (data.code === "success") {
        result = "Completed in " + data.ms + "ms";

        switch (data.op) {
          case "count":
            result += self._buildCountResult(data.result);
            break;
          case "distinct":
            result += self._buildDistinctResult(data.result);
            break;
          case "distribution":
            result += self._buildDistributionResult(data.result);
            break;
        }

        html = self._buildResultLine("shell-success shell-history-result-line", result);
        $oldInputContainer.append(html);
      }
    },

    /**
     * Helps preparing shell results for results with "count"
     * @private
     * @param {String} data
     */
    _buildCountResult: function(data) {
      var self = this,
          result = " - Count result: ";

      return result + self._wrapInSpan("shell-result-string", data);
    },

    /**
     * Helps preparing shell results for results with "distinct"
     * @private
     * @param {Object, Array} data
     */
    _buildDistinctResult: function(data) {
      var self = this,
          result = " - Distinct result: ",
          count = data.length,
          i = 0,
          index;

      if (count === 0) {
        result += "No matches.";
      } else {
        for (index in data) {
          result += data[index];
          if (i < count - 1) {
            result += ",";
          }
          i++;
        }
      }

      return self._wrapInSpan("shell-result-string", result);
    },

    /**
     * Helps preparing shell results for results with "distribution"
     * @private
     * @param {Object} data
     */
    _buildDistributionResult: function(data) {
      var self = this,
          result = " - Distribution result: ",
          count = data.length,
          i = 0,
          index;

      if (data.length === 0) {
        result += "No matches.";
      } else {
        for (index in data) {
          result += data[index].distinct + " (" + parseInt(data[index].count, 10) + ")";
          if (i < count - 1) {
            result += ", ";
          }
          i++;
        }

      }

      return self._wrapInSpan("shell-result-string", result);
    },

    /**
     * Wraps Strings in span elements
     * @private
     * @param {String} cssClass
     * @param {String} data
     */
    _wrapInSpan: function(cssClass, data) {

      return '<span class="' + cssClass + '">' + data + '</span>';
    },

    /**
     * Logs to the console if present
     * @private
     * @param {String} text
     */
    _logToConsole: function(text) {
      if (window.console && console.log) {
        console.log(text);
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
    history: true
  };


}(jQuery, window));
