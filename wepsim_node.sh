#!/usr/bin/env node


        var ws  = require('./min.wepsim_node.js') ;
        var fs  = require('fs') ;

	// 1) arguments
	if (2 == process.argv.length)
	{
            console.log('') ;
            console.log('WepSIM-lite 0.0.2, simplified version of the wepsim simulator for the Linux command line.') ;
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

        var data1 = fs.readFileSync(process.argv[2], 'utf8') ;
        var data2 = fs.readFileSync(process.argv[3], 'utf8') ;
        var data3 = fs.readFileSync(process.argv[4], 'utf8') ;

	// 2) initialize ws
        ws.wepsim_nodejs_init() ;
        ws.wepsim_nodejs_reset() ;

	// 3) load firmware
        var ret = ws.wepsim_nodejs_compile_firmware(data1) ;
	if (false == ret.ok) 
	{
            console.log("Firmware ERROR: " + ret.msg + ".\n") ;
	    return false ;
	    // throw 'ERROR on firmware.\n' ;
	}

	// 4) load assembly
        ret = ws.wepsim_nodejs_compile_assembly(data2) ;
	if (false == ret.ok) 
        {
            console.log("Assembly ERROR: " + ret.msg + ".\n");
	    return false ;
	    // throw 'ERROR on assembly.\n' ;
	}

	// 5) execute firmware-assembly
	var ret = ws.wepsim_nodejs_execute(1000, 1024) ; // max-instruction, max-cycles
	if (true == ret.error) 
	{
            console.log("ERROR: cannot execute the assembly and firmware.\n");
	    return false ;
	    // throw 'ERROR on execution.\n' ;
	}

	// 6) compare with expected results
        var result1 = ws.wepsim_nodejs_check_results(data3) ;
	var report1 = ws.wepsim_nodejs_show_checkresults(result1, "text", true) ;
	if (result1.errors != 0) 
	{
            console.log("\nERROR: different results:") ;
            console.log(report1 + "\n") ;
	    return false ;
	    // throw 'ERROR: mismatch in expected results.\n' ;
        }

	return true ;

