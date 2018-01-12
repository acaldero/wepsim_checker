function wt_dataModel(){var a=this;a.CFG_cycles_limit=ko.observable(1000);a.CFG_instructions_limit=ko.observable(1024);a.asm_test=ko.observableArray([]);a.addAsm=function(d,c){this.asm_test.push({name:d,content:c})};a.checklist=ko.observableArray([]);a.checklist_bin=[];a.addCheck=function(e,d){var f=wepsim_checklist2state(d);this.checklist.push({name:e,content:d});this.checklist_bin.push({name:e,content:f})};a.mfiles=ko.observableArray([]);a.addMicro=function(d,c){this.mfiles.push({name:d,content:c})};a.mresults=ko.observableArray([]);a.addResult=function(t,s,r,q,p,o,n,m,l,k){this.mresults.push({name:ko.observable(t),RL:s,BF:r,RUC:ko.observable(q),EF:p,RE:ko.observableArray(o),XF:n,RX:ko.observableArray(m),CF:l,RC:ko.observable(k)});$("#pbar1").attr("aria-valuemax",this.mresults().length)}}function wt_load_files(g,b,e){var l=0;var q=document.getElementById(g).files;var p=document.getElementById(b).files;var o=document.getElementById(e).files;model.mresults.removeAll();model.mfiles.removeAll();model.asm_test.removeAll();model.checklist.removeAll();model.checklist_bin=[];for(l=0;l<q.length;l++){var n=[];var m=[];for(var k=0;k<p.length;k++){n.push(ko.observable("NONE"));m.push(ko.observable("NONE"))}model.addResult("Loading microcode file name...","0","","NONE",new Array(""),n,new Array(""),m,[],"NONE")}var d=[];for(l=0;l<q.length;l++){d[l]=new FileReader();d[l].index=l;d[l].onload=function(f){model.addMicro(q[this.index].name,f.target.result);model.mresults()[this.index].name(q[this.index].name)};d[l].readAsText(q[l],"UTF-8")}var c=[];for(l=0;l<p.length;l++){c[l]=new FileReader();c[l].index=l;c[l].onload=function(f){model.addAsm(p[this.index].name,f.target.result)};c[l].readAsText(p[l],"UTF-8")}var a=[];for(l=0;l<o.length;l++){a[l]=new FileReader();a[l].index=l;a[l].onload=function(f){model.addCheck(o[this.index].name,f.target.result)};a[l].readAsText(o[l],"UTF-8")}}function add_comment(d,b,e,a){e=e.replace(/<br>/g,"\n");model.mresults()[d].CF.push("<li>"+b+":</li><ul>"+a+"</ul>");var c=model.mresults()[d].RC();if(c=="NONE"){model.mresults()[d].RC("<ul><li>"+b+": "+e+"</li></ul>");return}c=c.replace("</li></ul>","</li>");model.mresults()[d].RC(c+"<li>"+b+": "+e+"</li></ul>")}function execute_firmwares_and_asm_ij(l,n,d,c,a){var b=parseInt($("#pbar1").attr("aria-valuemax"));var h=Math.trunc(100*c/b);$("#pbar1").attr("aria-valuenow",c);$("#pbar1").html(h+"%");$("#pbar1").css("width",h+"%");var k=model.mresults().length;if(k==0){return}if(c>=k){return}if(a>=d.length){setTimeout(function(){execute_firmwares_and_asm_ij(l,n,d,c+1,0)},100);return}if(typeof n[a]=="undefined"){return show_popup1_content("CheckList","<br><pre>ERROR: Each assembly code needs its associated checklist.</pre><br>")}var m=model.mfiles()[c].content;var g=sim_core_compile_firmware(m);model.mresults()[c].BF=JSON.stringify(g.simware);if(false==g.ok){model.mresults()[c].RUC("1");add_comment(c,"firmware error",g.msg.split("(*)")[1],g.msg);setTimeout(function(){execute_firmwares_and_asm_ij(l,n,d,c,a+1)},100);return}model.mresults()[c].RUC("0");g=sim_core_compile_assembly(d[a].content);model.mresults()[c].EF[a]=JSON.stringify(g.simware,null,2);model.mresults()[c].RE()[a]("0");if(false==g.ok){model.mresults()[c].RE()[a]("1");add_comment(c,"assembly error on "+d[a].name,g.msg.split("(*)")[1],g.msg);setTimeout(function(){execute_firmwares_and_asm_ij(l,n,d,c,a+1)},100);return}sim_core_reset(false);g=sim_core_execute_program(model.CFG_instructions_limit(),model.CFG_cycles_limit());var f=wepsim_current2state();var e=wepsim_check_results(n[a].content,f,false);if(e.errors!=0){add_comment(c,"execution error on "+d[a].name,wepsim_checkreport2txt(e.result),wepsim_checkreport2html(e.result,true))}if(false==g.ok){add_comment(c,"execution error on "+d[a].name,g.msg+"<br>",g.msg);diff={};diff.expected="no errors";diff.obtained=g.msg;diff.fulfill=false;diff.elto_type="runtime";diff.elto_id="execution";diff.elto_op="==";e.result.push(diff);e.errors+=1}model.mresults()[c].XF[a]=JSON.stringify(e.result,null,2);model.mresults()[c].RX()[a](e.errors);setTimeout(function(){execute_firmwares_and_asm_ij(l,n,d,c,a+1)},100)}function execute_firmwares_and_asm(c,b){sim_core_init("","","","","");var a=get_simware();execute_firmwares_and_asm_ij(a,c,b,0,0)}function show_firm_origin(a){var b="";if(typeof model.mfiles()[a]!="undefined"){b=model.mfiles()[a].content}if(b==""){return show_popup1_content("Firmware","<br><pre>ERROR: Empty firmware.</pre><br>")}show_popup2_content("Firmware","Loading, please wait...");setTimeout(function(){var c='<div class="form-group" style="height:55vh;"><input type=hidden id="todo2" value="model.mfiles()['+a+'].content = $(\'#content\').val();"><textarea class="form-control"           id="content"           style="overflow:auto;">'+b+"</textarea></div>";show_popup2_content("Firmware ("+model.mfiles()[a].name+")",c)},50)}function show_firm_result(a){var c=model.mresults()[a].BF;if(c==""){return show_popup1_content("Firmware","<h1>Empty.</h1>")}var b=JSON.parse(c);if(b.error!=null){return show_popup1_content("Firmware","<br><pre>"+b.error+"</pre><br>")}show_popup1_content("Firmware","Loading, please wait...");setTimeout(function(){var d=firmware2html(b.firmware,false);show_popup1_content("Firmware",d)},50)}function show_asm_origin(b){var a="";if(typeof model.asm_test()[b]!="undefined"){a=model.asm_test()[b].content}if(a==""){return show_popup1_content("Assembly code","<br><pre>ERROR: Empty assembly code.</pre><br>")}show_popup2_content("Assembly code","Loading, please wait...");setTimeout(function(){var c='<div class="form-group" style="height:55vh;"><input type=hidden id="todo2" value="model.asm_test()['+b+'].content = $(\'#content\').val();"><textarea class="form-control"           id="content"           style="overflow:auto;">'+a+"</textarea></div>";show_popup2_content("Assembly code ("+model.asm_test()[b].name+")",c)},50)}function show_asm_result(c,b){var e="";if(typeof model.mresults()[c]!="undefined"){e=model.mresults()[c].EF[b]}if(e==""){return show_popup1_content("Assembly","<h1>Empty.</h1>")}var d=JSON.parse(e);if(d.error!=null){return show_popup1_content("Assembly","<br><pre>"+d.error+"</pre><br>")}var f="<div class='row'><div class='col-xs-3 col-sm-3'><center><h3>Memory map</h3></center><div id='cc_map' style='overflow-y:scroll; overflow-x:auto; max-height:55vh;'>   <div id='compile_mm'>"+segments2html(d.seg)+"</div></div></div><div class='col-xs-9 col-sm-9'><center><h3>Main memory</h3></center><div id='cc_bin' style='overflow-y:scroll; overflow-x:auto; max-height:55vh;'>   <div id='compile_mp'>"+mp2html(d.mp,d.labels2,d.seg)+"</div></div></div></div>";show_popup1_content("Assembly",f);for(var a in d.seg){$("#compile_begin_"+a).html("0x"+d.seg[a].begin.toString(16));$("#compile_end_"+a).html("0x"+d.seg[a].end.toString(16))}$("#popup1div").enhanceWithin()}function show_checklist_origin(a){var b="";if(typeof model.checklist()[a]!="undefined"){b=model.checklist()[a].content}if(b==""){return show_popup1_content("Checklist","<br><pre>ERROR: Empty checklist.</pre><br>")}show_popup2_content("Checklist","Loading, please wait...");setTimeout(function(){var c='<div class="form-group" style="height:55vh;"><input type=hidden id="todo2"        value="var nval = $(\'#content\').val();               model.checklist()['+a+"].content = nval;               model.checklist_bin["+a+'].content = wepsim_checklist2state(nval);"><textarea class="form-control"           id="content"           style="overflow:auto;">'+b+"</textarea></div>";show_popup2_content("Checklist ("+model.checklist()[a].name+")",c)},50)}function show_checklist_result(c,b){var d="";if(typeof model.mresults()[c]!="undefined"){d=model.mresults()[c].XF[b]}if(d==""){return show_popup1_content("Checklist","<h1>Empty.</h1>")}var a=JSON.parse(d);if(a.error!=null){return show_popup1_content("Checklist","<br><pre>"+a.error+"</pre><br>")}show_popup1_content("Checklist","Loading, please wait...");setTimeout(function(){var e=wepsim_checkreport2html(a,false);show_popup1_content("Checklist",e)},50)}function show_comments_result(a){var b="";if(typeof model.mresults()[a]!="undefined"){b=model.mresults()[a].CF.join("\n")}if(b==""){return show_popup1_content("Comments","<h1>Empty.</h1>")}b='<span class="badge badge-success"      onclick="SelectText(\'comments_copy\'); document.execCommand(\'copy\');"      data-inline="true">Copy to clipboard</span><span id="comments_copy"><h2 style="margin:5 0 0 0">Report for \''+model.mresults()[a].name()+"' firmware:</h2><br><ul>"+b+"</ul></span>";return show_popup1_content("Comments",b)}function show_popup1_content(b,a){$("#popup1").modal("show");$("#popup1title").html(b);$("#popup1div").html(a);$("#popup1div").enhanceWithin()}function show_popup2_content(b,a){$("#popup2").modal("show");$("#popup2title").html(b);$("#popup2div").html(a);$("#popup2div").enhanceWithin()};