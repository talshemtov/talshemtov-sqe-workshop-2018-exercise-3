import {clearTable, convertParsedCodeToLocal, parseCode, parsedForTable} from '../src/js/code-analyzer';
import {startSymbolicSub} from '../src/js/SymbolicSubstitutioner';
import assert from 'assert';
import {clearInnerHTML, innerHTML} from '../src/js/ColorCode';
import {colorCode} from '../src/js/ColorCode';

let test = function(codeToParse, argsString, expected) {
    clearInnerHTML();
    clearTable();
    let parsedCode = parseCode(codeToParse);
    convertParsedCodeToLocal(parsedCode);
    let table = parsedForTable;
    let substituted=startSymbolicSub(codeToParse, table, argsString);
    colorCode(substituted, argsString, table);
    let actual = innerHTML;
    return assert.equal(actual, expected);
};

describe('The Code Colorer', () => {
    it('should color in red conditions that are false', function () {
        let codeToParse = 'function foo(x, y){\n' +
            '    if (x>y){\n' +
            'return x;\n' +
            '} else {\n' +
            'return y;\n' +
            '}\n' +
            '}';
        let expected = 'function foo(x, y){<br><span style="color: red; display:inline-block;">    ' +
            'if ( x > y ){</span><br>return x;<br>} else {<br>return y;<br>}}<br><br><br>';
        test(codeToParse, '1,2', expected);
    });
    it('should color in green conditions that are true', function () {
        let codeToParse = 'function foo(x, y){\n' +
            '    if (x>y){\n' +
            'return x;\n' +
            '} else {\n' +
            'return y;\n' +
            '}\n' +
            '}';
        let expected = 'function foo(x, y){<br><span style="color: green; display:inline-block;">    ' +
            'if ( x > y ){</span><br>return x;<br>} else {<br>return y;<br>}}<br><br><br>';
        test(codeToParse, '2,1', expected);
    });
    it('should color in green conditions that are true', function () {
        let codeToParse = 'function f(x) {\n' +
            'let a=[1,2,3];\n' +
            'x=a[0];\n' +
            'if(x===1){\n' +
            'return 1;\n' +
            '}\n' +
            '}';
        let expected = 'function f(x) {<br>x = [1,2,3][0]<br><span style="color: green; display:inline-block;">if( x === 1 ){</span><br>return 1;<br>}}<br><br><br>';
        test(codeToParse, '2,1', expected);
    });
    it('should color in green conditions that are true', function () {
        let codeToParse = 'function f(x) {\n' +
            'let a=[1,2,3];\n' +
            'x[0]=a[0];\n' +
            'if(x[0]===1){\n' +
            'return 1;\n' +
            '}\n' +
            '}';
        let expected = 'function f(x) {<br>x[0] = [1,2,3][0]<br><span style="color: green; display:inline-block;">if( x[0] === 1 ){</span><br>return 1;<br>}}<br><br><br>';
        test(codeToParse, '[2,2]', expected);
    });
    it('should color in green conditions that are true', function () {
        let codeToParse = 'function f(x){\n' +
            'let a=x[0];\n' +
            'x[0]=a+1;\n' +
            '}';
        let expected = 'function f(x){<br>x[0] =  x[0] + 1 <br>}<br><br><br>';
        test(codeToParse, '[2,2]', expected);
    });
});