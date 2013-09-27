Inlet = (function() {
  function inlet(ed, options) {
    var editor = ed;
    var slider;
    var picker;

    if(!options) options = {};
    if(!options.picker) options.picker = {};
    if(!options.slider) options.slider = {};
    var container = options.container || document.body;

    // TODO: document/consider renaming
    var topOffset = options.picker.topOffset || 210;
    var bottomOffset = options.picker.bottomOffset || 16;
    var topBoundary = options.picker.topBoundary || 250;
    var leftOffset = options.picker.leftOffset || 75;
    var y_offset = options.slider.yOffset || 15;

    var wrapper = editor.getWrapperElement();
    wrapper.addEventListener("mousedown", onClick);
    //wrapper.addEventListener("keydown", onKeyDown);
    editor.setOption("onKeyEvent", onKeyDown);

    //make the slider
    var sliderDiv = document.createElement("div");
    sliderDiv.className = "inlet_slider";
    //some styles are necessary for behavior
    sliderDiv.style.visibility = "hidden";
    sliderDiv.style.position = "absolute";
    sliderDiv.style.top = 0;
    container.appendChild(sliderDiv);
    //TODO: figure out how to capture key events when slider has focus
    //sliderDiv.addEventListener("keydown", onKeyDown);

    var slider = document.createElement("input");
    slider.className = "range";
    slider.setAttribute("type", "range");
    slider.addEventListener("change", onSlide);
    slider.addEventListener("mouseup", onSlideMouseUp);
    //slider.style.width = "inherit";
    sliderDiv.appendChild(slider);


    function onSlide(event) {
      var value = String(slider.value);
      var cursor = editor.getCursor(true);
      var number = getNumber(cursor);
      if(!number) return;
      var start = {"line":cursor.line, "ch":number.start};
      var end = {"line":cursor.line, "ch":number.end};
      editor.replaceRange(value, start, end);
    }

    function onSlideMouseUp(event) {
      slider.value = 0;
      var cursor = editor.getCursor(true);
      var number = getNumber(cursor);
      if(!number) return;
      var value = parseFloat(number.string);
      var sliderRange = getSliderRange(value);
      slider.setAttribute("value", value);
      slider.setAttribute("step", sliderRange.step);
      slider.setAttribute("min", sliderRange.min);
      slider.setAttribute("max", sliderRange.max);
      slider.value = value;
    }

    var LEFT = 37;
    var UP = 38;
    var RIGHT = 39;
    var DOWN = 40;
    function onKeyDown() {
      if(arguments.length == 1) {
        event = arguments[0]
      } else {
        event = arguments[1];
      }
      //if left or right arrows, we can step through the slider
      //disable the slider + picker on key event
      if(event.keyCode == LEFT || event.keyCode == DOWN) {
        //LEFT
        if(sliderDiv.style.visibility === "visible") {
          slider.stepDown(1);
          onSlide();
          return true;
        } else if(event.altKey) {
          onClick();
        } else {
          picker.element.style.display = "none";
        }
      } else if(event.keyCode == RIGHT || event.keyCode == UP) {
        //RIGHT
        if(sliderDiv.style.visibility === "visible") {
          slider.stepUp(1);
          onSlide();
          return true;
        } else if(event.altKey) {
          onClick();
        } else {
          picker.element.style.display = "none";
        }
      } else {
        sliderDiv.style.visibility = "hidden";
        picker.element.style.display = "none";
      }
    }

    //make the colorpicker
    picker = new Color.Picker({
      container: container,
      color: "#643263",// accepts rgba(), or #hex
      display: false,
      size: 150,
      callback: function(rgba, state, type) {
        var newcolor = Color.Space(rgba, "RGB>STRING");
        //set the cursor to desired location
        var cursor = editor.getCursor();

        var hex = getHex(cursor);
        if(!hex) return;
        var start = {"line":cursor.line, "ch":hex.start};
        var end = {"line":cursor.line, "ch":hex.end};
        editor.replaceRange("#" + newcolor.toUpperCase(), start, end);

      }
    });

    //Handle clicks
    function onClick(ev) {
      var cursor = editor.getCursor(true);
      var token = editor.getTokenAt(cursor);
      cursorOffset = editor.cursorCoords(true, "page");
      var number = getNumber(cursor);

      var hexMatch = getHex(cursor);
      if(hexMatch) {
        //turn on color picker
        var color = hexMatch.string;
        color = color.slice(1, color.length);
        picker.update(color);

        // setup colorpicker position
        var top = (cursorOffset.top - topOffset) + "px";
        if (cursorOffset.top < topBoundary) {top = (cursorOffset.top + bottomOffset) + "px";}
        var left = cursorOffset.left - leftOffset + "px";
        var ColorPicker = picker.element;
        ColorPicker.style.position = "absolute";
        ColorPicker.style.top = top;
        ColorPicker.style.left = left;

        picker.toggle(true);
        sliderDiv.style.visibility = "hidden";
      } else if(number) {
        picker.toggle(false);
        slider.value = 0;
        var value = parseFloat(number.string);
        var sliderRange = getSliderRange(value);
        slider.setAttribute("value", value);
        slider.setAttribute("step", sliderRange.step);
        slider.setAttribute("min", sliderRange.min);
        slider.setAttribute("max", sliderRange.max);
        slider.value = value;

        //setup slider position
        // position slider centered above the cursor
                
        var sliderTop = cursorOffset.top - y_offset;
        var sliderStyle = window.getComputedStyle(sliderDiv);
        var sliderWidth = getPixels(sliderStyle.width);
        
        var sliderLeft = cursorOffset.left - sliderWidth/2;

        //slider.offset({top: sliderTop - 10, left: sliderLeft});
        sliderDiv.style.top = sliderTop - 10 + "px";
        sliderDiv.style.left = sliderLeft + "px";

        sliderDiv.style.visibility = "visible";
        picker.element.style.display = "none";
      } else {
        sliderDiv.style.visibility = "hidden";
        picker.element.style.display = "none";
      }
    }
    
    function getSliderRange(value) {
      //this could be substituted out for other heuristics
      var range, step, sliderMin, sliderMax;
      //these values were chosen by Gabriel Florit for his livecoding project, they work really well!
      if (value === 0) { 
        range = [-100, 100];
      } else {
        range = [-value * 3, value * 5];
      }
      if(range[0] < range[1]) {
        min = range[0];
        max = range[1];
      } else {
        min = range[1];
        max = range[0];
      }
      // slider range needs to be evenly divisible by the step
      if ((max - min) > 20) {
        step = 1;
      } else {
        step = (max - min) / 200;
      }
      return {
        min: min,
        max: max,
        step: step
      }
    }
    
    function getHex(cursor) {
      //we do a regex over a whole line, and return the number which the cursor touches
      var line = editor.getLine(cursor.line);
      //var re = /#+(([a-fA-F0-9]){3}){1,2}/;
      var re = /#[a-fA-F0-9]{3,6}/g;
      var match = re.exec(line);
      while(match) {
        var val = match[0];
        var len = val.length;
        var start = match.index;
        var end = match.index + len;
        if(cursor.ch >= start && cursor.ch <= end) {
          match = null;
          return {
            start: start,
            end: end,
            string: val
          };
        }
        match = re.exec(line);
      }
      return;
    }
    
    function getNumber(cursor) {
      //we do a regex over a whole line, and return the number which the cursor touches
      var line = editor.getLine(cursor.line);
      //matches any number, even scientific notation.
      var re = /[-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g
      var match = re.exec(line);
      while(match) {
        var val = match[0];
        var len = val.length;
        var start = match.index;
        var end = match.index + len;
        if(cursor.ch >= start && cursor.ch <= end) {
          match = null;
          return {
            start: start,
            end: end,
            string: val
          };
        }
        match = re.exec(line);
      }
      return;
    }

  }
    
  function getPixels(style) {
    var pix = 0;
    if(style.length > 2 ) {
      pix = parseFloat(style.slice(0, style.length-2));
    }
    if(!pix) pix = 0;
    return pix;
  } 
  function getOffset( el ) {
    var _x = 0;
    var _y = 0;
    while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
        _x += el.offsetLeft - el.scrollLeft;
        _y += el.offsetTop - el.scrollTop;
        el = el.offsetParent;
    }
    return { top: _y, left: _x };
}
  
  

  return inlet;

})();
