/*
 *  Copyright 2015-2018 Felix Garcia Carballeira, Alejandro Calderon Mateos, Javier Prieto Cepeda, Saul Alonso Monsalve
 *
 *  This file is part of WepSIM tester.
 *
 *  WepSIM is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Lesser General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  WepSIM is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Lesser General Public License for more details.
 *
 *  You should have received a copy of the GNU Lesser General Public License
 *  along with WepSIM.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

    /**
     * WepSIM nodejs
     */

    function wepsim_nodejs_check ( str_firmware, str_assembly, str_resultok, 
                                   max_instructions, max_cycles )
    {
        var ret1 = {} ;
            ret1.ok = true ;
            ret1.msg = "" ;

	// 1) initialize ws
        wepsim_core_reset() ;

	// 2) load firmware
        var ret = wepsim_core_compile_firmware(str_firmware) ;
	if (false == ret.ok) 
	{
            ret1.msg = "ERROR: Firmware: " + ret.msg + ".\n" ;
            ret1.ok = false ;
	    return ret1 ;
	}

	// 3) load assembly
        ret = wepsim_core_compile_assembly(str_assembly) ;
	if (false == ret.ok) 
        {
            ret1.msg = "ERROR: Assembly: " + ret.msg + ".\n" ;
            ret1.ok = false ;
	    return ret1 ;
	}

	// 4) execute firmware-assembly
	ret = wepsim_core_execute_asm_and_firmware(max_instructions, max_cycles) ;
	if (false == ret.ok) 
	{
            ret1.msg = "ERROR: Execution: " + ret.msg + ".\n" ;
            ret1.ok = false ;
	    return ret1 ;
	}

	// 5) compare with expected results
        var ret = wepsim_core_show_checkresults(str_resultok, false) ;
	if (false == ret.ok)
	{
            ret1.msg = "ERROR: Execution: different results: " + ret.msg + "\n" ;
            ret1.ok = false ;
	    return ret1 ;
        }

	return ret1 ;
    }

    function wepsim_nodejs_run ( str_firmware, str_assembly, max_instructions, max_cycles )
    {
        var ret1 = {} ;
            ret1.ok = true ;
            ret1.msg = "" ;

	// 1) initialize ws
        wepsim_core_reset() ;

	// 2) load firmware
        var ret = wepsim_core_compile_firmware(str_firmware) ;
	if (false == ret.ok) 
	{
            ret1.msg = "ERROR: Firmware: " + ret.msg + ".\n" ;
            ret1.ok = false ;
	    return ret1 ;
	}

	// 3) load assembly
        ret = wepsim_core_compile_assembly(str_assembly) ;
	if (false == ret.ok) 
        {
            ret1.msg = "ERROR: Assembly: " + ret.msg + ".\n" ;
            ret1.ok = false ;
	    return ret1 ;
	}

	// 4) execute firmware-assembly
	ret = wepsim_core_execute_asm_and_firmware(max_instructions, max_cycles) ;
	if (false == ret.ok) 
	{
            ret1.msg = "ERROR: Execution: " + ret.msg + ".\n" ;
            ret1.ok = false ;
	    return ret1 ;
	}

	// 5) show the current state
        ret = wepsim_core_show_currentstate() ;

        ret1.msg = "OK: Execution: " + ret.msg ;
        ret1.ok = true ;
	return ret1 ;
    }


    /**
     * Export API
     */

    module.exports.wepsim_nodejs_init  = wepsim_core_init ;
    module.exports.wepsim_nodejs_check = wepsim_nodejs_check ;
    module.exports.wepsim_nodejs_run   = wepsim_nodejs_run ;

