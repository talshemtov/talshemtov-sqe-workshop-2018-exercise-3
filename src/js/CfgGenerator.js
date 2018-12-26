const esgraph = require('esgraph');
import Viz from 'viz.js';

let createGraph = function(sourceCode, parsedCode, args) {
    const cfg = esgraph(parsedCode.body[0].body);
    const dot = esgraph.dot(cfg, {counter:0, source: sourceCode});
    let finalDot = handleDot(dot, args);
    return Viz('digraph { ' + finalDot + ' }');
};

let handleDot = function(dot, args) {
    dot = removeExceptionEdges(dot);
    let graphDescriptionLines = dot.split('\n');
    for (let i=0; i<graphDescriptionLines.length; i++) {
        if (isCurrentAndNextNodeVarDec(graphDescriptionLines[i], graphDescriptionLines[i+1])) {
            concatNodesAndRemoveEdge(graphDescriptionLines, i);
            i--;
        }
    }
    removeLets(graphDescriptionLines);
    changeAllToBoxShape(graphDescriptionLines);
    getDecisionNodesAndChangeToDiamondShape(graphDescriptionLines);
    addNumberToNodeLabel(graphDescriptionLines);
    colorGraph(graphDescriptionLines, args);
    return concatArrayToString(graphDescriptionLines);
};

let colorGraph = function(arr, args) {

};

let changeAllToBoxShape = function(arr) {
    for (let i=0; i<arr.length; i++) {
        if (arr[i].includes('->')) {
            break;
        } else {
            changeShape(arr, i, 'box');
        }
    }
};

let removeLets = function(arr) {
    for (let i=0; i<arr.length; i++) {
        if (getNodeLabel(arr[i]).substring(0,4) === 'let ') {
            arr[i] = arr[i].replace(getNodeLabel(arr[i]), getNodeLabel(arr[i]).substring(4));
        }
    }
};

let concatNodesAndRemoveEdge = function(arr, i) {
    let newNodeLabel = getNodeLabel(arr[i]) + '\n' + getNodeLabel(arr[i+1]).substring(4);
    let edgeToReplace = 'n' + getNodeNumberAtArrCell(arr[i]) + ' -> n' + getNodeNumberAtArrCell(arr[i+1]) + ' []';
    let edgeToRemove = 'n' + getNodeNumberAtArrCell(arr[i+1]) + ' -> n' + getNodeNumberAtArrCell(arr[i+2]) + ' []';
    arr[i] = arr[i].replace(getNodeLabel(arr[i]), newNodeLabel);
    arr.splice(i+1, 1);
    for (let j=0; j<arr.length; j++) {
        if(arr[j]===edgeToReplace) {
            arr[j] = 'n' + getNodeNumberAtArrCell(arr[i]) + ' -> n' + getNodeNumberAtArrCell(arr[i+2]) + ' []';
        } else if (arr[j] === edgeToRemove) {
            arr.splice(j, 1);
        }
    }
};

let changeShape = function(arr, i, shape) {
    let nodeUpToBracket = arr[i].substring(0, arr[i].indexOf(']'));
    arr[i] = nodeUpToBracket + ', shape = "' + shape + '"]';
};

let addNumberToNodeLabel = function(arr) {
    for(let i=0; i<arr.length; i++) {
        if(arr[i].includes('->')) {
            break;
        } else {
            arr[i] = arr[i].replace(getNodeLabel(arr[i]), '('+i+')\n' + getNodeLabel(arr[i]));
        }
    }
};

let getDecisionNodesAndChangeToDiamondShape = function(arr) {
    let decisionNodes = [];
    for (let i=0; i<arr.length; i++) {
        if(arr[i].includes('->')) {
            if (getNodeLabel(arr[i]) === 'true') {
                decisionNodes.push(getNodeNumberAtArrCell(arr[i]));
            }
        }
    }
    changeDecisionNodesShapes(decisionNodes, arr);
};

let changeDecisionNodesShapes = function(decisionNodes, arr) {
    for (let i=0; i<decisionNodes.length; i++) {
        for(let j=0; j<arr.length; j++) {
            if (getNodeNumberAtArrCell(arr[j]) === decisionNodes[i]) {
                arr[j] = arr[j].replace('box', 'diamond');
            }
        }
    }
};

let getNodeNumberAtArrCell = function(line) {
    return line.substring(1,2);
};

let isCurrentAndNextNodeVarDec = function(current, next){
    return getNodeLabel(current).substring(0, 4) === 'let ' &&
        getNodeLabel(next).substring(0, 4) === 'let ';
};

let removeExceptionEdges = function(dot) {
    let dotArray = dot.split('\n');
    for (let i=0; i<dotArray.length; i++) {
        if(getNodeLabel(dotArray[i]) === 'exception') {
            dotArray.splice(i, 1);
        }
    }
    return concatArrayToString(dotArray);
};

let concatArrayToString = function(arr) {
    let ans = '';
    for (let i=0; i<arr.length; i++) {
        ans += arr[i].toString()+'\n';
    }
    return ans;
};

let getNodeLabel = function(string) {
    return string.substring(string.indexOf('label=')+7, //returns the string after '...label="'
        string.indexOf('label=')+7+
        string.substring(string.indexOf('label')+7).indexOf('"')); //how many chars between 'label="' to the last '"'
};

export {createGraph};