/*global QUnit:false, module:false, test:false, asyncTest:false, expect:false*/
/*global start:false, stop:false ok:false, equal:false, notEqual:false, deepEqual:false*/
/*global notDeepEqual:false, strictEqual:false, notStrictEqual:false, raises:false*/
(function($) {

  module("jQuery#buildShell", {
    setup: function() {
      this.elem = $(".shell-box");

      this.enterText = function(text) {
        $(".shell-command-input").val(text);
        var e = $.Event("keyup");
        e.which = 13;
        $(".shell-command-input").trigger(e);
      };
    }
  });

  test("is chainable", 1, function() {
    // Not a bad test to run on collection methods.
    strictEqual(this.elem.shell(), this.elem, "should be chaninable");
  });

  test("creates the markup", 4, function() {
    this.elem.shell();
    strictEqual($('#shell-container').length, 1, "#shell-container-element should exist");
    strictEqual($('#shell').length, 1, "#shell-element should exist");
    strictEqual($('.shell-prompt').length, 1, ".shell-prompt-element should exist");
    strictEqual($('.shell-command-input').length, 1, ".shell-command-input-element should exist");
  });

  test("scales the input", 1, function() {
    var spacer = 30;
    this.elem.shell();
    var inputWidth =  $("#shell-container").outerWidth(false) - $(".shell-prompt").outerWidth(false) - spacer;
    strictEqual($("#shell-container").find("input").css("width"), inputWidth + "px", "should be scaling the input width");
  });

  test("should be focussed", 1, function() {
    this.elem.shell();
    /* no :focus in jQuery 1.4.2 */
    strictEqual($(".shell-command-input")[0], $(".shell-command-input")[0].ownerDocument.activeElement, "input should be focussed");
  });

  test("input is emptied after pressing enter", 2, function() {
    this.elem.shell();
    $(".shell-command-input").val('graylog');
    strictEqual($(".shell-command-input").val(), 'graylog', "input should be graylog");

    var e = $.Event("keyup");
    e.which = 13;

    $(".shell-command-input").trigger(e);
    strictEqual($(".shell-command-input").val(), "", "input should be emptied after pressing enter");
  });

  test("empty input does not create new lines in shell", 1, function() {
    this.elem.shell();
    this.enterText("");
    this.enterText("");

    strictEqual($(".old-input").length, 0, "2 .old-input elements");
  });

  test("arrow key up should give the last command", 2, function() {
    this.elem.shell();
    $(".shell-command-input").val('graylog');
    strictEqual($(".shell-command-input").val(), "graylog", "input should be graylog");

    var e = $.Event("keyup");
    e.which = 13;
    $(".shell-command-input").trigger(e);

    e = $.Event("keyup");
    e.which = 38;
    $(".shell-command-input").trigger(e);

    strictEqual($(".shell-command-input").val(), "graylog", "input should be graylog then");
  });

  test("a loading div is shown after sending input", 1, function() {
    this.elem.shell();
    this.enterText("graylog");

    strictEqual($(".shell-loading").length, 1, "a loading status should be shown then");
  });

  test("inputfields are being disabled", 1, function() {
    this.elem.shell();
    this.enterText("graylog");

    strictEqual($(".shell-command-input").attr("disabled"), true, "the inputfield gets disabled");
  });

  test("input 'clear' clears the shell", 2, function() {
    this.elem.shell();
    this.enterText("graylog");
    this.enterText("test");
    this.enterText("clear");

    strictEqual($(".old-input").length, 0, "no .old-input elements");
    strictEqual($(".shell-wait").length, 0, "no .shell-wait elements");
  });

  test("input shows up as 'old-input'", 2, function() {
    this.elem.shell();
    this.enterText("graylog");
    this.enterText("test");

    strictEqual($(".old-input").length, 2, "2 .old-input elements");
    strictEqual($(".old-input").last().text(), "test", ".old input has value test");
  });



}(jQuery));
