import * as algebra from 'algebra.js';

let args = [];
let tableAfterSub;
let argValues = [];

export{tableAfterSub};

// let assignmentExpressions = [];

let startSymbolicSub = function(unparsedCode, parsedForTable, argString) {
    argValues = getSplittedArgs(argString);
    let localParams = [];
    args = [];
    let tmp=unparsedCode.split('\n');
    let toRemove=[];
    let goodCode='';
    for(let i=0; i<tmp.length; i++) {
        if (checkIfOnlyClosingCurlyBrackets(tmp[i].trim()) && i<tmp.length-1) {
            toRemove.push(i);
            tmp[i+1] = tmp[i].trim() + tmp[i+1];
        } else {continue;}
    }
    getTmp(tmp, toRemove);
    for(let i=0; i<tmp.length; i++) {
        goodCode += tmp[i]+'\n';
    }
    return init(goodCode, parsedForTable, localParams);
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

let init = function(goodCode, parsedForTable, localParams) {
    symbolicSub(goodCode, parsedForTable, localParams);
    tableAfterSub = parsedForTable;
    return substitutedFunc(parsedForTable, goodCode);
};

let getTmp = function (tmp, toRemove) {
    for(let i=0; i<toRemove.length; i++) {
        tmp.splice(toRemove[i]-i,1);
    }
};

let checkIfOnlyClosingCurlyBrackets = function(string) {
    for (let i=0; i<string.length; i++) {
        if (string[i]!='}') {
            return false;
        }
    }
    return true;
};


let symbolicSub = function(unparsedCode, parsedForTable, localParams) {
    for (let i = 0; i < parsedForTable.length; i++) {
        let func = rowTypeMapper[parsedForTable[i][1]];
        if (func != undefined) {
            i= func.call(undefined, parsedForTable, i, localParams, unparsedCode);
        } else {
            otherStatements(parsedForTable, i, localParams);
        }
    }

};

let varSpaceDeclaration = function(parsedForTable, i){
    args[args.length] = parsedForTable[i][2];
    return i;
};

let variableDeclaration = function(parsedForTable, i, localParams) {
    let subVal = substitute(parsedForTable[i], localParams);
    localParams[localParams.length] = [parsedForTable[i][2], subVal];
    checkIfLocalArray(parsedForTable[i], localParams); //maybe use subval
    return i;
};

let conditionStatement = function(parsedForTable, i, localParams, unparsedCode) {
    parsedForTable[i][3] = replaceOtherValues(parsedForTable[i][3], localParams, false, parsedForTable[i]);
    return i + ifBlock(parsedForTable[i], unparsedCode, JSON.parse(JSON.stringify(localParams)), parsedForTable);
};

let otherStatements = function(parsedForTable, i, localParams) {
    parsedForTable[i][3] = replaceOtherValues(parsedForTable[i][3], localParams, false, parsedForTable[i]);
    parsedForTable[i][4] = replaceOtherValues(parsedForTable[i][4], localParams, false, parsedForTable[i]);
    return i;
};

let assignmentExp = function(parsedForTable, i, localParams) {
    parsedForTable[i][2] = replaceOtherValues(parsedForTable[i][2], localParams, true, parsedForTable[i]);
    parsedForTable[i][4] = replaceOtherValues(parsedForTable[i][4], localParams, false, parsedForTable[i]);
    localParams = updateValue(parsedForTable[i], localParams, 2);
    localParams = updateValue(parsedForTable[i], localParams, 4);
    return i;
};

let rowTypeMapper = {'Variable Declaration': varSpaceDeclaration, 'VariableDeclaration':variableDeclaration, 'IfStatement': conditionStatement,
    'Else IfStatement': conditionStatement, 'WhileStatement':conditionStatement, 'AssignmentExpression': assignmentExp};



let checkIfLocalArray = function(parsedForTableRow, localParams) {
    let valToCheck=parsedForTableRow[4]+'';
    if (valToCheck.includes('[') && valToCheck.includes(']') && valToCheck.includes(',')) {
        let splitted = parsedForTableRow[4].substring(1, parsedForTableRow[4].length-1).split(',');
        for (let i=0; i<splitted.length; i++) {
            localParams.push([parsedForTableRow[2]+'['+i+']', splitted[i]]);
        }
    }
};

let substitutedFunc = function(table, unparsedCode) {
    let splittedUnparsedCode = unparsedCode.split('\n');
    let toRemove =[];
    let ans='';
    let newRowCounter = 0;
    for (let lineInUnparsedCode=0; lineInUnparsedCode<splittedUnparsedCode.length; lineInUnparsedCode++) {
        let indexInTable = findIndex(lineInUnparsedCode+1, table, 0);
        newRowCounter++;
        if (indexInTable != -1) {
            let func = subMapper[table[indexInTable][1]];
            if(func!= undefined) {
                newRowCounter = func.call(undefined, splittedUnparsedCode, lineInUnparsedCode, table, indexInTable, newRowCounter, toRemove);
            } else {
                newRowCounter=subDefault(table, toRemove, lineInUnparsedCode, newRowCounter, indexInTable);
            }
        }
    }
    return getAns(toRemove, splittedUnparsedCode, ans);
};

let subDefault = function(table, toRemove, lineInUnparsedCode, newRowCounter, indexInTable) {
    if(table[indexInTable][1] != 'Function Declaration') {
        toRemove.push(lineInUnparsedCode);
        return newRowCounter-1;
    } else {
        return newRowCounter;
    }
};

let subIfWhileElse = function(splittedUnparsedCode, lineInUnparsedCode, table, indexInTable, newRowCounter) {
    splittedUnparsedCode[lineInUnparsedCode] = replaceBetweenParenthesises(splittedUnparsedCode[lineInUnparsedCode], table[indexInTable][3]);
    table[indexInTable].push(newRowCounter);
    return newRowCounter;
};

let subReturn = function(splittedUnparsedCode, lineInUnparsedCode, table, indexInTable, newRowCounter){
    splittedUnparsedCode[lineInUnparsedCode] = splittedUnparsedCode[lineInUnparsedCode].substring(0, splittedUnparsedCode[lineInUnparsedCode].lastIndexOf('return')+7) + table[indexInTable][4] + ';';
    return newRowCounter;
};

let subAssign = function(splittedUnparsedCode, lineInUnparsedCode, table, indexInTable, newRowCounter, toRemove){
    if (findIndex(table[indexInTable][2], args, 0) === -1) {
        toRemove.push(lineInUnparsedCode);
        newRowCounter--;
    } else {
        splittedUnparsedCode[lineInUnparsedCode] = table[indexInTable][2] + ' = ' + table[indexInTable][4];
    }
    return newRowCounter;
};

let subMapper = {'IfStatement':subIfWhileElse, 'WhileStatement': subIfWhileElse, 'Else IfStatement': subIfWhileElse,
    'ReturnStatement': subReturn, 'AssignmentExpression': subAssign};



let getAns = function(toRemove, splittedUnparsedCode, ans) {
    for (let i=0; i<toRemove.length; i++) {
        splittedUnparsedCode.splice(toRemove[i]-i,1);
    }
    for(let i=0; i<splittedUnparsedCode.length; i++) {
        ans += splittedUnparsedCode[i]+'\n';
    }
    return ans;
};

let replaceBetweenParenthesises = function(original, replacement) {
    let indexOfOpen, indexOfClose;
    for( indexOfOpen=0; indexOfOpen<original.length; indexOfOpen++) {
        if(original[indexOfOpen]==='(') {
            break;
        }
    }
    for( indexOfClose=original.length-1; indexOfClose>0; indexOfClose--) {
        if (original[indexOfClose]===')') {
            break;
        }
    }
    let startToOpen = original.substring(0, indexOfOpen+1);
    let closeToEnd = original.substring(indexOfClose);
    return startToOpen + replacement + closeToEnd;
};

let findIndex = function(val, array, col) {
    for (let i=0; i<array.length; i++) {
        if(val===array[i][col] || ((val+'').includes('[') && (val+'').substring(0, val.indexOf('[')))) {
            return i;
        }
    }
    return -1;
};

let ifBlock = function(ifRowInTable, unparsedCode, blockLocalParams, parsedForTable) {
    unparsedCode = unparsedCode.replace(/^\s*[\r\n]/gm, ''); //remove empty lines
    let splitted = unparsedCode.split('\n');
    let substring = new String();
    for (let i=ifRowInTable[0]-1; i<splitted.length; i++) {
        substring += splitted[i] + '\n';
    }
    let endOfIfBlockPosition = findClosingBracketMatchIndex(substring, substring.indexOf('{'));
    endOfIfBlockPosition += (unparsedCode.length-substring.length+1);
    let lineOfClosing = getLineNumberByIndex(unparsedCode, endOfIfBlockPosition);
    let innerBlockTable = getBlock(parsedForTable, ifRowInTable[0], lineOfClosing);
    symbolicSub(unparsedCode, innerBlockTable, blockLocalParams.slice(),
        substring.substring(substring.indexOf('{')+1,endOfIfBlockPosition));
    return innerBlockTable.length;
};

let getBlock = function(parsedForTable, ifLine, endOfBlockLine) {
    let blockTable = [];
    for (let i=0; i<parsedForTable.length; i++) {
        if (parsedForTable[i][0]> ifLine && parsedForTable[i][0]<endOfBlockLine) {
            blockTable.push(parsedForTable[i]);
        }
    }
    return blockTable;
};

let getLineNumberByIndex = function(string, index) {
    let counter = 1;
    for (let i =0; i<index; i++) {
        if(string[i]==='\n') {
            counter++;
        }
    }
    return counter;
};

let replaceOtherValues = function(string, localParams, isName, row) {
    string = string +'';
    let res=string;
    for (let i=0; i<localParams.length; i++) {
        if (shouldReplace(string, localParams, i)) {
            res = replace(string, res, localParams, i, row);
        }
    }
    return getFinalReplacement(res, string, isName);
};

let shouldReplace = function(string, localParams, i) {
    return (cond1(string, localParams, i) || cond2(string, localParams, i) || string.includes(localParams[i][0]+'[') || isArg(string)
    || string === localParams[i][0]);
};

let cond1 = function(string, localParams, i) {
    return (string.length===1 && string.includes(localParams[i][0]));
};

let cond2 = function(string, localParams, i) {
    return (string.includes(' ' + localParams[i][0] + ' ')
        || string.includes(' ' + localParams[i][0] + ';'));
};

let isArg = function(string) {
    for (let i=0; i<args.length; i++) {
        if (string.includes(args[i])) {
            return true;
        }
    }
    return false;
};

let replace = function(string, res, localParams, i, row) {

    if (string.length === 1) {
        let regex = new RegExp(localParams[i][0], 'g');
        res = res.replace(regex, localParams[i][1]);
    } else if (string.includes('[')) {
        res = replaceArrExp(res, localParams, i, row);
    } else if (string === localParams[i][0]) {
        res = res.replace(localParams[i][0],  localParams[i][1]);
    } else {
        let regex = new RegExp(' ' + localParams[i][0] + ' ', 'g');
        res = res.replace(regex, ' ' + localParams[i][1] + ' ');
    }
    return res;
};

let replaceArrExp = function(string, localParams, i, row) {
    let tmp = checkIfMemberInBracketIsArg(string);
    if(string!= tmp) {
        return tmp;
    } else {
        try {
            updateArrValLocalParams(string, localParams, i, row);
        } catch(e){}
        let res = string.substring(0, string.indexOf('[')).replace(localParams[i][0], localParams[i][1]) + string.substring(string.indexOf('['));
        if (isArg(string.substring(0, string.indexOf('[')))) {
            res = string.substring(0, string.indexOf('[')) + string.substring(string.indexOf('[')).replace(localParams[i][0], localParams[i][1]);
        }
        return res;
    }
};

let checkIfMemberInBracketIsArg = function(res) {
    let inBrackets = res.substring(res.indexOf('[')+1, res.indexOf(']'));
    for(let i=0; i<args.length; i++) {
        if(args[i]===inBrackets) {
            res = res.substring(0, res.indexOf('[')) + '[' + argValues[i] + res.substring(res.indexOf(']'));
        }
    }
    return res;
}

let     updateArrValLocalParams = function(string, localParams, i, row) {
    for(let i=0; i<localParams.length; i++) {
        if(localParams[i][0]===string.substring(0, string.indexOf('['))) {
            localParams[i][1]='['+eval('let '+string.substring(0, string.indexOf('['))+' ='+localParams[i][1] + ';'+string + '=' + row[4] + ';' +
                string.substring(0, string.indexOf('['))).toString() + ']';
        } else if(localParams[i][0]===string) {
            localParams[i][1]=row[4];
        }
    }
};

let getFinalReplacement = function(res, string, isName) {
    parseInt(res);
    // if (!string.includes('[')) {
    //     return res;
    if (isName && !string.includes('[')) {
        return string; //res is a number
    } else if(res.includes('[')) {
        try {
            return res.substring(0, res.indexOf('[')+1) +  algebra.parse(res.substring(res.indexOf('[')+1, res.indexOf(']'))).toString() +
                res.substring(res.indexOf(']'));
        } catch (e) {
            return res;
        }
    }
    return res;
};

let updateValue = function(rowToUpdate, localParams, indexToUpdate) {
    let currentVal = null;
    let found = false;
    let index = -1;
    for (let i=0; i<localParams.length; i++) {
        if (localParams[i][0] === rowToUpdate[indexToUpdate].trim()) {
            currentVal = localParams[i][1];
            found = true;
            index = i;
        }
    }
    if (found) {
        let newValue = rowToUpdate[4].replace(rowToUpdate[indexToUpdate], currentVal);
        localParams[index][1] = ' '+newValue+' ';
        rowToUpdate[4] = ' '+newValue+' ';
    }
    return localParams;
};

// let getArrValue = function(value, localParams) {
//     for (let i=0; i<localParams.length; i++) {
//     if(localParams[i][0]===value) {
//         return localParams[i][1];
//     }
// }
// return -1;
// };

let substitute = function(details, localParams) {
    let value = details[4];

    for (let j = 0; j < localParams.length; j++) {
        if (value.includes(localParams[j][0])) {
            if(value===localParams[j][0]) {
                value=localParams[j][1];
            } else {
                value = value.replace(localParams[j][0]+' ', localParams[j][1]);
                value = value.replace(localParams[j][0]+']', localParams[j][1]+']');
                value = value.replace('['+localParams[j][0], '['+localParams[j][1]);
                value = value.replace(','+localParams[j][0]+',', ','+localParams[j][1]+',');
            }
        } else {
            continue;
        }
    }

    return value;
};

function findClosingBracketMatchIndex(str, pos) {
    let depth = 1;
    for (let i = pos + 1; i < str.length; i++) {
        switch (str[i]) {
        case '{':
            depth++;
            break;
        case '}':
            if (--depth == 0) {
                return i;
            }
        }
    }
}
export {startSymbolicSub};