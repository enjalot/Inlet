Inlet = (function() {
  function inlet(ed, options) {
    var editor = ed;
    var slider;
    var picker;
    
    if(!options) options = {};
    var container = options.container || document.body;
    
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
    //slider.style.width = "inherit";
    sliderDiv.appendChild(slider);
    
    //we keep track where the last slide cursor was set;
    var slideCursor;
    
    function onSlide(event) {
      var value = String(slider.value);
      //var token = editor.getTokenAt(cursor);
      var cursor = slideCursor;
      var number = getNumber(cursor);
      //console.log("SLIDING", ui.value+"", token.start, token.end)
      var start = {"line":cursor.line, "ch":number.start};
      var end = {"line":cursor.line, "ch":number.end};
      editor.replaceRange(value, start, end);
    }
    
    function onKeyDown() {
      if(arguments.length == 1) { 
        event = arguments[0]
      } else {
        event = arguments[1];
      }
      //if left or right arrows, we can step through the slider
      //disable the slider + picker on key event
      if(event.keyCode == 37) {
        //LEFT
        if(sliderDiv.style.visibility === "visible") {
          slider.stepDown(1);
          onSlide();
          return true;
        } else {
          picker.element.style.display = "none";
        }
      } else if(event.keyCode == 39) {
        //RIGHT
        if(sliderDiv.style.visibility === "visible") {
          slider.stepUp(1);
          onSlide();
          return true;
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
        var token = editor.getTokenAt(cursor);

        var start = {"line":cursor.line, "ch":token.start};
        var end = {"line":cursor.line, "ch":token.end};
        start.ch = start.ch + token.string.indexOf("#");

        //we already know this will match, need to know how long our original token string was
        //if its #fff we don't want to overwrite too far with #ffffff
        var match = token.string.match(/#+(([a-fA-F0-9]){3}){1,2}/)[0];
        end.ch = start.ch + match.length;
        //editor.replaceRange('"#' + newcolor.toUpperCase() + '"', start, end);
        editor.replaceRange('#' + newcolor.toUpperCase(), start, end);
      }
    });

    //Handle clicks
    function onClick(ev) {
      var cursor = editor.getCursor(true);
      slideCursor = cursor;
      var token = editor.getTokenAt(cursor);
      cursorOffset = editor.cursorCoords(true, "page");
      var number = getNumber(cursor);

      //if(token.className === "number") {
      var hexMatch = token.string.match(/#+(([a-fA-F0-9]){3}){1,2}/);
      if(hexMatch) {
        //turn on color picker
        var color = hexMatch[0];
        color = color.slice(1, color.length);
        picker.update(color);

        //TODO: make positioning of color picker configurable
        var top = cursorOffset.top - 210 + "px";
        var left = cursorOffset.left - 75 + "px";
        var ColorPicker = picker.element;
        console.log("PICKER", picker);
        ColorPicker.style.position = "absolute";
        ColorPicker.style.top = top;
        ColorPicker.style.left = left;
        picker.toggle(true);
        sliderDiv.style.visibility = "hidden";
      } else if(number) {
        picker.toggle(false);
        slider.value = 0;
        //parse the number out
        var value = parseFloat(number.string);
        var sliderRange;
        // this comes from water project:
        // set the slider params based on the token's numeric value
        if (value === 0) { 
            sliderRange = [-100, 100];
        } else {
            sliderRange = [-value * 3, value * 5];
        }

        if(sliderRange[0] < sliderRange[1]) {
          sliderMin = sliderRange[0];
          sliderMax = sliderRange[1];
        } else {
          sliderMin = sliderRange[1];
          sliderMax = sliderRange[0];
        }
        slider.setAttribute("min", sliderMin);
        slider.setAttribute("max", sliderMax);

        // slider range needs to be evenly divisible by the step
        if ((sliderMax - sliderMin) > 20) {
          slider.setAttribute("step", 1);
        } else {
          slider.setAttribute("step", (sliderMax - sliderMin) / 200);
        }
        slider.setAttribute("value", value);
        slider.value = value;

        //setup slider position
        // position slider centered above the cursor
        //TODO: take in y_offset as a parameter
        var y_offset = 15;
                
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
        slideCursor = null;
        sliderDiv.style.visibility = "hidden";
        picker.element.style.display = "none";
      }
    }
    
    function getNumber(cursor) {
      //we do a regex over a whole line, and return the number which the cursor touches
      var line = editor.getLine(cursor.line);
      //matches any number, even scientific notation.
      var re = /[+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g
      var match = re.exec(line);
      //console.log("match!", match, match.index);
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
