/*      
 *  Copyright 2015-2017 Felix Garcia Carballeira, Alejandro Calderon Mateos, Javier Prieto Cepeda, Saul Alonso Monsalve
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


    //
    //  WepSIM checker API
    //

    function wt_dataModel ()
    {
        var self = this;

	self.asm_test  = ko.observable(''),
	self.checklist = ko.observable(''),

        self.mfiles    = ko.observableArray([]),
        self.addFile   = function(a,b,c,d,e,f,g,h,i,j,k) 
                         {
                            this.mfiles.push({ name:ko.observable(a),
                                               LF:ko.observable(b),
                                               RL:ko.observable(c),
                                               BF:ko.observable(d),
                                               RUC:ko.observable(e),
                                               EF:ko.observable(f),
                                               RE:ko.observable(g),
                                               XF:ko.observable(h),
                                               RX:ko.observable(i),
                                               CF:ko.observable(j),
                                               RC:ko.observable(k) }) ; 

			    $("#pbar1").attr('aria-valuemax', this.mfiles().length);
                         }
    } ;

    function wt_load_files ( id_mc, id_asm, id_checklst )
    {
	    // microcode
	    mfiles = document.getElementById(id_mc).files;
	    var fileReader = new Array();
	    for (var i=0; i<mfiles.length; i++) {
	         load_firmware_from_files_aux(mfiles, fileReader, i);
	    }

	    // assembly 
	    if (document.getElementById(id_asm).files.length > 0) 
            {
	        var fileToLoad = document.getElementById(id_asm).files[0];
	        var fileReader = new FileReader();
	        fileReader.onload = function (fileLoadedEvent) {
				       model.asm_test(fileLoadedEvent.target.result);
				    };
	        fileReader.readAsText(fileToLoad, 'UTF-8');
            }

	    // checklist
	    if (document.getElementById(id_checklst).files.length > 0) 
            {
	        var fileToLoad = document.getElementById(id_checklst).files[0];
	        var fileReader = new FileReader();
	        fileReader.onload = function (fileLoadedEvent) {
				       model.checklist(fileLoadedEvent.target.result);
				    };
	        fileReader.readAsText(fileToLoad, 'UTF-8');
            }
    }

    function add_comment ( i, stage, msg )
    {
	model.mfiles()[i].CF(model.mfiles()[i].CF() + msg + "<br><br>");

	var old_msg = model.mfiles()[i].RC() ;
        if (old_msg == "\"NONE\"")
             model.mfiles()[i].RC(          "\"" + stage + "\" ");
	else model.mfiles()[i].RC(old_msg + "\"" + stage + "\" ");

	old_msg = model.mfiles()[i].RC().replace("\" \"",", ");
        model.mfiles()[i].RC(old_msg);
    }

    function execute_asm_and_firmware ( chk_limit )
    {
        // execute firmware-assembly
        init("","","","");
	reset() ;

	var reg_pc        = sim_states["REG_PC"].value ;
	var reg_pc_before = sim_states["REG_PC"].value - 4 ;

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

        var ret = true ;
	while (
                       (ret) &&
                       (reg_pc != reg_pc_before) && 
                     ( ((reg_pc <  code_end) && (reg_pc >=  code_begin)) || 
                       ((reg_pc < kcode_end) && (reg_pc >= kcode_begin)) )
                  )
	{
	       ret = execute_microprogram(chk_limit) ;

	       reg_pc_before = reg_pc ;
	       reg_pc = sim_states["REG_PC"].value ;
	}

        return ret ;
    }

    function execute_firmwares_and_asm_i ( SIMWARE, json_checklist, asm_text, i )
    {
        var neltos  = parseInt($("#pbar1").attr('aria-valuemax'));
        var percent = Math.trunc(100*i/neltos);

        // notify user
        $("#pbar1").attr('aria-valuenow', i);
        $("#pbar1").html(percent + '%');
        $("#pbar1").css("width", percent + "%");

        // check last element
        if (i >= neltos) 
            return;

	var ita = model.mfiles().length;
	if (ita == 0)
            return;

        // load firmware
	var ifirm = model.mfiles()[i].LF();
	var preSM = loadFirmware(ifirm);
        model.mfiles()[i].BF(JSON.stringify(preSM));
	if (preSM.error != null)
	{
                model.mfiles()[i].RUC("1");
                add_comment(i, "firmware error:"+preSM.error.split("(*)")[1], preSM.error);

                setTimeout(function() { execute_firmwares_and_asm_i(SIMWARE, json_checklist, asm_text, i+1); }, 120);
                return;
	}
        model.mfiles()[i].RUC("0");
        update_memories(preSM);

        // load assembly
	var SIMWAREaddon = simlang_compile(asm_text, SIMWARE);
        model.mfiles()[i].EF(JSON.stringify(SIMWAREaddon, null, 2));
        model.mfiles()[i].RE("0");
	if (SIMWAREaddon.error != null) 
	{
                model.mfiles()[i].RE("1");
                add_comment(i, "assembly error:"+SIMWAREaddon.error.split("(*)")[1], SIMWAREaddon.error);

                setTimeout(function() { execute_firmwares_and_asm_i(SIMWARE, json_checklist, asm_text, i+1); }, 120);
                return;
	}
	set_simware(SIMWAREaddon) ;
	update_memories(SIMWARE) ;

        // execute firmware-assembly
        var ret = execute_asm_and_firmware(2048) ;

        // compare with expected results
        var obj_current = wepsim_current2state();
        var obj_result  = wepsim_diff_results(json_checklist, obj_current) ;
        if (obj_result.errors != 0)
        {
            add_comment(i, 
                        "execution error:" + wepsim_checkreport2txt(obj_result.result), 
                        JSON.stringify(obj_result.result, null, 2));
        }

        if (ret == false)
        {
            var msg1 = "more than 2048 clock cycles in one single instruction.";
            add_comment(i, "execution error: " + msg1 + "<br>", msg1);

            model.mfiles()[i].XF("<pre>ERROR: " + msg1 + "</pre><br>" + JSON.stringify(obj_result.result,null,2));
            model.mfiles()[i].RX(obj_result.errors + 1);
        }
        else
        {
            model.mfiles()[i].XF(JSON.stringify(obj_result.result, null, 2));
            model.mfiles()[i].RX(obj_result.errors);
        }

        // next firmware
        setTimeout(function() { execute_firmwares_and_asm_i(SIMWARE, json_checklist, asm_text, i+1); }, 120);
    }

    function execute_firmwares_and_asm ( checklist_text, asm_text )
    {
        // get the simware
	var SIMWARE = get_simware() ;

        // get the json_checklist
        var json_checklist = wepsim_checklist2state(checklist_text) ;

        // loop over firmwares, execute the asm code over it
        execute_firmwares_and_asm_i(SIMWARE, json_checklist, asm_text, 0) ;
    }


    //
    //  Auxiliar functions
    //

    function load_firmware_from_files_aux ( mfiles, fileReader, i )
    {
	 fileReader[i] = new FileReader();
	 fileReader[i].onload = function (fileLoadedEvent) {
                                    model.addFile(mfiles[i].name, fileLoadedEvent.target.result, '0', 
                                                  '', 'NONE', '', 'NONE', '', 'NONE', '', 'NONE') ;
				};
	 fileReader[i].readAsText(mfiles[i], "UTF-8");
    }   


    // Auxiliar to show_filerow

    function show_firm_origin ( index )
    {
	    var firm= model.mfiles()[index].LF() ;
	    if (firm == '')
	        return show_popup1_content('Firmware', '<br><pre>ERROR: Empty firmware.</pre><br>') ;

            var content = '<div style="overflow:auto; height:65vh;"><pre>'+firm+'</pre><div>' ;
            show_popup1_content('Firmware', content) ;
    }   

    function show_firm_result ( index )
    {
	    var firm_json = model.mfiles()[index].BF() ;
	    if (firm_json == '')
	        return show_popup1_content('Firmware', '<h1>Please &#181;check and wait for results.</h1>') ;

	    var firm = JSON.parse(firm_json) ;
	    if (firm.error != null)
	        return show_popup1_content('Firmware', '<br><pre>' + firm.error + '</pre><br>') ;

	    show_popup1_content('Firmware', 'Loading, please wait...') ;
            setTimeout(function() {
			    var content = firmware2html(firm.firmware, false) ;
			    show_popup1_content('Firmware', content) ;
                       }, 50);
    }

    function show_asm_result ( index )
    {
	    var asm_json = model.mfiles()[index].EF() ;
	    if (asm_json == '')
	        return show_popup1_content('Assembly', '<h1>Please &#181;check and wait for results.</h1>') ;

	    var asm = JSON.parse(asm_json) ;
	    if (asm.error != null)
	        return show_popup1_content('Assembly', '<br><pre>' + asm.error + '</pre><br>');

            var o = "<div class='row'>" +
                    "<div class='col-xs-3 col-sm-3'>" +
                    "<center><h3>Memory map</h3></center>" +
                    "<div id='cc_map' style='overflow-y:scroll; overflow-x:auto; max-height:55vh;'>" +
                    "   <div id='compile_mm'>" + segments2html(asm.seg) + "</div>" +
                    "</div>" +
                    "</div>" +
                    "<div class='col-xs-9 col-sm-9'>" +
                    "<center><h3>Main memory</h3></center>" +
                    "<div id='cc_bin' style='overflow-y:scroll; overflow-x:auto; max-height:55vh;'>" +
                    "   <div id='compile_mp'>" + mp2html(asm.mp, asm.labels2, asm.seg) + "</div>" +
                    "</div>" +
                    "</div>" +
                    "</div>" ;
            show_popup1_content('Assembly', o) ;

            for (skey in asm.seg) 
            {
                 $("#compile_begin_" + skey).html("0x" + asm.seg[skey].begin.toString(16));
                 $("#compile_end_"   + skey).html("0x" + asm.seg[skey].end.toString(16));
            }
	    $('#popup1div').enhanceWithin() ;
    }

    function show_checklist_result ( index )
    {
	    var chcklst_json = model.mfiles()[index].XF() ;
	    if (chcklst_json == '')
	        return show_popup1_content('Checklist', '<h1>Please &#181;check and wait for results.</h1>') ;

	    var chcklst = JSON.parse(chcklst_json) ;
	    if (chcklst.error != null)
	        return show_popup1_content('Checklist', '<br><pre>' + chcklst.error + '</pre><br>') ;

            var content = wepsim_checkreport2html(chcklst, false) ;
            show_popup1_content('Checklist', content) ;
    }   

    function show_comments_result ( index )
    {
	    var comments = model.mfiles()[index].CF() ;
	    if ( (comments== '') || (comments == null) )
                 return show_popup1_content('Comments', '<h1>Please &#181;check and wait for results.</h1>') ;

            show_popup1_content('Comments', comments) ;
    }   

    function show_popup1_content ( title, content )
    {
	    $('#popup1').modal('show') ;

	    $('#popup1title').html(title) ;
	    $('#popup1div').html(content) ;
	    $('#popup1div').enhanceWithin() ;
    }   

