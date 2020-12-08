$(function() {
    
    var setInvisible = function(elem) {
      elem.css('visibility', 'hidden');
    };
    var setVisible = function(elem) {
      elem.css('visibility', 'visible');
    };

    var elem = $("#elem");
    var items = elem.children();

    // Inserting Buttons
    elem.prepend('<div id="right-button" style="visibility: hidden;"><a href="#"><</a></div>');
    elem.append('  <div id="left-button"><a href="#">></a></div>');

    // Inserting Inner
    items.wrapAll('<div id="inner" />');

    // Inserting Outer
    debugger;
    elem.find('#inner').wrap('<div id="outer"/>');

    var outer = $('#outer');

    var updateUI = function() {
      var maxWidth = outer.outerWidth(true);
      var actualWidth = 0;
      $.each($('#inner >'), function(i, item) {
        actualWidth += $(item).outerWidth(true);
      });

      if (actualWidth <= maxWidth) {
        setVisible($('#left-button'));
      }
    };
    updateUI();



    $('#right-button').click(function() {
      var leftPos = outer.scrollLeft();
      outer.animate({
        scrollLeft: leftPos - 100
      }, 800, function() {
        debugger;
        if ($('#outer').scrollLeft() <= 0) {
          setInvisible($('#right-button'));
        }
      });
    });

    $('#left-button').click(function() {
      setVisible($('#right-button'));
      var leftPos = outer.scrollLeft();
      outer.animate({
        scrollLeft: leftPos + 100
      }, 800);
    });

    $(window).resize(function() {
      updateUI();
    });
  });