#!/usr/bin/env node

   var ws  = require('./min.wepsim_node.js') ;
   var fs  = require('fs') ;

   //
   // Usage
   //

   if (2 == process.argv.length)
   {
       console.log('') ;
       console.log('WepSIM-lite 0.5') ;
       console.log('+ Simplified version of the wepsim simulator for the Linux command line.') ;
       console.log('') ;
       console.log('Usage:') ;
       console.log('+ ./wepsim_node.sh check <microcode file> <assembly file> <checklist file>') ;
       console.log('') ;
       console.log('Examples:') ;
       console.log('./wepsim_node.sh check ./examples/microcode_3.txt ./examples/code_3.txt ./examples/checklist_3.txt') ;
       console.log('./wepsim_node.sh check ./examples/microcode_3.txt ./examples/code_3.txt ./examples/checklist_2.txt') ;
       console.log('') ;

       return true ;
   }


   //
   // action == check
   //

   if ("CHECK" == process.argv[2].toUpperCase())
   {
       var data_microcode = fs.readFileSync(process.argv[3], 'utf8') ;
       var data_asmcode   = fs.readFileSync(process.argv[4], 'utf8') ;
       var data_okresult  = fs.readFileSync(process.argv[5], 'utf8') ;

       ws.wepsim_nodejs_init() ;
       var ret = ws.wepsim_nodejs_check(data_microcode, data_asmcode, data_okresult, 1000, 1024) ;
       if (false == ret.ok) 
       {
           console.log(ret.msg);
           return false ;
           // throw 'ERROR...' ;
       }

       return true ;
   }


   //
   // action == unknown
   //

   console.log("ERROR: wepsim_checker: unknown action");
   return false ;
   // throw 'ERROR...' ;

