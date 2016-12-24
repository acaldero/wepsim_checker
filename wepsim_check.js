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
    //  WepSIM check API
    //

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

    function checkreport2txt ( checklist )
    {
        var o = "";

        for (var i=0; i<checklist.length; i++)
        {
             if (checklist[i].equals === false) {
                 o += checklist[i].elto_type + "[" + checklist[i].elto_id + "]='" + 
                      checklist[i].obtained + "' (expected '" + checklist[i].expected  + "'), ";
             }
        }

        return o;
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

