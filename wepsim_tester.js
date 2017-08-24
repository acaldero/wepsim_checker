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

    function wt_dataModel ( )
    {
        var self = this ;

        self.asm_test  = ko.observableArray([]) ;
        self.addAsm    = function(a,b) {
                            this.asm_test.push({ name:a, content:b }) ;
                         } ;

	self.checklist     = new Array() ;
	self.checklist_bin = new Array() ;
        self.addCheck  = function(a,b) {
                            var c = wepsim_checklist2state(b) ;
                            this.checklist.push({ name:a, content:b }) ;
                            this.checklist_bin.push({ name:a, content:c }) ;
                         } ;

        self.mfiles    = new Array() ;
        self.addMicro  = function(a,b) {
                            this.mfiles.push({ name:a, content:b }) ;
                         } ;

        self.mresults  = ko.observableArray([]) ;
        self.addResult = function(a,b,c,d,e,f,g,h,i,j)
                         {
                            this.mresults.push({ name:ko.observable(a),
                                                 RL:ko.observable(b),
                                                 BF:c,
                                                 RUC:ko.observable(d),
                                                 EF:e,
                                                 RE:ko.observableArray(f),
                                                 XF:g,
                                                 RX:ko.observableArray(h),
                                                 CF:i,
                                                 RC:ko.observable(j) }) ;

			     $("#pbar1").attr('aria-valuemax', this.mresults().length);
                         } ;
    }

    function wt_load_files ( id_mc, id_asm, id_checklst )
    {
	    var mfiles1 = document.getElementById(id_mc).files;
	    var mfiles2 = document.getElementById(id_asm).files;
	    var mfiles3 = document.getElementById(id_checklst).files;

            model.mresults.removeAll();
            model.mfiles = new Array();
            model.asm_test.removeAll();
            model.checklist = new Array();
            model.checklist_bin = new Array();

            // results
	    for (var i=0; i<mfiles1.length; i++)
            {
                 var f = new Array() ;
                 var h = new Array() ;
	         for (var j=0; j<mfiles2.length; j++) 
	         {
		      f.push(ko.observable('NONE'));
		      h.push(ko.observable('NONE'));
	         }

		 model.addResult('Loading microcode file name...',
				 '0',
				 '',
				 'NONE',
				 new Array(''),
				 f,
				 new Array(''),
				 h,
				 new Array(),
				 'NONE') ;
	    }

	    // microcode
	    var fileReader1 = new Array();
	    for (var i=0; i<mfiles1.length; i++)
            {
		 fileReader1[i] = new FileReader();
		 fileReader1[i].index  = i;
		 fileReader1[i].onload = function (fileLoadedEvent) {
					     model.addMicro(mfiles1[this.index].name, 
				                            fileLoadedEvent.target.result);
        				     model.mresults()[this.index].name(mfiles1[this.index].name);
					 };
		 fileReader1[i].readAsText(mfiles1[i], "UTF-8");
	    }

	    // assembly
	    var fileReader2 = new Array();
	    for (var i=0; i<mfiles2.length; i++)
            {
	        fileReader2[i] = new FileReader();
	        fileReader2[i].index = i;
	        fileReader2[i].onload = function (fileLoadedEvent) {
					     model.addAsm(mfiles2[this.index].name, 
				                          fileLoadedEvent.target.result);
				       };
	        fileReader2[i].readAsText(mfiles2[i], 'UTF-8');
            }

	    // checklist
	    var fileReader3 = new Array();
	    for (var i=0; i<mfiles3.length; i++)
            {
	        fileReader3[i] = new FileReader();
	        fileReader3[i].index = i;
	        fileReader3[i].onload = function (fileLoadedEvent) {
					     model.addCheck(mfiles3[this.index].name, 
				                            fileLoadedEvent.target.result);
				       };
	        fileReader3[i].readAsText(mfiles3[i], 'UTF-8');
            }
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

    function add_comment ( i, stage, short_msg, large_msg )
    {
	model.mresults()[i].CF.push("<li>" + stage + ":</li><br><ul>" + large_msg + "</ul><br>");

	var old_msg = model.mresults()[i].RC() ;
        if (old_msg == "NONE") 
        {
            model.mresults()[i].RC("<ul><li>" + stage + ": " + short_msg + "</li></ul>");
            return ;
        }

	old_msg = old_msg.replace("</li></ul>", "</li>");
	model.mresults()[i].RC(old_msg + "<li>" + stage + ": " + short_msg + "</li></ul>");
    }

    function execute_firmwares_and_asm_ij ( SIMWARE, checklist_bin_arr, assemblies_arr, i, j )
    {
        var neltos  = parseInt($("#pbar1").attr('aria-valuemax'));
        var percent = Math.trunc(100*i/neltos);

        // notify user
        $("#pbar1").attr('aria-valuenow', i);
        $("#pbar1").html(percent + '%');
        $("#pbar1").css("width", percent + "%");

        // checks...
	var results_length = model.mresults().length;

	if (results_length == 0) {
            return;
        }
        if (i >= results_length) {
            return;
        }

        if (j >= assemblies_arr.length) 
        {
            setTimeout(function() {
                           execute_firmwares_and_asm_ij(SIMWARE, checklist_bin_arr, assemblies_arr, i+1, 0);
                       }, 120);
            return;
        }

        // load firmware
	var ifirm = model.mfiles[i].content;
	var preSM = loadFirmware(ifirm);
        model.mresults()[i].BF = JSON.stringify(preSM);
	if (preSM.error != null)
	{
                model.mresults()[i].RUC("1");
                add_comment(i, 
                            "firmware error",
                            preSM.error.split("(*)")[1], 
                            preSM.error);

                setTimeout(function() {
                             execute_firmwares_and_asm_ij(SIMWARE, checklist_bin_arr, assemblies_arr, i, j+1);
                           }, 120);
                return;
	}
        model.mresults()[i].RUC("0");
        update_memories(preSM);

        // load assemblyi 
	var SIMWAREaddon = simlang_compile(assemblies_arr[j].content, SIMWARE);
        model.mresults()[i].EF[j] = JSON.stringify(SIMWAREaddon, null, 2);
        model.mresults()[i].RE()[j]("0");
	if (SIMWAREaddon.error != null)
	{
                model.mresults()[i].RE()[j]("1");
                add_comment(i, 
                            "assembly error",
                            SIMWAREaddon.error.split("(*)")[1], 
                            SIMWAREaddon.error);

                setTimeout(function() {
                              execute_firmwares_and_asm_ij(SIMWARE, checklist_bin_arr, assemblies_arr, i, j+1);
                           }, 120);
                return;
	}
	set_simware(SIMWAREaddon) ;
	update_memories(SIMWARE) ;

        // execute firmware-assembly
        var cycles_limit = 2048 ;
        var ret = execute_asm_and_firmware(cycles_limit) ;

        // compare with expected results
        var obj_current = wepsim_current2state();
        var obj_result  = wepsim_diff_results(checklist_bin_arr[j].content, obj_current) ;
        if (obj_result.errors != 0)
        {
            add_comment(i,
                        "execution error",
                        wepsim_checkreport2txt(obj_result.result),
                        wepsim_checkreport2html(obj_result.result, true)) ;
        }

        if (ret == false)
        {
            var msg1 = "more than " + cycles_limit + " clock cycles in one single instruction.";
            add_comment(i, 
                        "execution error",
                        msg1 + "<br>", 
                        msg1);

            model.mresults()[i].XF[j] = "<pre>ERROR: " + msg1 + "</pre><br>" + JSON.stringify(obj_result.result,null,2);
            model.mresults()[i].RX()[j](obj_result.errors + 1);
        }
        else
        {
            model.mresults()[i].XF[j] = JSON.stringify(obj_result.result, null, 2);
            model.mresults()[i].RX()[j](obj_result.errors);
        }

        // next firmware
        setTimeout(function() { 
                      execute_firmwares_and_asm_ij(SIMWARE, checklist_bin_arr, assemblies_arr, i, j+1); 
                   }, 120);
    }

    function execute_firmwares_and_asm ( checklist_bin_arr, assemblies_arr )
    {
        // get the simware
	var SIMWARE = get_simware() ;

        // loop over firmwares, execute the asm code over it
        execute_firmwares_and_asm_ij(SIMWARE, checklist_bin_arr, assemblies_arr, 0, 0) ;
    }


    //
    //  Auxiliar functions
    //

    function show_firm_origin ( index )
    {
	    var firm = '' ;
            if (typeof model.mfiles[index] != "undefined")
	        firm = model.mfiles[index].content ;
	    if (firm == '')
	        return show_popup1_content('Firmware', '<br><pre>ERROR: Empty firmware.</pre><br>') ;

	    show_popup1_content('Firmware', 'Loading, please wait...') ;
            setTimeout(function() {
			   var content = '<div style="overflow:auto; height:65vh;"><pre>'+firm+'</pre><div>' ;
			   show_popup1_content('Firmware', content) ;
                       }, 50);
    }

    function show_firm_result ( index )
    {
	    var firm_json = model.mresults()[index].BF ;
	    if (firm_json == '')
	        return show_popup1_content('Firmware', '<h1>Empty.</h1>') ;

	    var firm = JSON.parse(firm_json) ;
	    if (firm.error != null)
	        return show_popup1_content('Firmware', '<br><pre>' + firm.error + '</pre><br>') ;

	    show_popup1_content('Firmware', 'Loading, please wait...') ;
            setTimeout(function() {
			    var content = firmware2html(firm.firmware, false) ;
			    show_popup1_content('Firmware', content) ;
                       }, 50);
    }

    function show_asm_origin ( index )
    {
	    var asm_test = '' ;
            if (typeof model.asm_test()[index] != "undefined")
                asm_test  = model.asm_test()[index].content ;
	    if (asm_test  == '')
	        return show_popup1_content('Assembly code', '<br><pre>ERROR: Empty assembly code.</pre><br>') ;

	    show_popup1_content('Assembly code', 'Loading, please wait...') ;
            setTimeout(function() {
			   var content = '<div style="overflow:auto; height:65vh;"><pre>'+asm_test+'</pre><div>';
			   show_popup1_content('Assembly code', content) ;
                       }, 50);
    }

    function show_asm_result ( index_i, index_j )
    {
	    var asm_json = '' ;
	    if (typeof model.mresults()[index_i] != "undefined")
	        asm_json = model.mresults()[index_i].EF[index_j] ;
	    if (asm_json == '')
	        return show_popup1_content('Assembly', '<h1>Empty.</h1>') ;

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

    function show_checklist_origin ( index )
    {
	    var checklist= '' ;
            if (typeof model.checklist[index] != "undefined")
                checklist = model.checklist[index].content ;
	    if (checklist == '')
	        return show_popup1_content('Check-list', '<br><pre>ERROR: Empty checklist.</pre><br>') ;

	    show_popup1_content('Assembly code', 'Loading, please wait...') ;
            setTimeout(function() {
			  var content = '<div style="overflow:auto; height:65vh;"><pre>'+checklist+'</pre><div>';
			  show_popup1_content('Check-list', content) ;
                       }, 50);
    }

    function show_checklist_result ( index_i, index_j )
    {
	    var chcklst_json = '' ;
	    if (typeof model.mresults()[index_i] != "undefined")
	        chcklst_json = model.mresults()[index_i].XF[index_j] ;
	    if (chcklst_json == '')
	        return show_popup1_content('Checklist', '<h1>Empty.</h1>') ;

	    var chcklst = JSON.parse(chcklst_json) ;
	    if (chcklst.error != null)
	        return show_popup1_content('Checklist', '<br><pre>' + chcklst.error + '</pre><br>') ;

	    show_popup1_content('Checklist', 'Loading, please wait...') ;
            setTimeout(function() {
			    var content = wepsim_checkreport2html(chcklst, false) ;
			    show_popup1_content('Checklist', content) ;
                       }, 50);
    }

    function show_comments_result ( index )
    {
	    var comments = '' ;
	    if (typeof model.mresults()[index] != "undefined")
	        comments = model.mresults()[index].CF.join('\n') ;
	    if (comments== '') {
                return show_popup1_content('Comments', '<h1>Empty.</h1>') ;
            }

            comments = '<span class="badge badge-success"' +
                       '      onclick="SelectText(\'comments_copy\'); document.execCommand(\'copy\');"' +
                       '      data-inline="true">Copy to clipboard</span>' +
                       '<span id="comments_copy">' +
	               '<h2 style="margin:5 0 0 0">' + 
                       'Report for \'' + model.mresults()[index].name() + '\' firmware:' + 
                       '</h2><br>' +
                       '<ul>' + comments + '</ul>' +
                       '</span>' ;
            return show_popup1_content('Comments', comments) ;
    }

    function show_popup1_content ( title, content )
    {
	    $('#popup1').modal('show') ;

	    $('#popup1title').html(title) ;
	    $('#popup1div').html(content) ;
	    $('#popup1div').enhanceWithin() ;
    }

