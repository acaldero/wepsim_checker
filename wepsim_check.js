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


