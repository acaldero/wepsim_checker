#!/bin/sh
#set -x

test_example_ok() {
  node wepsim_node.sh check ./examples/microcode_3.txt ./examples/code_3.txt ./examples/checklist_3.txt > kk1
  nlines=$(grep ERROR kk1 | wc -l)
cat kk1
  assertNotSame "In the correct example :-("   '0' "${nlines}"
}

test_example_ko() {
  node wepsim_node.sh check ./examples/microcode_3.txt ./examples/code_3.txt ./examples/checklist_2.txt > kk1
  nlines=$(grep OK kk1 | wc -l)
cat kk1
echo $nlines
  assertNotSame "In the incorrect example :-(" '0' "${nlines}"
}

. shunit2-2.0.3/src/shell/shunit2

