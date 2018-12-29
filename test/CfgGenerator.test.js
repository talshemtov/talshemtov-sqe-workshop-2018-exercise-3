import {parseCode, parseCodeForTable} from '../src/js/code-analyzer';
import {startSymbolicSub} from '../src/js/SymbolicSubstitutioner';
import assert from 'assert';
import {
    addNumberToNodeLabel,
    changeColor,
    changeShape,
    concatArrayToString,
    createGraph,
    getNodeAfterArrow,
    getNodeLabel,
    getNodeNumberAtArrCell
} from '../src/js/CfgGenerator';

describe('The CRF Generator', () => {
    it('Correctly genererated CFG for function with if statements', function () {
        let codeToParse = 'function foo(x, y, z){\n' +
            '    let a = x + 1;\n' +
            '    let b = a + y;\n' +
            '    let c = 0;\n' +
            '    \n' +
            '    if (b < z) {\n' +
            '        c = c + 5;\n' +
            '    } else if (b < z * 2) {\n' +
            '        c = c + x + 5;\n' +
            '    } else {\n' +
            '        c = c + z + 5;\n' +
            '    }\n' +
            '    \n' +
            '    return c;\n' +
            '}\n';
        let expected = 'n1 [label="(0)\na = x + 1;\nb = a + y;\nc = 0;", shape = "box" style="filled" fillcolor = "green"]' +
            '\nn4 [label="(1)\nb < z", shape = "diamond" style="filled" fillcolor = "green"]' +
            '\nn5 [label="(2)\nc = c + 5", shape = "box"]' +
            '\nn6 [label="(3)\nreturn c;", shape = "box" style="filled" fillcolor = "green"]' +
            '\nn7 [label="(4)\nb < z * 2", shape = "diamond" style="filled" fillcolor = "green"]' +
            '\nn8 [label="(5)\nc = c + x + 5", shape = "box" style="filled" fillcolor = "green"]' +
            '\nn9 [label="(6)\nc = c + z + 5", shape = "box"]' +
            '\nn1 -> n4 []' +
            '\nn4 -> n5 [label="true"]' +
            '\nn4 -> n7 [label="false"]' +
            '\nn5 -> n6 []' +
            '\nn7 -> n8 [label="true"]' +
            '\nn7 -> n9 [label="false"]' +
            '\nn8 -> n6 []' +
            '\nn9 -> n6 []\n';
        test(codeToParse, '1,2,3', expected);
    });
    it('Correctly genererated CFG for function with while statements', function () {
        let codeToParse = 'function foo(x, y, z){\n' +
            '   let a = x + 1;\n' +
            '   let b = a + y;\n' +
            '   let c = 0;\n' +
            '   \n' +
            '   while (a < z) {\n' +
            '       c = a + b;\n' +
            '       z = c * 2;\n' +
            '       a=a+1;\n' +
            '   }\n' +
            '}\n';
        let expected = 'n1 [label="(0)\na = x + 1;\nb = a + y;\nc = 0;", shape = "box" style="filled" fillcolor = "green"]' +
            '\nn4 [label="(1)\na < z", shape = "diamond" style="filled" fillcolor = "green"]' +
            '\nn5 [label="(2)\nc = a + b", shape = "box" style="filled" fillcolor = "green"]' +
            '\nn6 [label="(3)\nz = c * 2", shape = "box" style="filled" fillcolor = "green"]' +
            '\nn7 [label="(4)\na=a+1", shape = "box" style="filled" fillcolor = "green"]' +
            '\nn1 -> n4 []' +
            '\nn4 -> n5 [label="true"]' +
            '\nn5 -> n6 []' +
            '\nn6 -> n7 []' +
            '\nn7 -> n4 []\n';
        test(codeToParse, '1,2,3', expected);
    });
    it('Correctly genererated CFG for function with while within while statements', function () {
        let codeToParse = 'function foo(x, y, z){\n' +
            '   let a = x + 1;\n' +
            '   let b = a + y;\n' +
            '   let c = 0;\n' +
            '   \n' +
            '   while (a < z) {\n' +
            'while(1>0){\n' +
            'a=3;\n' +
            '}\n' +
            '       c = a + b;\n' +
            '       z = c * 2;\n' +
            '       a=a+1;\n' +
            '   }\n' +
            '   \n' +
            '}\n';
        let expected = 'n1 [label="(0)\na = x + 1;\nb = a + y;\nc = 0;", shape = "box" style="filled" fillcolor = "green"]' +
            '\nn4 [label="(1)\na < z", shape = "diamond" style="filled" fillcolor = "green"]' +
            '\nn5 [label="(2)\n1>0", shape = "diamond" style="filled" fillcolor = "green"]' +
            '\nn6 [label="(3)\na=3", shape = "box" style="filled" fillcolor = "green"]' +
            '\nn7 [label="(4)\nc = a + b", shape = "box" style="filled" fillcolor = "green"]' +
            '\nn8 [label="(5)\nz = c * 2", shape = "box" style="filled" fillcolor = "green"]' +
            '\nn9 [label="(6)\na=a+1", shape = "box" style="filled" fillcolor = "green"]' +
            '\nn1 -> n4 []' +
            '\nn4 -> n5 [label="true"]' +
            '\nn5 -> n6 [label="true"]' +
            '\nn5 -> n7 [label="false"]' +
            '\nn6 -> n5 []' +
            '\nn7 -> n8 []' +
            '\nn8 -> n9 []' +
            '\nn9 -> n4 []\n';

        test(codeToParse, '1,2,3', expected);
    });
    it('Correctly concats an array to string', function () {
        let arr = ['a', 'b', 'c'];
        let expected = 'a\nb\nc\n';
        assert.equal(concatArrayToString(arr), expected);
    });
    it('Correctly get node label', function () {
        let node = 'n4 [label="this is the label", shape = "diamond" style="filled" fillcolor = "green"]';
        let expected = 'this is the label';
        assert.equal(getNodeLabel(node), expected);
    });
    it('Correctly get node number', function () {
        let node = 'n4 [label="this is the label", shape = "diamond" style="filled" fillcolor = "green"]';
        let expected = '4';
        assert.equal(getNodeNumberAtArrCell(node), expected);
    });
    it('Correctly get node after arrow', function () {
        let node = 'n5 -> n7 [label="false"]';
        let expected = 'n7';
        assert.equal(getNodeAfterArrow(node), expected);
    });
    it('Correctly changes shape', function () {
        let arr = ['n4 [label="(1)\na < z"]'];
        let expected = 'n4 [label="(1)\na < z", shape = "diamond"]';
        changeShape(arr, 0, 'diamond');
        assert.equal(arr[0], expected);
    });
    it('Correctly changes color', function () {
        let arr = ['n4 [label="(1)\na < z"]'];
        let expected = 'n4 [label="(1)\na < z" style="filled" fillcolor = "green"]';
        changeColor(arr, 0, 'green');
        assert.equal(arr[0], expected);
    });
    it('Correctly add number to node', function () {
        let arr = ['n4 [label="a < z"]'];
        let expected = ['n4 [label="(0)\na < z"]'];
        addNumberToNodeLabel(arr);
        assert.equal(arr[0], expected[0]);
    });
});

let test = function(sourceCode, args, expected) {
    let parsedCode = parseCode(sourceCode);
    let table = parseCodeForTable(parsedCode);
    let substitutedCode = startSymbolicSub(sourceCode, table, args);
    let actual = createGraph(sourceCode, parsedCode, args, table, substitutedCode);
    console.log(expected.split('\n'));
    // console.log(expected.split('\n'));

    return assert.deepEqual(actual.split('\n'), expected.split('\n'));
};