# See the README for installation instructions.

NODE_PATH ?= ./node_modules
JS_COMPILER = $(NODE_PATH)/uglify-js/bin/uglifyjs
JS_BEAUTIFIER = $(NODE_PATH)/uglify-js/bin/uglifyjs -b -i 2 -nm -ns
LESS_COMPILER = $(NODE_PATH)/less/bin/lessc
LOCALE ?= en_US

all: \
	inlet.js \
	inlet.min.js \
	less

# Modify this rule to build your own custom release.

.INTERMEDIATE inlet.js: \
	src/Color.Picker.Classic.js \
	src/Color.Space.js \
	src/inlet.js 
	
%.min.js: %.js Makefile
	@rm -f $@
	$(JS_COMPILER) < $< > $@

inlet.js: Makefile
	@rm -f $@
	cat $(filter %.js,$^) | $(JS_BEAUTIFIER) > $@
	@chmod a-w $@

less: Makefile
	$(LESS_COMPILER)  src/style.less > inlet.css 


clean:
	rm -f inlet*.js
