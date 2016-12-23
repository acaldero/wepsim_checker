#!/bin/sh
set -x

# 
#  wepsim_tester engine
# 
cat wepsim_check.js \
    wepsim_tester.js > sim_tester_all.js
/usr/bin/yui-compressor -o min.sim_tester.js sim_tester_all.js
rm -fr sim_tester_all.js

