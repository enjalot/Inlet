# See the README for installation instructions.

NODE_PATH ?= ./node_modules
JS_COMPILER = $(NODE_PATH)/uglify-js/bin/uglifyjs
JS_BEAUTIFIER = $(NODE_PATH)/uglify-js/bin/uglifyjs -b -i 2 -nm -ns
LOCALE ?= en_US

all: \
	inlet.js \
	inlet.min.js \

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


clean:
	rm -f inlet*.js
