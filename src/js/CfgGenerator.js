import {colorCode, mapRowToColor} from './ColorCode';
import esgraph from 'esgraph';


let createGraph = function(sourceCode, parsedCode, args, table, substitutedCode) {
    let cfg = esgraph(parsedCode.body[0].body);
    let dot = esgraph.dot(cfg, {counter:0, source: sourceCode});
    return handleDot(dot, args, table, substitutedCode, sourceCode);
    // return Viz('digraph { ' + finalDot + ' }');
};

let handleDot = function(dot, args, table, substitutedCode, sourceCode) {
    dot = removeExceptionEdges(dot);
    let graphDescriptionLines = dot.split('\n');
    graphDescriptionLines = removeEntryAndExit(graphDescriptionLines);
    for (let i=0; i<graphDescriptionLines.length; i++) {
        if (isCurrentAndNextNodeVarDec(graphDescriptionLines[i], graphDescriptionLines[i+1])) {
            concatNodesAndRemoveEdge(graphDescriptionLines, i);
            i--;
        }
    }
    removeLets(graphDescriptionLines);
    removeEmptyCells(graphDescriptionLines);
    changeAllToBoxShape(graphDescriptionLines);
    getDecisionNodesAndChangeToDiamondShape(graphDescriptionLines);
    addNumberToNodeLabel(graphDescriptionLines);
    colorCode(substitutedCode, args, table);
    colorGraph(graphDescriptionLines, getDecisionNodesColors(graphDescriptionLines), sourceCode);
    return concatArrayToString(graphDescriptionLines);
};

let getDecisionNodesColors = function(graph) {
    let ifCounter = 0;
    let mapNodeToColor = []; //maps node number to color
    for (let i=0; i<graph.length; i++) {
        if (graph[i].includes('diamond')) {
            mapNodeToColor.push([getNodeNumberAtArrCell(graph[i]), mapRowToColor[ifCounter][1]]);
            ifCounter++;
        }
    }
    return mapNodeToColor;
};

let removeEmptyCells = function(arr){
    let toRemove = [];
    for(let i=0; i<arr.length; i++) {
        if(arr[i]==='') {
            toRemove.push(i);
        }
    }
    removeItemsFromArr(arr, toRemove);
};

let removeEntryAndExit = function(arr) {
    arr.splice(0,1);
    let entryEdge = 'n0 -> n1 []';
    let exitNode = 'n'+getExitNodeNumber(arr);
    let toRemove = [];
    for (let i=0; i<arr.length; i++) {
        if (arr[i] === entryEdge ||
            arr[i].includes('-> ' + exitNode) ||
            getNodeLabel(arr[i])==='exit') {
            toRemove.push(i);
        }
    }
    return removeItemsFromArr(arr, toRemove);
};

let removeItemsFromArr = function(arr, toRemove) {
    for (let i=0; i<toRemove.length; i++) {
        arr.splice(toRemove[i]-i,1);
    }
    return arr;
};

let getExitNodeNumber = function(arr) {
    for(let i=0; i<arr.length; i++) {
        if(getNodeLabel(arr[i]) === 'exit') {
            return getNodeNumberAtArrCell(arr[i]);
        }
    }
};

let colorGraph = function(arr, mapDecisionNodeToColor, sourceCode) {
    let currentNodeLineNameCell = [arr[0], 'n'+getNodeNumberAtArrCell(arr[0]), 0];
    let sortedConditions = sortConditions(sourceCode, arr);
    let coloredCells = [];
    while (currentNodeLineNameCell[1] != -1 && currentNodeLineNameCell[1]!= undefined) {
        let nameAndCell;
        if (currentNodeLineNameCell[0].includes('box')) {
            changeColor(arr, currentNodeLineNameCell[2], 'green');
            nameAndCell = getNextNodeNameAndCellNone(arr, currentNodeLineNameCell[1]);
        } else {
            nameAndCell = colorConditions(arr, currentNodeLineNameCell, mapDecisionNodeToColor, sortedConditions);
        }
        if (nameAndCell[1] != undefined) {
            nameAndCell = checkIfNodeIsColoredFromLoop(nameAndCell, arr, coloredCells);
        }
        currentNodeLineNameCell = [arr[nameAndCell[1]], nameAndCell[0], nameAndCell[1]];
    }
};

let checkIfNodeIsColoredFromLoop = function(nameAndCell, arr, coloredCells) {
    let isColored = arr[nameAndCell[1]].includes('fillcolor');
    if(!isColored) {
        coloredCells.push(nameAndCell[0]);
    } else {
        while (isColored) {
            nameAndCell = getNextNodeNameAndCellTrueFalse(arr, nameAndCell[0], 'false');
            if(nameAndCell === -1){
                break;
            }
            isColored = checkIfNewNodeIsColored(coloredCells, nameAndCell[0]);
        }
    }
    return nameAndCell;
};

let checkIfNewNodeIsColored = function(coloredCells, name) {
    for (let i=0; i<coloredCells.length; i++) {
        if (coloredCells[i]===name) {
            return true;
        } else {
            continue;
        }
    }
    return false;
};

let colorConditions = function(arr, currentNodeLineNameCell, mapDecisionNodeToColor, sortedConditions) {
    let nameAndCell = [];
    changeColor(arr, currentNodeLineNameCell[2], 'green');
    if (getNodeColor(mapDecisionNodeToColor, currentNodeLineNameCell[0], sortedConditions) === 'green') {
        nameAndCell = getNextNodeNameAndCellTrueFalse(arr, currentNodeLineNameCell[1], 'true');
    } else {
        nameAndCell = getNextNodeNameAndCellTrueFalse(arr, currentNodeLineNameCell[1], 'false');
    }
    return nameAndCell;
};

let getNodeColor = function(mapNodeToColor, nodeLine, sortedConditions) {
    for (let i=0; i<sortedConditions.length; i++) {
        if (sortedConditions[i] === nodeLine) {
            return mapNodeToColor[i][1];
        }
    }
};

let getNextNodeNameAndCellNone = function(arr, currentNodeName) {
    for(let i=0; i<arr.length; i++) {
        if (arr[i].includes(currentNodeName + ' ->')) {
            let nodeName = getNodeAfterArrow(arr[i]);
            return [nodeName, getNodeCell(nodeName, arr)];
        }
    }
    return -1;
};

let getNodeCell = function(nodeName, arr) {
    for(let i=0; i<arr.length; i++) {
        if (arr[i].substring(0, nodeName.length) === nodeName) {
            return i;
        }
    }
};

let getNextNodeNameAndCellTrueFalse = function(arr, currentNodeName, trueOrFalse) {
    for(let i=0; i<arr.length; i++) {
        if (arr[i].includes(currentNodeName + ' ->') &&
            arr[i].includes(trueOrFalse)) {
            let nodeName = getNodeAfterArrow(arr[i]);
            return [nodeName, getNodeCell(nodeName, arr)];
        }
    }
    return -1;
};


let getNodeAfterArrow = function(line) {
    let afterArrow = line.substring(line.indexOf('>') + 2);
    return afterArrow.substring(0, afterArrow.indexOf(' '));
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
    replaceAndRemoveEdges(arr, i, edgeToReplace, edgeToRemove);
};

let replaceAndRemoveEdges = function(arr, i, edgeToReplace, edgeToRemove){
    for (let j=0; j<arr.length; j++) {
        if(arr[j]===edgeToReplace) {
            if (shouldReplaceEdge(arr, i)) {
                arr[j] = 'n' + getNodeNumberAtArrCell(arr[i]) + ' -> n' + getNodeNumberAtArrCell(arr[i+1]) + ' []';
            } else {
                arr.splice(j, 1);
            }
        } else if (arr[j] === edgeToRemove) {
            arr.splice(j, 1);
        }
    }
};

let shouldReplaceEdge = function(arr, i){
    return getNodeNumberAtArrCell(arr[i+1]) != '' && getNodeNumberAtArrCell(arr[i]) != getNodeNumberAtArrCell(arr[i+1]);
};

let changeShape = function(arr, i, shape) {
    let nodeUpToBracket = arr[i].substring(0, arr[i].lastIndexOf(']'));
    arr[i] = nodeUpToBracket + ', shape = "' + shape + '"]';
};

let changeColor = function(arr, i, color) {
    let nodeUpToBracket = arr[i].substring(0, arr[i].lastIndexOf(']'));
    arr[i] = nodeUpToBracket + ' style="filled" fillcolor = "' + color + '"]';
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
    return line.substring(1, line.indexOf(' '));
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

let sortConditions = function(sourceCode, graph) {
    let sourceCodeArr = sourceCode.split('\n');
    let decisionNodes = getDecisionNodes(graph);
    let sortedConditionNodes = []; //nodes of graph in the order of the code
    // let usedConditionsInCode = []; //lines in the code that have been matched to a node
    for (let i=0; i<sourceCodeArr.length; i++) {
        for (let j=0; j<decisionNodes.length; j++) {
            let label = getNodeLabel(decisionNodes[j]);
            label = label.substring(label.indexOf(')')+2);
            if (sourceCodeArr[i].includes('('+label+')')) {
                sortedConditionNodes.push(decisionNodes[j]);
            }
        }
    }
    return sortedConditionNodes;
};

let getDecisionNodes= function(graph) {
    let decisionNodes = [];
    for (let i=0; i<graph.length; i++) {
        if (graph[i].includes('diamond')) {
            decisionNodes.push(graph[i]);
        }
    }
    return decisionNodes;
};

export {createGraph};
export {concatArrayToString};
export {getNodeLabel};
export {getNodeNumberAtArrCell};
export {getNodeAfterArrow};
export {changeShape};
export {changeColor};
export {addNumberToNodeLabel};
export {checkIfNewNodeIsColored};