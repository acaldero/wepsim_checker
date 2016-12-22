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

        $("#pbar1").attr('aria-valuenow', 0);
        $("#pbar1").attr('aria-valuemin', 0);
        $("#pbar1").attr('aria-valuemax', mfiles.length);
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
		$("#RUC"+i).text("KO");

                setTimeout(function() { execute_firmwares_and_asm_i(SIMWARE, json_checklist, asm_text, i+1); }, 220);
                return;
	}
	$("#RUC"+i).text("OK");
        update_memories(preSM);

        // load assembly
	var SIMWAREaddon = simlang_compile(asm_text, SIMWARE);
	$("#EF"+i).text(JSON.stringify(SIMWAREaddon, null, 2));
	$("#RE"+i).text("OK");
	if (SIMWAREaddon.error != null) 
	{
		$("#RE"+i).text("KO");

                setTimeout(function() { execute_firmwares_and_asm_i(SIMWARE, json_checklist, asm_text, i+1); }, 220);
                return;
	}
	set_simware(SIMWAREaddon) ;
	update_memories(SIMWARE) ;

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

        var ret = true;
	while (
                       (ret) &&
                       (reg_pc != reg_pc_before) && 
                     ( ((reg_pc <  code_end) && (reg_pc >=  code_begin)) || 
                       ((reg_pc < kcode_end) && (reg_pc >= kcode_begin)) )
                  )
	{
	       ret = execute_microprogram(1024) ;

	       reg_pc_before = reg_pc ;
	       reg_pc = sim_states["REG_PC"].value ;
	}

        // compare with expected results
        var obj_result = to_check(json_checklist) ;
        if (ret == false)
        {
	    obj_result.result = "<pre>ERROR: timeout</pre><br>" + obj_result.result;
	    obj_result.errors = obj_result.errors + 1;
        }
	$("#XF"+i).text(JSON.stringify(obj_result.result, null, 2));
	$("#RX"+i).text(obj_result.errors);

        // next firmware
        setTimeout(function() { execute_firmwares_and_asm_i(SIMWARE, json_checklist, asm_text, i+1); }, 220);
    }

    function execute_firmwares_and_asm ( checklist_text, asm_text )
    {
        // get the simware
	var SIMWARE = get_simware() ;

        // get the json_checklist
        var json_checklist = read_checklist(checklist_text) ;

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
					  //$("#LF"+i).css('overflow-y', 'scroll');
					    $("#RL"+i).text('OK');
				   };
	    fileReader[i].readAsText(mfiles[i], "UTF-8");
    }   

    function show_filerow ( mfile, i )
    {
	var o = "" ;

	o = o + "<tr>" +
		"<td>" + mfile.name + "</td>" +
		"<td>" +
		"    <div id='LF" + i + "' style='display:none;'></div>" +
		"    <a href='#' " + 
		"       onclick=\"$('#IF').popup('open');" + 
		"                 var firm=$('#LF"+i+"').text();" + 
		"                 $('#LF').html('<div style=\\'overflow:auto\\'><pre>'+firm+'</pre><div>');"+
		"                 $('#LF').enhanceWithin();" + "\""+
                "       data-position-to='windows' data-transition='none' " +
		"       data-rel='popup'><div id='RL" + i + "'>NONE</div></a>" + 
		"</td>" +
		"<td>" +
		"    <div id='BF" + i + "' style='display:none;'></div>" +
		"    <a href='#' " + 
		"       onclick=\"$('#IUC').popup('open');" + 
		"                 $('#BF').html('<h1>Please &#181;check and wait...</h1>');" +
		"                 var firm_json=$('#BF"+i+"').text();" + 
		"                 if (firm_json == '') return;" + 
		"                 var firm = JSON.parse(firm_json);" +
		"                 show_firm_result('#BF', firm);" +
		"                 $('#BF').enhanceWithin();" + "\""+
                "       data-position-to='windows' data-transition='none' " +
		"       data-rel='popup'><div id='RUC" + i + "'>NONE</div></a>" + 
		"</td>" +
		"<td>" +
		"    <div id='EF" + i + "' style='display:none;'></div>" +
		"    <a href='#' " + 
		"       onclick=\"$('#IE').popup('open');" + 
		"                 $('#EF').html('<h1>Please &#181;check and wait...</h1>');" +
		"                 var asm_json=$('#EF"+i+"').text();" + 
		"                 if (asm_json == '') return;" + 
		"                 var asm = JSON.parse(asm_json);" +
		"                 show_asm_result('#EF', asm);" +
		"                 $('#EF').enhanceWithin();" + "\""+
                "       data-position-to='windows' data-transition='none' " +
		"       data-rel='popup'><div id='RE" + i + "'>NONE</div></a>" + 
		"</td>" +
		"<td>" +
		"    <div id='XF" + i + "' style='display:none;'></div>" +
		"    <a href='#' " + 
		"       onclick=\"$('#IX').popup('open');" + 
		"                 $('#XF').html('<h1>Please &#181;check and wait...</h1>');" +
		"                 var chcklst_json=$('#XF"+i+"').text();" + 
		"                 if (chcklst_json == '') return;" + 
		"                 var chcklst = JSON.parse(chcklst_json);" +
		"                 show_checklist_result('#XF', chcklst);" +
		"                 $('#XF').enhanceWithin();" + "\""+
                "       data-position-to='windows' data-transition='none' " +
		"       data-rel='popup'><div id='RX" + i + "'>NONE</div></a>" + 
		"</td>" +
		"</tr>" ;

        return o ;
    }

    // Auxiliar to show_filerow

    function show_firm_result ( jqDiv, firm )
    {
	    if (firm.error != null)
            {
	         $(jqDiv).html('<br><pre>' + firm.error + '</pre><br>') ;
                 return;
            }

	    $(jqDiv).html(firmware2html(firm.firmware, false)) ;
    }   

    function show_asm_result ( jqDiv, SIMWAREaddon )
    {
	    if (SIMWAREaddon.error != null)
	    {
	        $(jqDiv).html('<br><pre>' + SIMWAREaddon.error + '</pre><br>');
	        return;
	    }

            var o = "" ;
            o = o +    "<div class='row'>" +
                       "<div class='col-xs-3 col-sm-3'>" +
                       "<center><h3>Memory map</h3></center>" +
                       "<div id='cc_map' style='overflow-y:scroll; overflow-x:auto; height:70% !important;'>" +
                       "   <div id='compile_mm'></div>" +
                       "</div>" +
                       "</div>" +
                       "<div class='col-xs-9 col-sm-9'>" +
                       "<center><h3>Main memory</h3></center>" +
                       "<div id='cc_bin' style='overflow-y:scroll; overflow-x:auto; height:70% !important;'>" +
                       "   <div id='compile_mp'>" +
                       "      <center>Please select 'Compile' secondly to have the associated binary code.</center>" +
                       "   </div>" +
                       "</div>" +
                       "</div>" +
                       "</div>" ;
	    $(jqDiv).html(o);

            $("#compile_mp").html(mp2html(SIMWAREaddon.mp, SIMWAREaddon.labels2, SIMWAREaddon.seg));
            $("#compile_mm").html(segments2html(SIMWAREaddon.seg));

            for (skey in SIMWAREaddon.seg) 
            {
                 $("#compile_begin_" + skey).html("0x" + SIMWAREaddon.seg[skey].begin.toString(16));
                 $("#compile_end_"   + skey).html("0x" + SIMWAREaddon.seg[skey].end.toString(16));
            }
    }   

    function show_checklist_result ( jqDiv, checklist )
    {
	    if (checklist.error != null)
            {
	         $(jqDiv).html('<br><pre>' + checklist.error + '</pre><br>') ;
                 return;
            }

	    $(jqDiv).html(checkreport2html(checklist)) ;
    }   


    // TODO: get checklist ready
    // TODO: check states, memory, etc. in order to check the expected result is accommplished
    // TODO: "register $0 >= 100"*

    function checkreport2html ( checklist )
    {
        var o = "" ;
        var color = "green" ;

        o += "<table border=1>" +
             "<tr>" +
             "<th>Element Type</th>" +
             "<th>Element Id.</th>" +
             "<th>Expected</th>" +
             "<th>Obtained</th>" +
             "</tr>" ;
        for (var i=0; i<checklist.length; i++)
        {
             if (checklist[i].equals === false)
                  color = "orange" ;
             else color = "lightgreen" ;

             o += "<tr bgcolor=" + color + ">" +
                  "<td>" + checklist[i].elto_type + "</td>" +
                  "<td>" + checklist[i].elto_id   + "</td>" +
                  "<td>" + checklist[i].expected  + "</td>" +
                  "<td>" + checklist[i].obtained  + "</td>" +
                  "</tr>" ;
        }
        o += "</table>" ;

        return o ;
    }

    function read_checklist ( checklist )
    {
        var o = new Object() ;
        o.registers = new Object() ;
        o.memory    = new Object() ;
        o.screen    = new Object() ;

        var lines = checklist.split("\n") ;
        for (var i=0; i<lines.length; i++)
        {
             check = lines[i].trim().split(" ");
             if (check == "") {
                 continue;
             }

             if (check.length < 3) {
                 console.log("ERROR in checklist at line " + i + ": " + lines[i]);
                 continue;
             }

             // TODO: translate $t0, ...

             if (check[0].toUpperCase().trim() == "REGISTER")
                 o.registers[check[1]] = check[2] ;
             if (check[0].toUpperCase().trim() == "MEMORY")
                 o.memory[check[1]] = check[2] ;
             if (check[0].toUpperCase().trim() == "SCREEN")
                 o.screen[check[1]] = check[2] ;
        }

        return o ;
    }   

    function to_check ( expected_result )
    {
        var result = new Array() ;
        var errors = 0 ;

        if (typeof expected_result.registers != "undefined")
        {
            for (var reg in expected_result.registers)
            {
                 // TODO: translate $t0, ...
                 var index = parseInt(reg) ;

                 var diff = new Object() ;
                 diff.expected  = expected_result.registers[index] ;
                 diff.obtained  = get_value(sim_states['BR'][index]) ; 
                 diff.equals    = (expected_result.registers[index] == get_value(sim_states['BR'][index])) ;
                 diff.elto_type = "register" ;
                 diff.elto_id   = reg ;
                 result.push(diff) ;

                 if (diff.equals === false) errors++ ;
            }
        }
        if (typeof expected_result.memory != "undefined")
        {
            for (var mp in expected_result.memory)
            {
                 var index = parseInt(mp) ;
                 if (typeof MP[index] == "undefined")
                      var value = 0 ;
                 else var value = MP[index] ;

                 var diff = new Object() ;
                 diff.expected  = expected_result.memory[index] ;
                 diff.obtained  = value ;
                 diff.equals    = (expected_result.memory[index] == value) ;
                 diff.elto_type = "memory" ;
                 diff.elto_id   = mp ;
                 result.push(diff) ;

                 if (diff.equals === false) errors++ ;
            }
        }
        if (typeof expected_result.screen != "undefined")
        {
            var sim_screen = get_screen_content() ;
            var sim_lines  = sim_screen.trim().split("\n") ;
            for (var line in expected_result.screen)
            {
                 var index = parseInt(line) ;
                 if (typeof sim_lines[index] == "undefined")
                      var value = "" ;
                 else var value = sim_lines[index] ;

                 var diff = new Object() ;
                 diff.expected  = expected_result.screen[index] ;
                 diff.obtained  = value ;
                 diff.equals    = (expected_result.screen[index] == value) ;
                 diff.elto_type = "screen" ;
                 diff.elto_id   = line ;
                 result.push(diff) ;

                 if (diff.equals === false) errors++ ;
            }
        }

        var d = new Object() ;
        d.result = result ;
        d.errors = errors ;
        return d ;
    }

