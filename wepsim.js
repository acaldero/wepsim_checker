/*      
 *  Copyright 2015-2017 Felix Garcia Carballeira, Alejandro Calderon Mateos, Javier Prieto Cepeda, Saul Alonso Monsalve
 *
 *  This file is part of WepSIM.
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
    // WepSIM API
    //

    /* 
     * File/URL  
     */

    function wepsim_load_from_file ( fileToLoad, inputEditor )
    {
        var fileReader = new FileReader();
        fileReader.onload  = function (fileLoadedEvent) {
                                            var textFromFileLoaded = fileLoadedEvent.target.result;
                                            if (null != inputEditor)
					        inputEditor.setValue(textFromFileLoaded);
                             };
	fileReader.onerror = function(e) {
			        console.error("File could not be read! Code " + e.target.error.code);
			     };
        fileReader.readAsText(fileToLoad, "UTF-8");
    }

    function wepsim_save_to_file ( inputEditor, fileNameToSaveAs )
    {
            var textToWrite = inputEditor.getValue();
            var textFileAsBlob = new Blob([textToWrite], { type: 'text/plain' });

            var downloadLink = document.createElement("a");
            downloadLink.download = fileNameToSaveAs;
            downloadLink.innerHTML = "Download File";
            if (window.webkitURL != null) {
                // Chrome allows the link to be clicked
                // without actually adding it to the DOM.
                downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
            }
            else {
                // Firefox requires the link to be added to the DOM
                // before it can be clicked.
                downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
                downloadLink.onclick = function ( event ) {
                                            document.body.removeChild(event.target);
                                       };
                downloadLink.style.display = "none";
                document.body.appendChild(downloadLink);
            }

            downloadLink.click();
    }

    function wepsim_load_from_url ( url, do_next )
    {
	var xmlhttp = new XMLHttpRequest();

	xmlhttp.onreadystatechange=function() {
	     // if ((xmlhttp.readyState == 4) &&  (xmlhttp.status == 200))
		if ((xmlhttp.readyState == 4) && ((xmlhttp.status == 200) || (xmlhttp.status == 0)))
		{
		    var textFromFileLoaded = xmlhttp.responseText ;
                    if (null != do_next)
                        do_next(textFromFileLoaded);
		}
	}

	xmlhttp.open("GET", url, true);
	xmlhttp.send();
    }

    /* 
     * Microcompile and compile 
     */

    function wepsim_compile_assembly ( textToCompile )
    {
        return compileAssembly(textToCompile, false);
    }

    function wepsim_compile_microcode ( textToMCompile )
    {
        return compileFirmware(textToMCompile, false);
    }

    /* 
     * Play/stop 
     */

    function wepsim_execute_reset ( )
    {
	return reset() ;
    }

    function wepsim_execute_instruction ( )
    {
	if (check_if_can_execute(true) == false)
	    return false;

	return execute_microprogram() ;
    }

    function wepsim_execute_microinstruction ( )
    {
	if (check_if_can_execute(true) == false)
	    return false;

	return execute_microinstruction() ;
    }

    function wepsim_execute_set_breakpoint ( addr )
    {
        return asmdbg_set_breakpoint(addr) ;
    }

    var DBG_stop  = true ;

    function wepsim_execute_stop ( btn1 )
    {
	$(btn1).html("Run") ;
	$(btn1).removeClass("ui-icon-minus") ;
	$(btn1).addClass("ui-icon-carat-r") ;
	$(btn1).css("backgroundColor", "#CCCCCC") ;

	DBG_stop = true;
    }

    function wepsim_execute_play ( btn1 )
    {
	if (check_if_can_execute(true) == false)
	    return false;

	$(btn1).css("backgroundColor", 'rgb(51, 136, 204)') ;
	$(btn1).html("Stop") ;
	$(btn1).removeClass("ui-icon-carat-r") ;
	$(btn1).addClass("ui-icon-minus") ;

        DBG_stop = false ;
        wepsim_execute_chainplay(btn1) ;
    }

    function wepsim_execute_chainplay ( btn1 )
    {
	if (DBG_stop) 
	{
	    wepsim_execute_stop(btn1) ;
	    return ;
	}

	var ret = false ;
	if (get_cfg('DBG_level') == "instruction")
	     ret = execute_microprogram() ;
	else ret = execute_microinstruction() ;

	if (ret === false) 
	{
	    wepsim_execute_stop(btn1) ;
	    return ;
	}

	reg_pc      = get_value(sim_states["REG_PC"]) ;
	curr_addr   = "0x" + reg_pc.toString(16) ;

	if ( (typeof FIRMWARE.assembly[curr_addr] != "undefined") && 
	     (FIRMWARE.assembly[curr_addr].breakpoint) ) 
	{
	    wepsim_execute_stop(btn1) ;
	    alert("Breakpoint @ " + curr_addr + ":\n" + 
		  "Instruction at " + curr_addr + " is going to be fetched.") ;
	    return ;
	}

	setTimeout(wepsim_execute_chainplay, get_cfg('DBG_delay'), btn1) ;
    }

    function wepsim_execute_toggle_play ( btn1 )
    {
        if (DBG_stop == false) {
            DBG_stop = true ; // will help to execute_play stop playing
        } else {
            DBG_stop = false ; 
            wepsim_execute_play(btn1) ;
        }
    }


    //
    // WepSIM UI
    //

    function compileAssembly ( textToCompile, with_ui ) 
    {
        // get SIMWARE.firmware
        var SIMWARE = get_simware() ;
	if (SIMWARE.firmware.length == 0) 
        {
            if (with_ui) {
                alert('WARNING: please load the microcode first.');
                $.mobile.pageContainer.pagecontainer('change','#main3');
            }
            return false;
	} 

        // compile Assembly and show message
        var SIMWAREaddon = simlang_compile(textToCompile, SIMWARE);
        if (SIMWAREaddon.error != null) 
        {
            if (with_ui)
                showError(SIMWAREaddon.error, "inputasm") ;
            return false;
        }

        if (with_ui)
	    $.notify({ title: '<strong>INFO</strong>', message: 'Assembly was compiled and loaded.'},
		     { type: 'success', 
                       newest_on_top: true, 
                       delay: get_cfg('NOTIF_delay'), 
                       placement: { from: 'top', align: 'center' } });

        // update memory and segments
        set_simware(SIMWAREaddon) ;
	update_memories(SIMWARE);

        // update UI 
        if (with_ui) {
            $("#asm_debugger").html(assembly2html(SIMWAREaddon.mp, 
                                                  SIMWAREaddon.labels2, 
                                                  SIMWAREaddon.seg, 
                                                  SIMWAREaddon.assembly));
            showhideAsmElements();
        }

	reset();
        return true;
    }

    function showBinaryCode ( popup_id, popup_content_id ) 
    {
        $(popup_content_id).html("<center>" +
                                 "<br>Loading binary, please wait..." +
                                 "<br>" + 
                                 "<br>WARNING: loading binary might take time on slow mobile devices." + 
                                 "</center>");
        $(popup_content_id).css({width:"100%",height:"inherit !important"});
	$(popup_id).popup('open');

	setTimeout(function(){ 
			var SIMWARE = get_simware() ;

			$(popup_content_id).html(mp2html(SIMWARE.mp, SIMWARE.labels2, SIMWARE.seg));
			$(popup_id).popup("reposition", {positionTo: 'window'});

			for (skey in SIMWARE.seg) {
			     $("#compile_begin_" + skey).html("0x" + SIMWARE.seg[skey].begin.toString(16));
			     $("#compile_end_"   + skey).html("0x" + SIMWARE.seg[skey].end.toString(16));
			}
                   }, 300);
    }

    function compileFirmware ( textToMCompile, with_ui ) 
    {
	var preSM = load_firmware(textToMCompile) ;
	if (preSM.error != null) 
        {
            if (with_ui)
                showError(preSM.error, "inputfirm") ;
            return false;
        }

        if (with_ui)
	    $.notify({ title: '<strong>INFO</strong>', message: 'Microcode was compiled and loaded.'},
	    	     { type: 'success', 
                       newest_on_top: true, 
                       delay: get_cfg('NOTIF_delay'), 
                       placement: { from: 'top', align: 'center' } });

        // update UI 
	reset() ;
        return true;
    }

    function showBinaryMicrocode ( popup_id, popup_content_id ) 
    {
        $(popup_content_id).html("<center>" +
                                 "<br>Loading binary, please wait..." +
                                 "<br>" + 
                                 "<br>WARNING: loading binary might take time on slow mobile devices." + 
                                 "</center>");
        $(popup_content_id).css({width:"100%",height:"inherit !important"});
	$(popup_id).popup('open');

	setTimeout(function() {
			var SIMWARE = get_simware() ;
			$(popup_content_id).html(firmware2html(SIMWARE.firmware, true));
			$(popup_content_id).css({width:"inherit !important", height:"inherit !important"});

			$(popup_id).enhanceWithin();
			$(popup_id).trigger('updatelayout');
			$(popup_id).popup("reposition", {positionTo: 'window'});
			$(popup_id).trigger('refresh');
                   }, 300);
    }


    //
    // Auxiliar functions
    //

    function showError ( Msg, editor ) 
    {
            var errorMsg = Msg.replace(/\t/g,' ').replace(/   /g,' ');

            var pos = errorMsg.match(/Problem around line \d+/);
            var lineMsg = '' ;
            if (null != pos) {
                pos = parseInt(pos[0].match(/\d+/)[0]);
                lineMsg += '<button type="button" class="btn btn-danger" ' + 
                           '        onclick="$.notifyClose();' +
                           '                      var marked = ' + editor + '.addLineClass(' + (pos-1) + ', \'background\', \'CodeMirror-selected\');' +
                           '                 setTimeout(function() { ' + editor + '.removeLineClass(marked, \'background\', \'CodeMirror-selected\'); }, 3000);' +
		           '		     var t = ' + editor + '.charCoords({line: ' + pos + ', ch: 0}, \'local\').top;' +
		           '		     var middleHeight = ' + editor + '.getScrollerElement().offsetHeight / 2;' +
		           '		     ' + editor + '.scrollTo(null, t - middleHeight - 5);">Go line ' + pos + '</button>&nbsp;' ;
            }

	    $.notify({ title: '<strong>ERROR</strong>', 
                       message: errorMsg + '<br>' + 
                                '<center>' +  
                                lineMsg + 
                                '<button type="button" class="btn btn-danger" onclick="$.notifyClose();">Close</button>' + 
                                '</center>' },
		     { type: 'danger', 
                       newest_on_top: true, 
                       delay: 0, 
                       placement: { from: 'top', align: 'center' }
                     });
    }

    function showhideAsmElements ( ) 
    {
	$("input:checkbox:checked").each(function() {
		var column = "table ." + $(this).attr("name");
		$(column).show();
	});

	$("input:checkbox:not(:checked)").each(function() {
		var column = "table ." + $(this).attr("name");
		$(column).hide();
	});
    }


    //
    // Help management
    //

    function show_help1 ( )
    {
        var rel = $('#help1_ref').data('relative') ;
        if (rel == "")
            return;

        $('#iframe_help1').load('help/simulator-' + get_cfg('ws_idiom') + '.html ' + rel,
			        function() {
                                    $('#help1').trigger('updatelayout'); 
                                    $('#help1').popup('open');
                                });
    }


    //
    // Initialize
    //

    function sim_init ( )
    {
	    var ref_p = document.getElementById('svg_p').contentDocument ;
	    if (ref_p != null)
            {
                var o  = ref_p.getElementById('text3495');
	        if (o != null) o.addEventListener('click', 
                                                  function() { 
                                                     $('#tab11').trigger('click');
                                                  }, false);
	        var o  = ref_p.getElementById('text3029');
	        if (o != null) o.addEventListener('click', 
                                                  function() { 
                                                     $('#tab11').trigger('click');
                                                  }, false);
	        var o  = ref_p.getElementById('text3031');
	        if (o != null) o.addEventListener('click', 
                                                  function() { 
                                                     $('#tab11').trigger('click');
                                                  }, false);
	        var o  = ref_p.getElementById('text3001');
	        if (o != null) o.addEventListener('click', 
                                                  function() { 
                                                     $('#tab14').trigger('click');
                                                  }, false);
	        var o  = ref_p.getElementById('text3183');
	        if (o != null) o.addEventListener('click', 
                                                  function() { 
                                                     $('#tab23').trigger('click');
                                                  }, false);
	        var o  = ref_p.getElementById('text3775');
	        if (o != null) o.addEventListener('click', 
                                                  function() { 
                                                     $('#tab15').trigger('click');
                                                  }, false);
	        var o  = ref_p.getElementById('text3829');
	        if (o != null) o.addEventListener('click', 
                                                  function() { 
                                                     $('#tab12').trigger('click');
                                                  }, false);
	        var o  = ref_p.getElementById('text3845');
	        if (o != null) o.addEventListener('click', 
                                                  function() { 
                                                     $('#tab12').trigger('click');
                                                  }, false);
                var o  = ref_p.getElementById('text3459-7');
                if (o != null) o.addEventListener('click', 
                                                  function() { 
                                                     execute_microinstruction(); 
                                                  }, false);
            }

	    var ref_cu = document.getElementById('svg_cu').contentDocument ;
	    if (ref_cu != null)
            {
	        var o  = ref_cu.getElementById('text3010');
	        if (o != null) o.addEventListener('click', 
                                                  function() { 
                                                     $('#tab16').trigger('click');
                                                  }, false);
                var o  = ref_cu.getElementById('text3346-5');
                if (o != null) o.addEventListener('click', 
                                                  function() { 
                                                     $('#tab22').trigger('click');
                                                  }, false);
                var o  = ref_cu.getElementById('text4138');
                if (o != null) o.addEventListener('click', 
                                                  function() { 
                                                     execute_microinstruction(); 
                                                  }, false);
            }
    }

    function sim_prepare_editor ( editor )
    {
	    editor.setValue("\n\n\n\n\n\n\n\n\n");
	    editor.getWrapperElement().style['text-shadow'] = '0.0em 0.0em'; 

	    if (get_cfg('editor_theme') == 'blackboard') {
		editor.getWrapperElement().style['font-weight'] = 'normal';
		editor.setOption('theme','blackboard');
	    }

	    var edt_mode = get_cfg('editor_mode');
	    if (edt_mode == 'vim') 
		editor.setOption('keyMap','vim');
	    if (edt_mode == 'emacs') 
		editor.setOption('keyMap','emacs');
	    if (edt_mode == 'sublime') 
		editor.setOption('keyMap','sublime');

	    setTimeout(function(){editor.refresh();}, 100);
    }


    //
    // Example management
    //

    function load_from_example_assembly ( example_id )
    {
	$.mobile.pageContainer.pagecontainer('change', '#main4');
	inputasm.setValue("Please wait...");
	inputasm.refresh();

	var url = "examples/exampleCode" + example_id + ".txt?time=20160730a" ;
        var do_next = function( mcode ) {
			    inputasm.setValue(mcode);
			    inputasm.refresh();

                            var ok = compileAssembly(mcode, true);
			    if (true == ok)
			    {
				  setTimeout(function(){
					  $.mobile.pageContainer.pagecontainer('change', '#main1');
				  }, 80);

				  $.notify({ title: '<strong>INFO</strong>', 
					     message: 'Example ready to be used.'},
					   { type: 'success', 
					     newest_on_top: true, 
					     delay: get_cfg('NOTIF_delay'), 
					     placement: { from: 'top', align: 'center' } 
					    });
			    }
                      };
        wepsim_load_from_url(url, do_next) ;
    }

    function load_from_example_firmware ( example_id, do_next )
    {
	$.mobile.pageContainer.pagecontainer('change', '#main3');
	inputfirm.setValue("Please wait...");
	inputfirm.refresh();

	var url     = "examples/exampleMicrocode" + example_id + ".txt?time=20160730a" ;
        var do_next = function( mcode ) {
			   inputfirm.setValue(mcode);
			   inputfirm.refresh();

			   var ok = compileFirmware(mcode, true);
                           if (true == ok)
                               setTimeout(function() { load_from_example_assembly(example_id); }, 80);
                      };
        wepsim_load_from_url(url, do_next) ;
    }

