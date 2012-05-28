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
      self._testContainer();

      self._setWidthOfInput();
      self._bindEventsFromKeyboard();
      self.focus();
    },

    focus: function() {
      var self = this;

      self.$element.find('input').focus();
    },

    /**
     * Create Container if not present
     * @private
     */
    _testContainer: function() { 
      var self = this,
          $container = $('#shell-container');

      if ($container && $container.length) {
        return;
      }
      self._renderShellHtml();
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
      var $container = $('#shell-container'),
          $prompt = $container.find('.shell-prompt'),
          spacer = 30,
          width = $container.outerWidth(false) - $prompt.outerWidth(false) - spacer;

      $container
        .find('input')
        .css('width', width);
    },

    /**
     * Bind events from keyboard
     * Submit with enter and show last command after "arrow up"
     * @private
     */
    _bindEventsFromKeyboard: function() {
        var $container = $('#shell-container'),
            $input = $container.find('input'),
            code,
            lastCommand;

        $input.bind('keyup', function(e) {
          code = e.which;
          if (code === 13) { // "Enter" key
            if ($.trim($input.val()).length === 0) {
              return;
            }
            //processInput($(this).val());
            lastCommand = $input.val();
            $input.val('');
          } else if (code === 38) { // "Up arrow" key
            if (lastCommand && $input.val() !== lastCommand) {
              $input.val(lastCommand);
            }
          }
        });
    },

    /**
     * Process input 
     * @private
     */
    _processInput: function(input) {
      var $shell = $('#shell'),
          $input = $("#shell-command-input"),
          html = '<li class="shell-wait"><img src="images/loading-shell.gif" /> Calculating</li>"';

      $shell.append(html);
      
      $input.attr("disabled", "disabled");
    }
    
  };

  $.fn.extend({
    shell: function(options) {
      var args = Array.prototype.slice.call(arguments), 
          method = args.shift();

      return this.each(function(index, element) {
          var instance = $.data(element, 'shell') || $.data(element, 'shell', new Shell(options, element));
          if (method && typeof method === 'string' && method.charAt(0) !== '_' && $.isFunction(instance[method])) {
            instance[method].apply(instance, args);
          }
      });
    }
  });

  $.fn.shell.defaults = {

  };


}(jQuery));
