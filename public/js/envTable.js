/*******************************************************************************
 * Copyright 2017 IBM Corp.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 ******************************************************************************/

// Table for displaying environmental parameters

var request = "http://" + myurl + "/envRequest";

d3.select('#envDiv').append('p')
    .style("font-size", "18px")
    .style("padding-left", "15px")
    .style("padding-top", "15px")
    .style("padding-bottom", "5px")
    .text("Environment");
var paragraph = d3.select('#envDiv').append('p')
    .style("padding-left", "15px")
var table = paragraph.append('table')
    .style("font-size", "14px");
var thead = table.append('thead')
var tbody = table.append('tbody');

function populateEnvTable() {
    socket.on('environment', function (envRequest){
        data = JSON.parse(envRequest);
        if (data == null) return
        function tabulate(data) {
            // create a row for each object in the data
            var rows = tbody.selectAll('tr')
                .data(data)
                .enter()
                .append('tr');

            // create a cell in each row for each column
            var cells = rows.selectAll('td')
                .data(function (row) {
                    return ['Parameter', 'Value'].map(function (column) {
                        return {column: column, value: row[column]};
                    });
                })
                .enter()
                .append('td')
                .text(function (d) { return d.value; });
	
            return table;
        }
	
        // render the table(s)
        tabulate(data); // 2 column table

    });
}

populateEnvTable()

