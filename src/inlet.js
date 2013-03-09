var Inlet = (function() {
    function inlet(ed) {
      var editor = ed;
      var slider;
      var picker;
      
      var wrapper = editor.getWrapperElement();
      wrapper.addEventListener("mousedown", onClick);

      //make the slider
      var sliderDiv = document.createElement("div");
      sliderDiv.className = "inlet_slider";
      //some styles are necessary for behavior
      sliderDiv.style.visibility = "hidden";
      sliderDiv.style.position = "absolute";
      sliderDiv.style.top = 0;
      wrapper.parentNode.appendChild(sliderDiv);
      
      var slider = document.createElement("input");
      slider.className = "range";
      slider.setAttribute("type", "range");
      slider.addEventListener("change", onSlide);
      //slider.style.width = "inherit";
      sliderDiv.appendChild(slider);
      
      function onSlide(event) {
        var value = String(this.value);
        var cursor = editor.getCursor();
        //TODO: use custom token getting function with regex
        var token = editor.getTokenAt(cursor);
        //console.log("SLIDING", ui.value+"", token.start, token.end)
        var start = {"line":cursor.line, "ch":token.start};
        var end = {"line":cursor.line, "ch":token.end};
        editor.replaceRange(value, start, end);
      }

      //make the colorpicker
      picker = new Color.Picker({
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
        var token = editor.getTokenAt(cursor);
        cursorOffset = editor.cursorCoords(true, "page");
        if(token.className === "number") {
          slider.value = 0;
          //parse the number out
          var value = parseFloat(token.string);
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
          var sliderWidth = sliderStyle.width;
          if(sliderWidth.length > 2) {
            sliderWidth = parseFloat(sliderWidth.slice(0, sliderWidth.length-2));
          } else {
            sliderWidth = parseFloat(sliderWidth);
          }
          var sliderLeft = cursorOffset.left - sliderWidth/2;

          //slider.offset({top: sliderTop - 10, left: sliderLeft});
          sliderDiv.style.top = sliderTop - 10 + "px";
          sliderDiv.style.left = sliderLeft + "px";

          sliderDiv.style.visibility = "visible";
          //slider.css('visibility', 'visible');
          picker.element.style.display = "none";

        //else if #use regex to check for color
        } else {
          var match = token.string.match(/#+(([a-fA-F0-9]){3}){1,2}/);
          if(match) {
              //turn on color picker
              var color = match[0];
              color = color.slice(1, color.length);
              picker.update(color);

              //TODO: make positioning of color picker configurable
              var top = cursorOffset.top - 210 + "px";
              var left = cursorOffset.left - 75 + "px";
              var ColorPicker = document.getElementById("ColorPicker");
              ColorPicker.style.position = "absolute";
              ColorPicker.style.top = top;
              ColorPicker.style.left = left;
              picker.toggle(true);
          } else {
              picker.toggle(false);
          }
          
          sliderDiv.style.visibility = "hidden";
        }
      }
    }
    return inlet;

})();
