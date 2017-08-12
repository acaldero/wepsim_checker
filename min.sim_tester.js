function wt_dataModel(){var a=this;a.asm_test=ko.observable(""),a.checklist=ko.observable(""),a.mfiles=ko.observableArray([]),a.addFile=function(v,u,t,s,r,q,p,o,n,m,l){this.mfiles.push({name:ko.observable(v),LF:ko.observable(u),RL:ko.observable(t),BF:ko.observable(s),RUC:ko.observable(r),EF:ko.observable(q),RE:ko.observable(p),XF:ko.observable(o),RX:ko.observable(n),CF:ko.observable(m),RC:ko.observable(l)});$("#pbar1").attr("aria-valuemax",this.mfiles().length)}}function wt_load_files(b,f,d){mfiles=document.getElementById(b).files;var a=new Array();for(var c=0;c<mfiles.length;c++){a[c]=new FileReader();a[c].index=c;a[c].onload=function(g){model.addFile(mfiles[this.index].name,g.target.result,"0","","NONE","","NONE","","NONE","","NONE")};a[c].readAsText(mfiles[c],"UTF-8")}if(document.getElementById(f).files.length>0){var e=document.getElementById(f).files[0];var a=new FileReader();a.onload=function(g){model.asm_test(g.target.result)};a.readAsText(e,"UTF-8")}if(document.getElementById(d).files.length>0){var e=document.getElementById(d).files[0];var a=new FileReader();a.onload=function(g){model.checklist(g.target.result)};a.readAsText(e,"UTF-8")}}function execute_asm_and_firmware(c){init("","","","");reset();var f=sim_states.REG_PC.value;var e=sim_states.REG_PC.value-4;var h=0;if((typeof segments[".text"]!="undefined")&&(typeof segments[".text"].begin!="undefined")){h=parseInt(segments[".text"].begin)}var d=0;if((typeof segments[".text"]!="undefined")&&(typeof segments[".text"].end!="undefined")){d=parseInt(segments[".text"].end)}var b=0;if((typeof segments[".ktext"]!="undefined")&&(typeof segments[".ktext"].begin!="undefined")){b=parseInt(segments[".ktext"].begin)}var g=0;if((typeof segments[".ktext"]!="undefined")&&(typeof segments[".ktext"].end!="undefined")){g=parseInt(segments[".ktext"].end)}var a=true;while((a)&&(f!=e)&&(((f<d)&&(f>=h))||((f<g)&&(f>=b)))){a=execute_microprogram(c);e=f;f=sim_states.REG_PC.value}return a}function add_comment(c,a,d){model.mfiles()[c].CF(model.mfiles()[c].CF()+d+"<br><br>");var b=model.mfiles()[c].RC();if(b=="NONE"){model.mfiles()[c].RC("<ul><li>"+a+"</li></ul>");return}b=b.replace("</li></ul>","</li>");model.mfiles()[c].RC(b+"<li>"+a+"</li></ul>")}function execute_firmwares_and_asm_i(m,f,o,d){var c=parseInt($("#pbar1").attr("aria-valuemax"));var l=Math.trunc(100*d/c);$("#pbar1").attr("aria-valuenow",d);$("#pbar1").html(l+"%");$("#pbar1").css("width",l+"%");if(d>=c){return}var b=model.mfiles().length;if(b==0){return}var n=model.mfiles()[d].LF();var a=loadFirmware(n);model.mfiles()[d].BF(JSON.stringify(a));if(a.error!=null){model.mfiles()[d].RUC("1");add_comment(d,"firmware error:"+a.error.split("(*)")[1],a.error);setTimeout(function(){execute_firmwares_and_asm_i(m,f,o,d+1)},120);return}model.mfiles()[d].RUC("0");update_memories(a);var e=simlang_compile(o,m);model.mfiles()[d].EF(JSON.stringify(e,null,2));model.mfiles()[d].RE("0");if(e.error!=null){model.mfiles()[d].RE("1");add_comment(d,"assembly error:"+e.error.split("(*)")[1],e.error);setTimeout(function(){execute_firmwares_and_asm_i(m,f,o,d+1)},120);return}set_simware(e);update_memories(m);var k=execute_asm_and_firmware(2048);var j=wepsim_current2state();var h=wepsim_diff_results(f,j);if(h.errors!=0){add_comment(d,"execution error:"+wepsim_checkreport2txt(h.result),JSON.stringify(h.result,null,2))}if(k==false){var g="more than 2048 clock cycles in one single instruction.";add_comment(d,"execution error: "+g+"<br>",g);model.mfiles()[d].XF("<pre>ERROR: "+g+"</pre><br>"+JSON.stringify(h.result,null,2));model.mfiles()[d].RX(h.errors+1)}else{model.mfiles()[d].XF(JSON.stringify(h.result,null,2));model.mfiles()[d].RX(h.errors)}setTimeout(function(){execute_firmwares_and_asm_i(m,f,o,d+1)},120)}function execute_firmwares_and_asm(d,c){var a=get_simware();var b=wepsim_checklist2state(d);execute_firmwares_and_asm_i(a,b,c,0)}function show_firm_origin(a){var b=model.mfiles()[a].LF();if(b==""){return show_popup1_content("Firmware","<br><pre>ERROR: Empty firmware.</pre><br>")}show_popup1_content("Firmware","Loading, please wait...");setTimeout(function(){var c='<div style="overflow:auto; height:65vh;"><pre>'+b+"</pre><div>";show_popup1_content("Firmware",c)},50)}function show_firm_result(a){var c=model.mfiles()[a].BF();if(c==""){return show_popup1_content("Firmware","<h1>Empty.</h1>")}var b=JSON.parse(c);if(b.error!=null){return show_popup1_content("Firmware","<br><pre>"+b.error+"</pre><br>")}show_popup1_content("Firmware","Loading, please wait...");setTimeout(function(){var d=firmware2html(b.firmware,false);show_popup1_content("Firmware",d)},50)}function show_asm_result(a){var c=model.mfiles()[a].EF();if(c==""){return show_popup1_content("Assembly","<h1>Empty.</h1>")}var b=JSON.parse(c);if(b.error!=null){return show_popup1_content("Assembly","<br><pre>"+b.error+"</pre><br>")}var d="<div class='row'><div class='col-xs-3 col-sm-3'><center><h3>Memory map</h3></center><div id='cc_map' style='overflow-y:scroll; overflow-x:auto; max-height:55vh;'>   <div id='compile_mm'>"+segments2html(b.seg)+"</div></div></div><div class='col-xs-9 col-sm-9'><center><h3>Main memory</h3></center><div id='cc_bin' style='overflow-y:scroll; overflow-x:auto; max-height:55vh;'>   <div id='compile_mp'>"+mp2html(b.mp,b.labels2,b.seg)+"</div></div></div></div>";show_popup1_content("Assembly",d);for(skey in b.seg){$("#compile_begin_"+skey).html("0x"+b.seg[skey].begin.toString(16));$("#compile_end_"+skey).html("0x"+b.seg[skey].end.toString(16))}$("#popup1div").enhanceWithin()}function show_checklist_result(b){var c=model.mfiles()[b].XF();if(c==""){return show_popup1_content("Checklist","<h1>Empty.</h1>")}var a=JSON.parse(c);if(a.error!=null){return show_popup1_content("Checklist","<br><pre>"+a.error+"</pre><br>")}show_popup1_content("Checklist","Loading, please wait...");setTimeout(function(){var d=wepsim_checkreport2html(a,false);show_popup1_content("Checklist",d)},50)}function show_comments_result(a){var b=model.mfiles()[a].RC();if((b=="")||(b==null)){return show_popup1_content("Comments","<h1>Empty.</h1>")}show_popup1_content("Comments",b)}function show_popup1_content(b,a){$("#popup1").modal("show");$("#popup1title").html(b);$("#popup1div").html(a);$("#popup1div").enhanceWithin()};