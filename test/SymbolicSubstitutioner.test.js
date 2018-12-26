import {
    clearTable,
    convertParsedCodeToLocal,
    parseCode, parsedForTable,
} from '../src/js/code-analyzer';
import {startSymbolicSub} from '../src/js/SymbolicSubstitutioner';
import assert from 'assert';

let test = function(codeToParse, expected, argString){
    clearTable();
    let parsedCode = parseCode(codeToParse);
    convertParsedCodeToLocal(parsedCode);
    let table = parsedForTable;
    let substituted=startSymbolicSub(codeToParse, table, argString);
    let actual = substituted;
    return assert.equal(actual, expected);
};

describe('The Symbolic Subtitutioner', () => {
    it('substituting a single line function correctly', () => {
        let codeToParse = 'function foo(x) {\n' +
            'let a = x;\n' +
            'return x;\n' +
            '}';
        let expected = 'function foo(x) {\nreturn x;\n}\n\n';
        test(codeToParse, expected, '1');
    });

    it('substituting a if else function correctly', () => {
        let codeToParse = 'function foo(x) {\n' +
            'let a = x;\n' +
            'if (a > 5) {\n' +
            'return a;\n' +
            '} else {\n' +
            'return 0;\n' +
            '}\n' +
            '}';
        let expected = 'function foo(x) {\n' +
            'if ( x > 5 ) {\n' +
            'return x;\n' +
            '} else {\n' +
            'return 0;\n' +
            '}}\n' +
            '\n';
        test(codeToParse, expected, '1');
    });

    it('substituting a if else if else function correctly', () => {
        let codeToParse = 'function foo(x) {\n' +
            '\tlet a = x;\n' +
            '\tif (a>5) {\n' +
            '\treturn a;\n' +
            '\t} else if (a>10){\n' +
            '\treturn 0;\n' +
            '\t} else {\n' +
            'return 5;\n' +
            '}\n' +
            '}';
        let expected = 'function foo(x) {\n' +
            '\tif ( x > 5 ) {\n' +
            '\treturn x;\n' +
            '\t} else if ( x > 10 ){\n' +
            '\treturn 0;\n' +
            '\t} else {\n' +
            'return 5;\n' +
            '}}\n' +
            '\n';
        test(codeToParse, expected, '1');
    });

    it('substituting a while function correctly', () => {
        let codeToParse = 'function foo(x) {\n' +
            '\tlet a = x;\n' +
            '\twhile (a>5) {\n' +
            '\ta=a+1;\n' +
            'x=a;\n' +
            '}\n' +
            '}';
        let expected = 'function foo(x) {\n' +
            '\twhile ( x > 5 ) {\n' +
            'x =   x + 1  \n' +
            '}}\n' +
            '\n';
        test(codeToParse, expected, '1');
    });

    it('substituting a while function with empty line correctly', () => {
        let codeToParse = 'function foo(x) {\n' +
            ' let a = x;\n' +
            ' while (a>5) {\n' +
            '       a=a+1;\n' +
            '       x=a;\n' +
            ' }\n' +
            '}';
        let expected = 'function foo(x) {\n' +
            ' while ( x > 5 ) {\n' +
            'x =   x + 1  \n' +
            '}}\n' +
            '\n';
        test(codeToParse, expected, '1');
    });
    it('substituting a while function with empty line correctly', () => {
        let codeToParse = 'function foo(x, y, z){\n' +
            '                let a = x + 1;\n' +
            '                let b = a + y;\n' +
            '                let c = 0;\n' +
            '                if (b < z) {\n' +
            '                    c = c + 5;\n' +
            '                    if(b<x) {\n' +
            '                        return a+b+c;\n' +
            '                    } else {\n' +
            '                        return c;        \n' +
            '               } } else if (b < z * 2) {\n' +
            '                    c = c + x + 5;\n' +
            '                    return x + y + z + c;\n' +
            '                } else {\n' +
            '                    c = c + z + 5;\n' +
            '                    return x + y + z + c;\n' +
            '                }\n' +
            '            }';
        let expected = 'function foo(x, y, z){\n' +
            '                if (   x + 1 + y  < z ) {\n' +
            '                    if(   x + 1 + y  < x ) {\n' +
            '                        return    x + 1  +   x + 1 + y   +   0 + 5   ;\n' +
            '                    } else {\n' +
            '                        return   0 + 5  ;\n' +
            '               } } else if (   x + 1 + y  <  z * 2  ) {\n' +
            '                    return    x + y  + z  +    0 + x  + 5   ;\n' +
            '                } else {\n' +
            '                    return    x + y  + z  +    0 + z  + 5   ;\n' +
            '}            }\n' +
            '\n';
        test(codeToParse, expected, '1,2,3');
    });

    it('substituting a return function with no local args correctly', () => {
        let codeToParse = 'function foo(x){\n' +
            'return x;\n' +
            '}';
        let expected = 'function foo(x){\n' +
            'return x;\n' +
            '}\n' +
            '\n';
        test(codeToParse, expected, '1');
    });

    it('substituting a return function with 1 local args correctly', () => {
        let codeToParse = 'function foo(x){\n' +
            'let a= x;\n' +
            'return a;\n' +
            '}';
        let expected = 'function foo(x){\n' +
            'return x;\n' +
            '}\n' +
            '\n';
        test(codeToParse, expected, '1');
    });
    it('substituting a assignment expression with arg correctly', () => {
        let codeToParse = 'function foo(x, y, z){\n' +
            '    let a = x + 1;\n' +
            '    let b = y;\n' +
            '    return b;\n' +
            '}';
        let expected = 'function foo(x, y, z){\n' +
            '    return y;\n' +
            '}\n' +
            '\n';
        test(codeToParse, expected, '1,2,3');
    });
    it('substituting a array expressions correctly', () => {
        let codeToParse = 'function insertionSort (items) {\n' +
            'let i=1;\n' +
            '  while (i>0) {\n' +
            '    let value = items[i];\n' +
            '    let j=0;\n' +
            '     while (j>0){\n' +
            '      items[i+1] = items[j];\n' +
            '      items[j ] = value;\n' +
            '  }\n' +
            '}\n' +
            '  return items\n' +
            '}';
        let expected = 'function insertionSort (items) {\n' +
            '  while ( 1 > 0 ) {\n' +
            '     while ( 0 > 0 ){\n' +
            'items[2] = items[0]\n' +
            'items[0] = items[1]\n' +
            '}}  return items;\n' +
            '}\n' +
            '\n';
        test(codeToParse, expected, '[1,2]');
    });
    it('substituting a local array correctly', () => {
        let codeToParse = 'function f() {\n' +
            'let a=[1,2,3];\n' +
            'if(a[0]===1) {\n' +
            'return 1;\n' +
            '}\n' +
            '}';
        let expected = 'function f() {\n' +
            'if( [1,2,3][0] === 1 ) {\n' +
            'return 1;\n' +
            '}}\n' +
            '\n';
        test(codeToParse, expected, '');
    });
    it('substituting a local array with identifier element correctly', () => {
        let codeToParse = 'function f() {\n' +
            'let b=1;\n' +
            'let a=[b,2,3];\n' +
            'if(a[0]===1) {\n' +
            'return 1;\n' +
            '}\n' +
            '}';
        let expected = 'function f() {\n' +
            'if( [1,2,3][0] === 1 ) {\n' +
            'return 1;\n' +
            '}}\n' +
            '\n';
        test(codeToParse, expected, '');
    });
    it('substituting a local array with expression element correctly', () => {
        let codeToParse = 'function f() {\n' +
            'let b=1;\n' +
            'let a=[b+1,2,3];\n' +
            'if(a[0]===1) {\n' +
            'return 1;\n' +
            '}\n' +
            '}';
        let expected = 'function f() {\n' +
            'if( [ 1+ 1 ,2,3][0] === 1 ) {\n' +
            'return 1;\n' +
            '}}\n' +
            '\n';
        test(codeToParse, expected, '');
    });
    it('substituting a local array element correctly', () => {
        let codeToParse = 'function foo() {\n' +
            '    let a = [1,2,3];\n' +
            'a[2]=0;\n' +
            'if(a[2]===0){\n' +
            'return 1;\n' +
            '}\n' +
            ' }';
        let expected = 'function foo() {\n' +
            'if( [1,2,0][2] === 0 ){\n' +
            'return 1;\n' +
            '} }\n' +
            '\n';
        test(codeToParse, expected, '');
    });
    it('substituting a local param as func of other local param correctly', () => {
        let codeToParse = 'function f(x){\n' +
            'let a=x;\n' +
            'let b=a+1;\n' +
            'x=b;\n' +
            '}';
        let expected = 'function f(x){\n' +
            'x =  x+ 1 \n' +
            '}\n' +
            '\n';
        test(codeToParse, expected, '1');
    });
    it('substituting a local param as exact other local param correctly', () => {
        let codeToParse = 'function f(x){\n' +
            'let a=5;\n' +
            'let b=a;\n' +
            'x=b;\n' +
            '}';
        let expected = 'function f(x){\n' +
            'x = 5\n' +
            '}\n' +
            '\n';
        test(codeToParse, expected, '1');
    });
    it('substituting a arg value in member expression', () => {
        let codeToParse = 'function f(x){\n' +
            'let a= [1,2,3];\n' +
            'x=a[x];\n' +
            'if (x===1){\n' +
            'return x;\n' +
            '}\n' +
            '}';
        let expected = 'function f(x){\n' +
            'x =  2 \n' +
            'if ( x === 1 ){\n' +
            'return x;\n' +
            '}}\n' +
            '\n';
        test(codeToParse, expected, '1');
    });

});