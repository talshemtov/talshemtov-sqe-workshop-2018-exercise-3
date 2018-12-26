import assert from 'assert';
import {clearTable, line, parseCode, parseCodeForTable, parsedForTable} from '../src/js/code-analyzer';
import {convertParsedCodeToLocal} from '../src/js/code-analyzer';

describe('The javascript parser', () => {
    it('is parsing an empty function correctly', () => {
        assert.equal(
            JSON.stringify(parseCode('')),
            '{"type":"Program","body":[],"sourceType":"script"}'
        );
    });

    it('is parsing a simple variable declaration correctly', () => {
        assert.equal(
            JSON.stringify(parseCode('let a = 1;')),
            '{"type":"Program","body":[{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"a"},"init":{"type":"Literal","value":1,"raw":"1"}}],"kind":"let"}],"sourceType":"script"}'
        );
    });
});

describe('The table information creator', () => {
    it('calls varDeclaration when recognizing a variable declaration', () => {
        clearTable();
        let parsedCode = parseCode('let a = 1;');
        convertParsedCodeToLocal(parsedCode);
        let expected = [1, 'VariableDeclaration', 'a',' ' ,1 ];
        let actual = parsedForTable;
        assert.deepEqual(actual[1], expected);
    });
    it('calls funcDeclaration when recognizing a variable declaration', () => {
        clearTable();
        let parsedCode = parseCode('function foo(){}');
        convertParsedCodeToLocal(parsedCode);
        let expected = [1, 'Function Declaration', 'foo',' ' ,' ' ];
        let actual = parsedForTable;
        assert.deepEqual(actual[1], expected);
    });

    it('calls varDeclaration when recognizing a variable declaration with no init', () => {
        clearTable();
        let parsedCode = parseCode('let a;');
        convertParsedCodeToLocal(parsedCode);
        let expected = [1, 'VariableDeclaration', 'a', ' ', ' '];
        let actual = parsedForTable;
        assert.deepEqual(actual[1], expected);
    });

    it('function with var declarations', () => {
        clearTable();
        let parsedCode = parseCode('function foo(a){}');
        convertParsedCodeToLocal(parsedCode);
        let expected = [1, 'Variable Declaration', 'a',' ' ,' ' ];
        let actual = parsedForTable;
        assert.deepEqual(actual[2], expected);
    });

    it('calls whileStatement when recognizing a while loop', () => {
        clearTable();
        let parsedCode = parseCode('while(a > b){}');
        convertParsedCodeToLocal(parsedCode);
        let expected = [ 1, 'WhileStatement', ' ', ' a > b ', ' ' ];
        let actual = parsedForTable;
        assert.deepEqual(actual[1], expected);
    });

    it('calls whileStatement when recognizing a while loop with single line', () => {
        clearTable();
        let parsedCode = parseCode('while(a > b) a=5;');
        convertParsedCodeToLocal(parsedCode);
        let expected = [ 1, 'WhileStatement', ' ', ' a > b ', ' ' ];
        let actual = parsedForTable;
        assert.deepEqual(actual[1], expected);
    });

    it('calls whileStatement when recognizing a while loop', () => {
        clearTable();
        let parsedCode = parseCode('while(a > b){}');
        convertParsedCodeToLocal(parsedCode);
        let expected = [ 1, 'WhileStatement', ' ', ' a > b ', ' ' ];
        let actual = parsedForTable;
        assert.deepEqual(actual[1], expected);
    });

    it('calls whileStatement when recognizing a while loop with body', () => {
        clearTable();
        let parsedCode = parseCode('while(a > b){a=a+1;}');
        convertParsedCodeToLocal(parsedCode);
        let expected = [ 1, 'WhileStatement', ' ', ' a > b ', ' ' ] ;
        let actual = parsedForTable;
        assert.deepEqual(actual[1], expected);
    });

    it('identifies assignment and right binary expressions', () => {
        clearTable();
        let parsedCode = parseCode('a = b + c;');
        convertParsedCodeToLocal(parsedCode);
        let expected = [ 1, 'AssignmentExpression', 'a', ' ', ' b + c ' ];
        let actual = parsedForTable;
        assert.deepEqual(actual[1], expected);
    });

    it('identifies assignment and left binary expressions', () => {
        clearTable();
        let parsedCode = parseCode('if(a + b > c){}');
        convertParsedCodeToLocal(parsedCode);
        let expected = [ 1, 'IfStatement', ' ', '  a + b  > c ', ' ' ];
        let actual = parsedForTable;
        assert.deepEqual(actual[1], expected);
    });

    it('identifies binary expression with left literal', () => {
        clearTable();
        let parsedCode = parseCode('let a = 5 + b;');
        convertParsedCodeToLocal(parsedCode);
        let expected = [ 1, 'VariableDeclaration', 'a', ' ', ' 5 + b ' ];
        let actual = parsedForTable;
        assert.deepEqual(actual[1], expected);
    });

    it('identifies binary expression with left identifier', () => {
        clearTable();
        let parsedCode = parseCode('let a = b;');
        convertParsedCodeToLocal(parsedCode);
        let expected = [1, 'VariableDeclaration', 'a', ' ', 'b'];
        let actual = parsedForTable;
        assert.deepEqual(actual[1], expected);
    });

    it('identifies member expressions with literal', () => {
        clearTable();
        let parsedCode = parseCode('let a = arr[5];');
        convertParsedCodeToLocal(parsedCode);
        let expected = [1, 'VariableDeclaration', 'a', ' ', 'arr[5]'];
        let actual = parsedForTable;
        assert.deepEqual(actual[1], expected);
    });

    it('identifies member expressions with other exp type', () => {
        clearTable();
        let parsedCode = parseCode('let a = arr[-x];');
        convertParsedCodeToLocal(parsedCode);
        let expected = [1, 'VariableDeclaration', 'a', ' ', 'arr[-x]'];
        let actual = parsedForTable;
        assert.deepEqual(actual[1], expected);
    });

    it('identifies member expressions with identifier', () => {
        clearTable();
        let parsedCode = parseCode('a = arr[b];');
        convertParsedCodeToLocal(parsedCode);
        let expected = [1, 'AssignmentExpression', 'a', ' ', 'arr[b]'];
        let actual = parsedForTable;
        assert.deepEqual(actual[1], expected);
    });

    it('identifies unary identifier expressions', () => {
        clearTable();
        let parsedCode = parseCode('a = -b;');
        convertParsedCodeToLocal(parsedCode);
        let expected = [1, 'AssignmentExpression', 'a', ' ', '-b'];
        let actual = parsedForTable;
        assert.deepEqual(actual[1], expected);
    });

    it('identifies unary binary expressions', () => {
        clearTable();
        let parsedCode = parseCode('a = -(x+5);');
        convertParsedCodeToLocal(parsedCode);
        let expected = [ 1, 'AssignmentExpression', 'a', ' ', '-( x + 5 )' ];
        let actual = parsedForTable;
        assert.deepEqual(actual[1], expected);
    });

    it('identifies unary literal expressions', () => {
        clearTable();
        let parsedCode = parseCode('a = -5;');
        convertParsedCodeToLocal(parsedCode);
        let expected = [1, 'AssignmentExpression', 'a', ' ', '-5'];
        let actual = parsedForTable;
        assert.deepEqual(actual[1], expected);
    });

    it('identifies right identifier expressions', () => {
        clearTable();
        let parsedCode = parseCode('a = b;');
        convertParsedCodeToLocal(parsedCode);
        let expected = [1, 'AssignmentExpression', 'a', ' ', 'b'];
        let actual = parsedForTable;
        assert.deepEqual(actual[1], expected);
    });

    it('identifies right literal expressions', () => {
        clearTable();
        let parsedCode = parseCode('a = 1;');
        convertParsedCodeToLocal(parsedCode);
        let expected = [1, 'AssignmentExpression', 'a', ' ', '1'];
        let actual = parsedForTable;
        assert.deepEqual(actual[1], expected);
    });

    it('identifies return statement with identifier', () => {
        clearTable();
        let parsedCode = parseCode('function f(){ return a;}');
        convertParsedCodeToLocal(parsedCode);
        let expected = [2, 'ReturnStatement', ' ', ' ', 'a'];
        let actual = parsedForTable;
        assert.deepEqual(actual[2], expected);
    });

    it('identifies return statement with expression', () => {
        clearTable();
        let parsedCode = parseCode('function f(){ return -a;}');
        convertParsedCodeToLocal(parsedCode);
        let expected = [2, 'ReturnStatement', ' ', ' ', '-a'];
        let actual = parsedForTable;
        assert.deepEqual(actual[2], expected);
    });

    it('identifies return statement with literal', () => {
        clearTable();
        let parsedCode = parseCode('function f(){ return 1;}');
        convertParsedCodeToLocal(parsedCode);
        let expected = [2, 'ReturnStatement', ' ', ' ', '1'];
        let actual = parsedForTable;
        assert.deepEqual(actual[2], expected);
    });

    it('identifies return statement with binary exp', () => {
        clearTable();
        let parsedCode = parseCode('function f(){ return a+1;}');
        convertParsedCodeToLocal(parsedCode);
        let expected = [ 2, 'ReturnStatement', ' ', ' ', ' a + 1 ' ];
        let actual = parsedForTable;
        assert.deepEqual(actual[2], expected);
    });

    it('can clear table and reset line counter', () => {
        clearTable();
        let expected = ['Line', 'Type', 'Name', 'Condition', 'Value'];
        let actual = parsedForTable;
        let lineExpected = 1;
        let lineActual = line;
        assert.deepEqual(actual[0], expected);
        assert.deepEqual(lineActual, lineExpected);
    });

    it('identifies if statements with no body', () => {
        clearTable();
        let parsedCode = parseCode('if(a>0){}');
        convertParsedCodeToLocal(parsedCode);
        let expected = [ 1, 'IfStatement', ' ', ' a > 0 ', ' ' ];
        let actual = parsedForTable;
        assert.deepEqual(actual[1], expected);
    });

    it('identifies if statements with body', () => {
        clearTable();
        let parsedCode = parseCode('if(a>0){a=a+1;}');
        convertParsedCodeToLocal(parsedCode);
        let expected = [ 1, 'IfStatement', ' ', ' a > 0 ', ' ' ] ;
        let actual = parsedForTable;
        assert.deepEqual(actual[1], expected);
    });

    it('identifies if statements with single line body', () => {
        clearTable();
        let parsedCode = parseCode('if(a>0)a=a+1;');
        convertParsedCodeToLocal(parsedCode);
        let expected = [ 1, 'IfStatement', ' ', ' a > 0 ', ' ' ];
        let actual = parsedForTable;
        assert.deepEqual(actual[1], expected);
    });

    it('identifies if else statements with single line body', () => {
        clearTable();
        let parsedCode = parseCode('if(a>2)a=a+1; else if(a==1) a=0;');
        convertParsedCodeToLocal(parsedCode);
        let expected = [ 3, 'Else IfStatement', ' ', ' a == 1 ', ' ' ];
        let actual = parsedForTable;
        assert.deepEqual(actual[3], expected);
    });

    it('Test parseCodeForTable', () => {
        clearTable();
        let parsedCode = parseCode('let a = 1;');
        parseCodeForTable(parsedCode);
        let expected = [1, 'VariableDeclaration', 'a', ' ', '1'];
        let actual = parsedForTable;
        assert.deepEqual(actual[1], expected);
    });

    it('Can identify while with logical exp', () => {
        clearTable();
        let parsedCode = parseCode('while(a>b && a>0){}');
        parseCodeForTable(parsedCode);
        let expected = [ 1, 'WhileStatement', ' ', '  a > b  &&  a > 0  ', ' ' ];
        let actual = parsedForTable;
        assert.deepEqual(actual[1], expected);
    });

    it('Can identify for with literal init assignment', () => {
        clearTable();
        let parsedCode = parseCode('for(i=0; i<5; i=i+1){}');
        parseCodeForTable(parsedCode);
        let expected = [ 1, 'ForStatement', ' ', ' i = 0 ;  i < 5 ;  i =  i + 1  ', ' ' ];
        let actual = parsedForTable;
        assert.deepEqual(actual[1], expected);
    });

    it('Can identify for with expression init var declaration with body', () => {
        clearTable();
        let parsedCode = parseCode('for(var i=j+1; i<5; i=i+1){a=8;}');
        parseCodeForTable(parsedCode);
        let expected = [ 1, 'ForStatement',  ' ', 'i =  j + 1 ;  i < 5 ;  i =  i + 1  ', ' ' ] ;
        let actual = parsedForTable;
        assert.deepEqual(actual[1], expected);
    });

    it('Can identify for with literal init var declaration with body', () => {
        clearTable();
        let parsedCode = parseCode('for(var i=0; i<5; i=i+1){}');
        parseCodeForTable(parsedCode);
        let expected = [ 1, 'ForStatement', ' ', 'i = 0;  i < 5 ;  i =  i + 1  ', ' ' ];
        let actual = parsedForTable;
        assert.deepEqual(actual[1], expected);
    });

    it('Can identify for with identifier init var declaration with body', () => {
        clearTable();
        let parsedCode = parseCode('for(var i=j; i<5; i=i+1){}');
        parseCodeForTable(parsedCode);
        let expected = [ 1, 'ForStatement', ' ', 'i = j;  i < 5 ;  i =  i + 1  ', ' ' ];
        let actual = parsedForTable;
        assert.deepEqual(actual[1], expected);
    });
    it('Can identify if with boolean', () => {
        clearTable();
        let parsedCode = parseCode('if(true){}');
        parseCodeForTable(parsedCode);
        let expected = [ 1, 'IfStatement', ' ', true, ' ' ];
        let actual = parsedForTable;
        assert.deepEqual(actual[1], expected);
    });
});


