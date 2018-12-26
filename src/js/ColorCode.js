let innerHTML = '';
let clearInnerHTML = function() {
    innerHTML = '';
};

let colorCode = function (codeToColor, argsString, table) {
    let splittedArgs = getSplittedArgs(argsString);
    let argNames = getArgNames(table, splittedArgs.length);
    let mapRowToColor=[];
    let assignmentString = getAssignmentString(argNames, splittedArgs);
    for(let i=0; i<table.length; i++) {
        if(table[i][1]==='IfStatement' || table[i][1]==='Else IfStatement') {
            let strToEval = assignmentString+ ' ' + table[i][3] + ';';
            if(eval(strToEval)) {
                mapRowToColor.push([table[i][5],'green']);
            } else {
                mapRowToColor.push([table[i][5],'red']);
            }
        } else {
            checkIfShouldChangeAssignmentString(splittedArgs, table[i], argNames, assignmentString);
            assignmentString = getAssignmentString(argNames, splittedArgs);
        }
    }
    return printColor(mapRowToColor, codeToColor);
};

let checkIfShouldChangeAssignmentString = function(splittedArgs, tableRow, argNames, assignmentString) {
    if(tableRow[1] ==='AssignmentExpression') {
        for (let i=0; i<argNames.length; i++) {
            if(tableRow[2].includes(argNames[i])) {
                replaceValue(tableRow, splittedArgs, i, assignmentString, argNames);
            }
        }
        return getAssignmentString(argNames, splittedArgs);
    }
};

let replaceValue = function(tableRow, splittedArgs, i, assignmentString, argNames) {
    if(tableRow[2].includes('[')) {
        // let index = tableRow[2].substring(tableRow[2].indexOf('[')+1, tableRow[2].indexOf(']'));
        let current = splittedArgs[i];
        let newValInIndex = eval(assignmentString + tableRow[4]);
        splittedArgs[i] = '['+eval('let '+argNames[i]+' ='+current + ';'+tableRow[2] + '=' + newValInIndex + ';' + argNames[i]).toString() + ']';
        return splittedArgs;
    } else {
        splittedArgs[i] = eval(assignmentString + tableRow[4]);
    }
};

let getSplittedArgs = function(argsString) {
    let final = [];
    for(let char=0; char<argsString.length; char++) {
        if (argsString[char]!=',' && argsString[char]!='[') {
            let lastIndex = argsString.substring(char).indexOf(',');
            if (lastIndex===-1) {
                lastIndex = argsString.substring(char).lastIndexOf('');
            }
            final.push(argsString.substring(char, char+lastIndex));
            char=char+argsString.substring(char, char+lastIndex).length;
        } else {
            let arr = argsString.substring(char, char+argsString.substring(char).indexOf(']')+1);
            char=char+arr.length;
            final.push(arr);
        }
    }
    return final;
};
let getAssignmentString  = function(argNames, splittedArgs) {
    let assignmentString = '';
    for (let i=0; i<splittedArgs.length; i++) {
        assignmentString+= 'let '+argNames[i]+'='+splittedArgs[i]+';';
    }
    return assignmentString;
};

let printColor = function(mapRowToFunction, convertedString) {
    let convertedStringSplitted = convertedString.split('\n');
    let str = '';
    for (let i=0; i<convertedStringSplitted.length; i++) {
        let indexInMap = isInArray(mapRowToFunction, i+1);
        if(indexInMap>-1) {
            str += '<span style="color: ' + mapRowToFunction[indexInMap][1] +'; display:inline-block;">';
        }
        str += convertedStringSplitted[i];
        if(indexInMap>-1) {
            str += '</span>';
        }
        str+= '<br>';
    }
    innerHTML = str;
    return str;
};

let isInArray = function(arr, rowNum) {
    for (let i=0; i<arr.length; i++) {
        if(arr[i][0]===rowNum){
            return i;
        }
    }
    return -1;
};



let getArgNames = function(table, numberOfArgs) {
    let argNames=[];
    for (let i=0; i<numberOfArgs; i++) {
        argNames.push(table[i+2][2]);
    }
    return argNames;
};

export {colorCode};
export {innerHTML};
export {clearInnerHTML};
