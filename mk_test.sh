#!/bin/sh
#set -x

test_example_ok() {
  node wepsim_node.sh check ./examples/microcode_3.txt ./examples/code_3.txt ./examples/checklist_3.txt > /tmp/k1
  nlines=$(grep OK /tmp/k1 | wc -l)
  assertNotEquals "Failure in the correct example :-(" '1' "${nlines}"
}

test_example_ko() {
  node wepsim_node.sh check ./examples/microcode_3.txt ./examples/code_3.txt ./examples/checklist_2.txt > /tmp/k1
  nlines=$(grep ERROR /tmp/k1 | wc -l)
  assertNotEquals "Failure in the incorrect example :-(" '1' "${nlines}"
}

. ./shunit2-2.1.6/src/shunit2

