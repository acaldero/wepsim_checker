/*      
 *  Copyright 2015-2016 Alejandro Calderon Mateos, Felix Garcia Carballeira
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
    //  Init (without UI)
    //

    function init_noui ()
    {
            // 1.- it checks if everything is ok
            load_check() ;

            // 2.- display the information holders
            init_states("") ;
            init_rf("") ;

            init_stats("") ;
            init_io("") ;
    }


    //
    //  Auxiliar UI
    //

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

    function show_filerow ( i, mfile )
    {
	var o = "" ;

	o = o + "<tr>" +
		"<td>" + mfile.name + "</td>" +
		"<td>" +
		"    <div id='LF" + i + "' style='display:none;'></div>" +
		"    <a href='#' " + 
		"       onclick=\"$('#IF').popup('open');" + 
		"                 var firm=$('#LF"+i+"').text();" + 
		"                 $('#LF').html('<pre>'+firm+'</pre>');\""+
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
		"                 show_firm_result('#BF', firm);\"" +
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
		"                 show_asm_result('#EF', asm);\"" +
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
		"                 show_checklist_result('#XF', chcklst);\"" +
                "       data-position-to='windows' data-transition='none' " +
		"       data-rel='popup'><div id='RX" + i + "'>NONE</div></a>" + 
		"</td>" +
		"</tr>" ;

        return o ;
    }

    function checkFirmwares ()
    {
	var SIMWARE = get_simware() ;

	var i=0;
	var ita = $("#LF"+i);
	while (ita.length != 0)
	{
            // load firmware
	    var ifirm = ita.text();
	    var preSM = loadFirmware(ifirm);
	    $("#BF"+i).text(JSON.stringify(preSM));
	    if (preSM.error != null)
	    {
		$("#RUC"+i).text("KO");

		i++;
		ita = $("#LF"+i);
		continue;
	    }
	    $("#RUC"+i).text("OK");
            update_memories(preSM);

            // load assembly
	    var textToConvert = $('#asm_test').text();
		textToConvert = textToConvert.toLowerCase();
	    var SIMWAREaddon  = simlang_compile(textToConvert, SIMWARE);
	    $("#EF"+i).text(JSON.stringify(SIMWAREaddon, null, 2));
	    $("#RE"+i).text("OK");
	    if (SIMWAREaddon.error != null) 
	    {
		$("#RE"+i).text("KO");

		i++;
		ita = $("#LF"+i);
		continue;
	    }
	    set_simware(SIMWAREaddon) ;
	    update_memories(SIMWARE) ;

            // execute firmware-assembly
	    init_noui() ;
	    reset() ;
	    var reg_pc        = sim_states["REG_PC"].value ;
	    var reg_pc_before = sim_states["REG_PC"].value - 4 ;
	    var code_begin = parseInt(segments['code'].begin) ;
	    var code_end   = parseInt(segments['code'].end) ;
	    while ( (reg_pc != reg_pc_before) && (reg_pc < code_end) && (reg_pc > code_begin) )
	    {
	       execute_microprogram() ;

	       reg_pc_before = reg_pc ;
	       reg_pc = sim_states["REG_PC"].value ;
	    }

            // compare with expected results
	    var textToConvert  = $('#checklist').text();
		textToConvert  = textToConvert.toLowerCase();
            var json_checklist = loadChecklist(textToConvert) ;
            var obj_result     = to_check(json_checklist) ;
	    $("#XF"+i).text(JSON.stringify(obj_result.result, null, 2));
	    $("#RX"+i).text(obj_result.errors);

            // next firmware
	    i++ ;
	    ita = $("#LF"+i) ;
	}
    }


    //
    //  Load files
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

    function load_firmware_from_files ( )
    {
	var mfiles = document.getElementById("filesToLoad").files ;

	// HTML where related file information will be loaded...
	var o = "" ;
	for (var i=0; i<mfiles.length; i++) {
             o = o + show_filerow(i, mfiles[i]) ;
	}
	$("#tbmfile").html(o);

	// Read into the HTML generated...
	var fileReader = new Array();
	for (var i=0; i<mfiles.length; i++) {
	     load_firmware_from_files_aux(mfiles, fileReader, i);
	}
    }


    //
    // TODO
    //

    // TODO: load checklist from text like: "register $0 >= 100"*
    function loadChecklist ( checklist )
    {
        var o = new Object() ;
        o.registers = new Object() ;
        o.memory    = new Object() ;

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
        }

        return o ;
    }   

    // TODO: check states, memory, etc. in order to check the expected result is accommplished
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
                 diff.obtained  = sim_states['BR'][index] ; 
                 diff.equals    = (expected_result.registers[index] == sim_states['BR'][index]) ;
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

        var d = new Object() ;
        d.result = result ;
        d.errors = errors ;
        return d ;
    }

    // TODO: return the differences as HTML 
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

