#!/usr/bin/env node

   var ws  = require('./min.wepsim_node.js') ;
   var fs  = require('fs') ;

   // 1) arguments
   if (2 == process.argv.length)
   {
            console.log('') ;
            console.log('WepSIM-lite 0.3, simplified version of the wepsim simulator for the Linux command line.') ;
            console.log('') ;
            console.log('Arguments:') ;
	    console.log('1) microcode file path.') ;
	    console.log('2) assembly  file path.') ;
	    console.log('3) checklist file path.') ;
            console.log('') ;
            console.log('Example:') ;
	    console.log('./wepsim_node.sh ./examples/microcode_3.txt ./examples/code_3.txt ./examples/checklist_3.txt') ;
            console.log('') ;

	    return true ;
   }

   // 2) initialize information
   var data_microcode = fs.readFileSync(process.argv[2], 'utf8') ;
   var data_asmcode   = fs.readFileSync(process.argv[3], 'utf8') ;
   var data_okresult  = fs.readFileSync(process.argv[4], 'utf8') ;

   ws.wepsim_nodejs_init() ;

   // 3) check scheme
   var ret = ws.wepsim_nodejs_check(data_microcode, data_asmcode, data_okresult, 
                                    1000, 1024) ;
   if (false == ret.ok) 
   {
       console.log(ret.msg);
       return false ;
       // throw 'ERROR...' ;
   }

   return true ;

