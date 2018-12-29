import $ from 'jquery';
import {parseCode} from './code-analyzer';
import {parseCodeForTable} from './code-analyzer';
import {startSymbolicSub, tableAfterSub} from './SymbolicSubstitutioner';
// import {colorCode} from './ColorCode';
import {createGraph} from './CfgGenerator';


$(document).ready(function () {

    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let args = $('#argumentsPlaceholder').val();
        let parsedCode = parseCode(codeToParse);
        let table = parseCodeForTable(parsedCode);
        let substituted=startSymbolicSub(codeToParse, table, args);
        let graph = createGraph(codeToParse, parsedCode, args, table, substituted);
        // createTable(table);

        // let str = colorCode(substituted, args, tableAfterSub);
        // let element = document.createElement('pre');
        // element.setAttribute('contenteditable', 'true');
        // element.innerHTML = str;
        let node = document.getElementById('diagram');
        while (node.firstChild) {
            node.removeChild(node.firstChild);
        }
        let element = document.createElement('div');
        element.innerHTML = graph;
        document.getElementById('diagram').appendChild(element);
    });
});

function createTable(tableData) {
    if(document.getElementById('table') != null) {
        document.getElementById('table').remove();
    }
    const table = document.createElement('table');
    table.setAttribute('id', 'table');
    const tableBody = document.createElement('tbody');
    tableData.forEach(function(rowData) {
        let row = document.createElement('tr');
        rowData.forEach(function(cellData) {
            let cell = document.createElement('td');
            cell.appendChild(document.createTextNode(cellData));
            row.appendChild(cell);
        });
        tableBody.appendChild(row);});
    table.setAttribute('border','1');
    table.appendChild(tableBody);
    document.body.appendChild(table);
}

Element.prototype.remove = function() {
    this.parentElement.removeChild(this);
};
NodeList.prototype.remove = HTMLCollection.prototype.remove = function() {
    for(let i = this.length - 1; i >= 0; i--) {
        if(this[i] && this[i].parentElement) {
            this[i].parentElement.removeChild(this[i]);
        }
    }
};