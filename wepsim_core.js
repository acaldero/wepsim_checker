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
     * Initialize WepSIM core.
     */
    function wepsim_core_init ( )
    {
	var ret = {} ;
	    ret.msg     = "" ;
	    ret.ok      = true ;

        reset_cfg() ;
        stop_drawing() ;

        check_behavior();
        compile_behaviors() ;
        firedep_to_fireorder(jit_fire_dep) ;
        compute_references() ;

        return ret ;
    }

    /**
     * Reset the WepSIM simulation.
     */
    function wepsim_core_reset ( )
    {
	var ret = {} ;
	    ret.msg     = "" ;
	    ret.ok      = true ;

	var SIMWARE = get_simware() ;
        compute_general_behavior("RESET") ;

        if ((typeof segments['.ktext'] != "undefined") && (SIMWARE.labels2.kmain)){
                    set_value(sim_states.REG_PC, parseInt(SIMWARE.labels2.kmain));
	}
        else if ((typeof segments['.text'] != "undefined") && (SIMWARE.labels2.main)){
                    set_value(sim_states.REG_PC, parseInt(SIMWARE.labels2.main));
	}

	if ( (typeof segments['.stack'] != "undefined") &&
             (typeof sim_states.BR[FIRMWARE.stackRegister] != "undefined") )
	{
		set_value(sim_states.BR[FIRMWARE.stackRegister], parseInt(segments['.stack'].begin));
	}

	var mode = get_cfg('ws_mode');
	if ('webmips' != mode) {
            compute_general_behavior("CLOCK") ;
	}

        set_screen_content("") ;

        return ret ;
    }

    /**
     * Compile Firmware.
     * @param {string} textToMCompile - The firmware to be compile and loaded into memory
     */
    function wepsim_core_compile_firmware ( textToMCompile )
    {
	var ret = {} ;
	    ret.msg     = "" ;
	    ret.ok      = true ;

	var preSM = loadFirmware(textToMCompile) ;
	ret.simware = preSM ;
	if (preSM.error != null)
        {
            ret.msg     = preSM.error ;
            ret.ok      = false ;
            return ret ;
        }

        update_memories(preSM);
	wepsim_core_reset() ;
        return ret ;
    }

    /**
     * Compile Assembly.
     * @param {string} textToCompile - The assembly to be compile and loaded into memory
     */
    function wepsim_core_compile_assembly ( textToCompile )
    {
	var ret = {} ;
	    ret.msg = "" ;
	    ret.ok  = true ;

        // get SIMWARE.firmware
        var SIMWARE = get_simware() ;
	if (SIMWARE.firmware.length == 0)
        {
            ret.msg = 'Empty microcode, please load the microcode first.' ;
            ret.ok  = false;
            return ret;
	}

        // compile Assembly and show message
        var SIMWAREaddon = simlang_compile(textToCompile, SIMWARE);
	ret.simware = SIMWAREaddon ;
        if (SIMWAREaddon.error != null)
        {
            ret.msg = SIMWAREaddon.error ;
            ret.ok  = false;
            return ret;
        }

        // update memory and segments
        set_simware(SIMWAREaddon) ;
	update_memories(SIMWARE) ;
	wepsim_core_reset() ;

        return ret ;
    }

    /**
     * Execute the assembly previously compiled and loaded.
     * @param {integer} ins_limit - The limit of instructions to be executed
     * @param {integer} clk_limit - The limit of clock cycles per instruction
     */
    function wepsim_core_execute_asm_and_firmware ( ins_limit, clk_limit )
    {
	var ret = {} ;
	    ret.ok  = true ;
	    ret.msg = "" ;

        // execute firmware-assembly
	var reg_pc        = get_value(sim_states.REG_PC) ;
	var reg_pc_before = get_value(sim_states.REG_PC) - 4 ;

	var code_begin  = 0 ;
	if ( (typeof segments['.text'] != "undefined") && (typeof segments['.text'].begin != "undefined") )
	      code_begin = parseInt(segments['.text'].begin) ;
	var code_end    = 0 ;
	if ( (typeof segments['.text'] != "undefined") && (typeof segments['.text'].end   != "undefined") )
	      code_end = parseInt(segments['.text'].end) ;

	var kcode_begin = 0 ;
	if ( (typeof segments['.ktext'] != "undefined") && (typeof segments['.ktext'].begin != "undefined") )
	      kcode_begin = parseInt(segments['.ktext'].begin) ;
	var kcode_end   = 0 ;
	if ( (typeof segments['.ktext'] != "undefined") && (typeof segments['.ktext'].end   != "undefined") )
	      kcode_end = parseInt(segments['.ktext'].end) ;

	var ins_executed = 0 ; 
	while (
                     (reg_pc != reg_pc_before)  &&
                  ( ((reg_pc <  code_end) && (reg_pc >=  code_begin)) ||
                    ((reg_pc < kcode_end) && (reg_pc >= kcode_begin)) )
              )
	{
	       ret = execute_microprogram(clk_limit) ;
               if (false == ret.ok) {
		   return ret ;
	       }

	       ins_executed++ ; 
               if (ins_executed > ins_limit) 
	       {
	           ret.ok  = false ;
	           ret.msg = "more than " + ins_limit + " instructions executed before application ends.";
		   return ret ;
	       }

	       reg_pc_before = reg_pc ;
	       reg_pc = get_value(sim_states.REG_PC) ;
	}

        return ret ;
    }

    /**
     * Check that the current state meets the specifications, and return the differences.
     * @param {object} checklist_ok - Correct state specifications (text)
     * @param {boolean} newones_too - True if new elements are not ignored
     */
    function wepsim_core_show_checkresults ( checklist_ok, newones_too )
    {
	var ret = {} ;
	    ret.msg = "" ;
	    ret.ok  = true ;

	var data3_bin   = wepsim_checklist2state(checklist_ok) ;
	var obj_current = wepsim_current2state();
	var obj_result  = wepsim_check_results(data3_bin, obj_current, newones_too ) ;

        ret.msg  = wepsim_checkreport2txt(obj_result.result) ;
        ret.html = wepsim_checkreport2html(obj_result.result, true) ;
        ret.ok   = (0 == obj_result.errors) ;
        return ret ;
    }

    /**
     * Check that the current state meets the specifications, and return the differences.
     * @param {object} checklist_ok - Correct state specifications (bin)
     * @param {boolean} newones_too - True if new elements are not ignored
     */
    function wepsim_core_show_checkresults_bin ( checklist_ok, newones_too )
    {
	var ret = {} ;
	    ret.msg = "" ;
	    ret.ok  = true ;

	var obj_current = wepsim_current2state();
	var obj_result  = wepsim_check_results(checklist_ok, obj_current, newones_too) ;

        ret.msg  = wepsim_checkreport2txt(obj_result.result) ;
        ret.html = wepsim_checkreport2html(obj_result.result, true) ;
        ret.ok   = (0 == obj_result.errors) ;
        return ret ;
    }

    /**
     * Show the current state.
     */
    function wepsim_core_show_currentstate ( )
    {
	var ret = {} ;
	    ret.msg = "" ;
	    ret.ok  = true ;

        var state_obj = wepsim_current2state() ;
              ret.msg = wepsim_state2checklist(state_obj) ;

        return ret ;
    }

