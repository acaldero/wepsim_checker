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

    function load_firmware_from_files ( mfiles, tableDiv )
    {
	// HTML where related file information will be loaded...
	var o = "" ;
	for (var i=0; i<mfiles.length; i++) {
             o = o + show_filerow(mfiles[i], i) ;
	}
	$(tableDiv).html(o);

	// Read into the HTML generated...
	var fileReader = new Array();
	for (var i=0; i<mfiles.length; i++) {
	     load_firmware_from_files_aux(mfiles, fileReader, i);
	}

        // notify user
        $("#pbar1").attr('aria-valuenow', 0);
        $("#pbar1").attr('aria-valuemin', 0);
        $("#pbar1").attr('aria-valuemax', mfiles.length);
    }

    function add_comment ( i, stage, msg )
    {
	$("#CF" +i).text($("#CF"+i).text() + "(" + msg + ") ");

	var old_msg = $("#RC" +i).text();
        if (old_msg == "\"NONE\"")
	     $("#RC" +i).text("\"" + stage + "\" ");
	else $("#RC" +i).text(old_msg + "\"" + stage + "\" ");

	old_msg = $("#RC" +i).text().replace("\" \"",", ");
	$("#RC" +i).text(old_msg);
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

	var ita = $("#LF"+i);
	if (ita.length == 0)
            return;

        // load firmware
	var ifirm = ita.text();
	var preSM = loadFirmware(ifirm);
	$("#BF"+i).text(JSON.stringify(preSM));
	if (preSM.error != null)
	{
		$("#RUC"+i).text("1");
                add_comment(i, "firmware error:"+preSM.error.split("(*)")[1], preSM.error);

                setTimeout(function() { execute_firmwares_and_asm_i(SIMWARE, json_checklist, asm_text, i+1); }, 120);
                return;
	}
	$("#RUC"+i).text("0");
        update_memories(preSM);

        // load assembly
	var SIMWAREaddon = simlang_compile(asm_text, SIMWARE);
	$("#EF"+i).text(JSON.stringify(SIMWAREaddon, null, 2));
	$("#RE"+i).text("0");
	if (SIMWAREaddon.error != null) 
	{
		$("#RE"+i).text("1");
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

	    $("#XF"+i).text("<pre>ERROR: " + msg1 + "</pre><br>" + JSON.stringify(obj_result.result,null,2));
	    $("#RX"+i).text(obj_result.errors + 1);
        }
        else
        {
	    $("#XF"+i).text(JSON.stringify(obj_result.result, null, 2));
	    $("#RX"+i).text(obj_result.errors);
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
				    var textFromFileLoaded = fileLoadedEvent.target.result;
				    $("#LF"+i).text(textFromFileLoaded);
				    $("#RL"+i).text('0');
				};
	 fileReader[i].readAsText(mfiles[i], "UTF-8");
    }   

    function show_filerow ( mfile, i )
    {
	var o = "" ;

	o = o + "<tr>" +
		"<td>" + mfile.name + "</td>" +
		"<td>" +
		"    <div id='LF" + i + "' style='display:none; max-height:80vh; max-width:80vw;'></div>" +
		"    <a href='#' " + 
		"       onclick=\"show_firm_origin(" + i + ");\"" +
                "       data-position-to='windows' data-transition='none' " +
		"       data-rel='popup'><div id='RL" + i + "'>NONE</div></a>" + 
		"</td>" +
		"<td>" +
		"    <div id='BF" + i + "' style='display:none; max-height:80vh; max-width:80vw;'></div>" +
		"    <a href='#' " + 
		"       onclick=\"show_firm_result(" + i + ");\"" +
                "       data-position-to='windows' data-transition='none' " +
		"       data-rel='popup'><div id='RUC" + i + "'>NONE</div></a>" + 
		"</td>" +
		"<td>" +
		"    <div id='EF" + i + "' style='display:none; max-height:80vh; max-width:80vw;'></div>" +
		"    <a href='#' " + 
		"       onclick=\"show_asm_result(" + i + ");\"" +
                "       data-position-to='windows' data-transition='none' " +
		"       data-rel='popup'><div id='RE" + i + "'>NONE</div></a>" + 
		"</td>" +
		"<td>" +
		"    <div id='XF" + i + "' style='display:none; max-height:80vh; max-width:80vw;'></div>" +
		"    <a href='#' " + 
		"       onclick=\"show_checklist_result(" + i + ");\"" +
                "       data-position-to='windows' data-transition='none' " +
		"       data-rel='popup'><div id='RX" + i + "'>NONE</div></a>" + 
		"</td>" +
		"<td>" +
		"    <div id='CF" + i + "' style='display:none;font-size:small; max-height:80vh; max-width:80vw;'></div>" +
		"    <a href='#' " + 
		"       onclick=\"show_comments_result(" + i + ");\"" +
                "       data-position-to='windows' data-transition='none' " +
		"       data-rel='popup'><div id='RC" + i + "'>\"NONE\"</div></a>" + 
		"</td>" +
		"</tr>" ;

        return o ;
    }

    // Auxiliar to show_filerow

    function show_firm_origin ( index )
    {
	    var firm=$('#LF' + index).text() ;
	    if (firm == '')
	        return show_popup1_content('Firmware', '<br><pre>ERROR: Empty firmware.</pre><br>') ;

            var content = '<div style="overflow:auto; height:65vh;"><pre>'+firm+'</pre><div>' ;
            show_popup1_content('Firmware', content) ;
    }   

    function show_firm_result ( index )
    {
	    var firm_json=$('#BF' + index).text() ;
	    if (firm_json == '')
	        return show_popup1_content('Firmware', '<h1>Please &#181;check and wait for results.</h1>') ;

	    var firm = JSON.parse(firm_json) ;
	    if (firm.error != null)
	        return show_popup1_content('Firmware', '<br><pre>' + firm.error + '</pre><br>') ;

	    var content = firmware2html(firm.firmware, false) ;
            show_popup1_content('Firmware', content) ;
    }   

    function show_asm_result ( index )
    {
	    var asm_json=$('#EF' + index).text() ;
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
	    var chcklst_json=$('#XF' + index).text() ;
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
	    var comments=$('#CF' + index).text() ;
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

