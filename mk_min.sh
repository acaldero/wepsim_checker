#!/bin/sh
set -x

# 
#  external
# 
cat external/bootstrap.min.js \
    external/bootstrap-notify.min.js \
    external/masonry.pkgd.min.js \
    external/knockout-3.4.2.js \
    external/jquery.knob.min.js \
    external/bootbox.min.js \
    external/spectrum.min.js \
    external/timbre.min.js \
    external/split.min.js \
    external/codemirror.js \
    external/codemirror.javascript.js \
    external/codemirror.gas.js \
    external/codemirror.keymap/sublime.js \
    external/codemirror.keymap/emacs.js \
    external/codemirror.keymap/vim.js \
    external/codemirror.edit/matchbrackets.js \
    external/codemirror.fold/foldcode.js \
    external/codemirror.fold/foldgutter.js \
    external/codemirror.fold/brace-fold.js \
    external/codemirror.fold/xml-fold.js \
    external/codemirror.fold/comment-fold.js \
    external/codemirror.fold/indent-fold.js \
    external/codemirror.fold/markdown-fold.js \
    external/codemirror.show-hint/codemirror.show-hint.js \
    external/codemirror.runmode/colorize.js \
    external/vis.min.js \
    external/async.js \
    external/bootstrap-select.min.js \
    external/bootstrap-tokenfield.js \
    external/speech-input.js \
    external/annyang.min.js \
    external/speechkitt.min.js \
    external/dropify.min.js \
    external/propeller/propeller.min.js > external/external.min.js

cat external/bootstrap.min.css \
    external/bootstrap-theme.min.css \
    external/spectrum.min.css \
    external/codemirror.css \
    external/codemirror.theme/blackboard.css \
    external/codemirror.fold/foldgutter.css \
    external/codemirror.show-hint/codemirror.show-hint.css \
    external/vis-network.min.css \
    external/bootstrap-select.min.css \
    external/bootstrap-tokenfield.css \
    external/speech-input.css \
    external/speechkitt.css \
    external/dropify.min.css \
    external/propeller/propeller.min.css \
    external/propeller/propeller-fab-button.css \
    external/propeller/propeller-fab.css > external/external.min.css

# 
#  wepsim_tester engine
# 
cat wepsim_tester.js > sim_tester_all.js
/usr/bin/yui-compressor -o min.sim_tester.js sim_tester_all.js
rm -fr sim_tester_all.js

