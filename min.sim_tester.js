function wt_dataModel(){var a=this;a.asm_test=ko.observableArray([]);a.addAsm=function(d,c){this.asm_test.push({name:d,content:c})};a.checklist=ko.observableArray([]);a.checklist_bin=new Array();a.addCheck=function(e,d){var f=wepsim_checklist2state(d);this.checklist.push({name:e,content:d});this.checklist_bin.push({name:e,content:f})};a.mfiles=new Array();a.addMicro=function(d,c){this.mfiles.push({name:d,content:c})};a.mresults=ko.observableArray([]);a.addResult=function(t,s,r,q,p,o,n,m,l,k){this.mresults.push({name:ko.observable(t),RL:s,BF:r,RUC:ko.observable(q),EF:p,RE:ko.observableArray(o),XF:n,RX:ko.observableArray(m),CF:l,RC:ko.observable(k)});$("#pbar1").attr("aria-valuemax",this.mresults().length)}}function wt_load_files(g,b,e){var q=document.getElementById(g).files;var p=document.getElementById(b).files;var o=document.getElementById(e).files;model.mresults.removeAll();model.mfiles=new Array();model.asm_test.removeAll();model.checklist.removeAll();model.checklist_bin=new Array();for(var l=0;l<q.length;l++){var n=new Array();var m=new Array();for(var k=0;k<p.length;k++){n.push(ko.observable("NONE"));m.push(ko.observable("NONE"))}model.addResult("Loading microcode file name...","0","","NONE",new Array(""),n,new Array(""),m,new Array(),"NONE")}var d=new Array();for(var l=0;l<q.length;l++){d[l]=new FileReader();d[l].index=l;d[l].onload=function(f){model.addMicro(q[this.index].name,f.target.result);model.mresults()[this.index].name(q[this.index].name)};d[l].readAsText(q[l],"UTF-8")}var c=new Array();for(var l=0;l<p.length;l++){c[l]=new FileReader();c[l].index=l;c[l].onload=function(f){model.addAsm(p[this.index].name,f.target.result)};c[l].readAsText(p[l],"UTF-8")}var a=new Array();for(var l=0;l<o.length;l++){a[l]=new FileReader();a[l].index=l;a[l].onload=function(f){model.addCheck(o[this.index].name,f.target.result)};a[l].readAsText(o[l],"UTF-8")}}function execute_asm_and_firmware(c){init("","","","");reset();var f=sim_states.REG_PC.value;var e=sim_states.REG_PC.value-4;var h=0;if((typeof segments[".text"]!="undefined")&&(typeof segments[".text"].begin!="undefined")){h=parseInt(segments[".text"].begin)}var d=0;if((typeof segments[".text"]!="undefined")&&(typeof segments[".text"].end!="undefined")){d=parseInt(segments[".text"].end)}var b=0;if((typeof segments[".ktext"]!="undefined")&&(typeof segments[".ktext"].begin!="undefined")){b=parseInt(segments[".ktext"].begin)}var g=0;if((typeof segments[".ktext"]!="undefined")&&(typeof segments[".ktext"].end!="undefined")){g=parseInt(segments[".ktext"].end)}var a=true;while((a)&&(f!=e)&&(((f<d)&&(f>=h))||((f<g)&&(f>=b)))){a=execute_microprogram(c);e=f;f=sim_states.REG_PC.value}return a}function add_comment(d,b,e,a){model.mresults()[d].CF.push("<li>"+b+":</li><br><ul>"+a+"</ul><br>");var c=model.mresults()[d].RC();if(c=="NONE"){model.mresults()[d].RC("<ul><li>"+b+": "+e+"</li></ul>");return}c=c.replace("</li></ul>","</li>");model.mresults()[d].RC(c+"<li>"+b+": "+e+"</li></ul>")}function execute_firmwares_and_asm_ij(p,r,g,e,c){var d=parseInt($("#pbar1").attr("aria-valuemax"));var n=Math.trunc(100*e/d);$("#pbar1").attr("aria-valuenow",e);$("#pbar1").html(n+"%");$("#pbar1").css("width",n+"%");var o=model.mresults().length;if(o==0){return}if(e>=o){return}if(c>=g.length){setTimeout(function(){execute_firmwares_and_asm_ij(p,r,g,e+1,0)},120);return}var q=model.mfiles[e].content;var b=loadFirmware(q);model.mresults()[e].BF=JSON.stringify(b);if(b.error!=null){model.mresults()[e].RUC("1");add_comment(e,"firmware error",b.error.split("(*)")[1],b.error);setTimeout(function(){execute_firmwares_and_asm_ij(p,r,g,e,c+1)},120);return}model.mresults()[e].RUC("0");update_memories(b);var f=simlang_compile(g[c].content,p);model.mresults()[e].EF[c]=JSON.stringify(f,null,2);model.mresults()[e].RE()[c]("0");if(f.error!=null){model.mresults()[e].RE()[c]("1");add_comment(e,"assembly error",f.error.split("(*)")[1],f.error);setTimeout(function(){execute_firmwares_and_asm_ij(p,r,g,e,c+1)},120);return}set_simware(f);update_memories(p);var a=2048;var m=execute_asm_and_firmware(a);var l=wepsim_current2state();var k=wepsim_diff_results(r[c].content,l);if(k.errors!=0){add_comment(e,"execution error",wepsim_checkreport2txt(k.result),wepsim_checkreport2html(k.result,true))}if(m==false){var h="more than "+a+" clock cycles in one single instruction.";add_comment(e,"execution error",h+"<br>",h);model.mresults()[e].XF[c]="<pre>ERROR: "+h+"</pre><br>"+JSON.stringify(k.result,null,2);model.mresults()[e].RX()[c](k.errors+1)}else{model.mresults()[e].XF[c]=JSON.stringify(k.result,null,2);model.mresults()[e].RX()[c](k.errors)}setTimeout(function(){execute_firmwares_and_asm_ij(p,r,g,e,c+1)},120)}function execute_firmwares_and_asm(c,b){var a=get_simware();execute_firmwares_and_asm_ij(a,c,b,0,0)}function show_firm_origin(a){var b="";if(typeof model.mfiles[a]!="undefined"){b=model.mfiles[a].content}if(b==""){return show_popup1_content("Firmware","<br><pre>ERROR: Empty firmware.</pre><br>")}show_popup1_content("Firmware","Loading, please wait...");setTimeout(function(){var c='<div style="overflow:auto; height:65vh;"><pre>'+b+"</pre><div>";show_popup1_content("Firmware",c)},50)}function show_firm_result(a){var c=model.mresults()[a].BF;if(c==""){return show_popup1_content("Firmware","<h1>Empty.</h1>")}var b=JSON.parse(c);if(b.error!=null){return show_popup1_content("Firmware","<br><pre>"+b.error+"</pre><br>")}show_popup1_content("Firmware","Loading, please wait...");setTimeout(function(){var d=firmware2html(b.firmware,false);show_popup1_content("Firmware",d)},50)}function show_asm_origin(b){var a="";if(typeof model.asm_test()[b]!="undefined"){a=model.asm_test()[b].content}if(a==""){return show_popup1_content("Assembly code","<br><pre>ERROR: Empty assembly code.</pre><br>")}show_popup2_content("Assembly code","Loading, please wait...");setTimeout(function(){var c='<div class="form-group" style="height:55vh;"><input type=hidden id="todo2" value="model.asm_test()['+b+'].content = $(\'#content\').val();"><textarea class="form-control"           id="content"           style="overflow:auto;">'+a+"</textarea></div>";show_popup2_content("Assembly code",c)},50)}function show_asm_result(b,a){var d="";if(typeof model.mresults()[b]!="undefined"){d=model.mresults()[b].EF[a]}if(d==""){return show_popup1_content("Assembly","<h1>Empty.</h1>")}var c=JSON.parse(d);if(c.error!=null){return show_popup1_content("Assembly","<br><pre>"+c.error+"</pre><br>")}var e="<div class='row'><div class='col-xs-3 col-sm-3'><center><h3>Memory map</h3></center><div id='cc_map' style='overflow-y:scroll; overflow-x:auto; max-height:55vh;'>   <div id='compile_mm'>"+segments2html(c.seg)+"</div></div></div><div class='col-xs-9 col-sm-9'><center><h3>Main memory</h3></center><div id='cc_bin' style='overflow-y:scroll; overflow-x:auto; max-height:55vh;'>   <div id='compile_mp'>"+mp2html(c.mp,c.labels2,c.seg)+"</div></div></div></div>";show_popup1_content("Assembly",e);for(skey in c.seg){$("#compile_begin_"+skey).html("0x"+c.seg[skey].begin.toString(16));$("#compile_end_"+skey).html("0x"+c.seg[skey].end.toString(16))}$("#popup1div").enhanceWithin()}function show_checklist_origin(a){var b="";if(typeof model.checklist()[a]!="undefined"){b=model.checklist()[a].content}if(b==""){return show_popup1_content("Checklist","<br><pre>ERROR: Empty checklist.</pre><br>")}show_popup2_content("Checklist","Loading, please wait...");setTimeout(function(){var c='<div class="form-group" style="height:55vh;"><input type=hidden id="todo2" value="model.checklist()['+a+'].content = $(\'#content\').val();"><textarea class="form-control"           id="content"           style="overflow:auto;">'+b+"</textarea></div>";show_popup2_content("Checklist",c)},50)}function show_checklist_result(c,b){var d="";if(typeof model.mresults()[c]!="undefined"){d=model.mresults()[c].XF[b]}if(d==""){return show_popup1_content("Checklist","<h1>Empty.</h1>")}var a=JSON.parse(d);if(a.error!=null){return show_popup1_content("Checklist","<br><pre>"+a.error+"</pre><br>")}show_popup1_content("Checklist","Loading, please wait...");setTimeout(function(){var e=wepsim_checkreport2html(a,false);show_popup1_content("Checklist",e)},50)}function show_comments_result(a){var b="";if(typeof model.mresults()[a]!="undefined"){b=model.mresults()[a].CF.join("\n")}if(b==""){return show_popup1_content("Comments","<h1>Empty.</h1>")}b='<span class="badge badge-success"      onclick="SelectText(\'comments_copy\'); document.execCommand(\'copy\');"      data-inline="true">Copy to clipboard</span><span id="comments_copy"><h2 style="margin:5 0 0 0">Report for \''+model.mresults()[a].name()+"' firmware:</h2><br><ul>"+b+"</ul></span>";return show_popup1_content("Comments",b)}function show_popup1_content(b,a){$("#popup1").modal("show");$("#popup1title").html(b);$("#popup1div").html(a);$("#popup1div").enhanceWithin()}function show_popup2_content(b,a){$("#popup2").modal("show");$("#popup2title").html(b);$("#popup2div").html(a);$("#popup2div").enhanceWithin()};