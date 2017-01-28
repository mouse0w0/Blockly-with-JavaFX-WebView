/**
 * Java code generator.
 * @type {!Blockly.Generator}
 */
Blockly.Java = new Blockly.Generator('Java');

/**
 * List of illegal variable names.
 * This is not intended to be a security feature.  Blockly is 100% client-side,
 * so bypassing this list is trivial.  This is intended to prevent users from
 * accidentally clobbering a built-in object or function.
 * @private
 */
Blockly.Java.addReservedWords('abstract,assert,boolean,break,byte,case,catch,char,class,const,continue,default,do,double,else,enum,extends,final,finally,float,for,goto,if,implements,import,instanceof,int,interface,long,native,new,package,private,protected,public,return,strictfp,short,static,super,switch,synchronized,this,throw,throws,transient,try,void,volatile,while');

/**
 * Order of operation ENUMs.
 * https://developer.mozilla.org/en/Java/Reference/Operators/Operator_Precedence
 */
Blockly.Java.ORDER_ATOMIC = 0;           // 0 "" ...
Blockly.Java.ORDER_NEW = 1.1;            // new
Blockly.Java.ORDER_MEMBER = 1.2;         // . []
Blockly.Java.ORDER_FUNCTION_CALL = 2;    // ()
Blockly.Java.ORDER_INCREMENT = 3;        // ++
Blockly.Java.ORDER_DECREMENT = 3;        // --
Blockly.Java.ORDER_BITWISE_NOT = 4.1;    // ~
Blockly.Java.ORDER_UNARY_PLUS = 4.2;     // +
Blockly.Java.ORDER_UNARY_NEGATION = 4.3; // -
Blockly.Java.ORDER_LOGICAL_NOT = 4.4;    // !
//Blockly.Java.ORDER_TYPEOF = 4.5;         // typeof
Blockly.Java.ORDER_VOID = 4.6;           // void
//Blockly.Java.ORDER_DELETE = 4.7;         // delete
Blockly.Java.ORDER_DIVISION = 5.1;       // /
Blockly.Java.ORDER_MULTIPLICATION = 5.2; // *
Blockly.Java.ORDER_MODULUS = 5.3;        // %
Blockly.Java.ORDER_SUBTRACTION = 6.1;    // -
Blockly.Java.ORDER_ADDITION = 6.2;       // +
Blockly.Java.ORDER_BITWISE_SHIFT = 7;    // << >> >>>
Blockly.Java.ORDER_RELATIONAL = 8;       // < <= > >=
//Blockly.Java.ORDER_IN = 8;               // in
Blockly.Java.ORDER_INSTANCEOF = 8;       // instanceof
Blockly.Java.ORDER_EQUALITY = 9;         // == != === !==
Blockly.Java.ORDER_BITWISE_AND = 10;     // &
Blockly.Java.ORDER_BITWISE_XOR = 11;     // ^
Blockly.Java.ORDER_BITWISE_OR = 12;      // |
Blockly.Java.ORDER_LOGICAL_AND = 13;     // &&
Blockly.Java.ORDER_LOGICAL_OR = 14;      // ||
Blockly.Java.ORDER_CONDITIONAL = 15;     // ?:
Blockly.Java.ORDER_ASSIGNMENT = 16;      // = += -= *= /= %= <<= >>= ...
Blockly.Java.ORDER_COMMA = 17;           // ,
Blockly.Java.ORDER_NONE = 99;            // (...)

/**
 * List of outer-inner pairings that do NOT require parentheses.
 * @type {!Array.<!Array.<number>>}
 */
Blockly.Java.ORDER_OVERRIDES = [
  // (foo()).bar -> foo().bar
  // (foo())[0] -> foo()[0]
  [Blockly.Java.ORDER_FUNCTION_CALL, Blockly.Java.ORDER_MEMBER],
  // (foo())() -> foo()()
  [Blockly.Java.ORDER_FUNCTION_CALL, Blockly.Java.ORDER_FUNCTION_CALL],
  // (foo.bar).baz -> foo.bar.baz
  // (foo.bar)[0] -> foo.bar[0]
  // (foo[0]).bar -> foo[0].bar
  // (foo[0])[1] -> foo[0][1]
  [Blockly.Java.ORDER_MEMBER, Blockly.Java.ORDER_MEMBER],
  // (foo.bar)() -> foo.bar()
  // (foo[0])() -> foo[0]()
  [Blockly.Java.ORDER_MEMBER, Blockly.Java.ORDER_FUNCTION_CALL],

  // !(!foo) -> !!foo
  [Blockly.Java.ORDER_LOGICAL_NOT, Blockly.Java.ORDER_LOGICAL_NOT],
  // a * (b * c) -> a * b * c
  [Blockly.Java.ORDER_MULTIPLICATION, Blockly.Java.ORDER_MULTIPLICATION],
  // a + (b + c) -> a + b + c
  [Blockly.Java.ORDER_ADDITION, Blockly.Java.ORDER_ADDITION],
  // a && (b && c) -> a && b && c
  [Blockly.Java.ORDER_LOGICAL_AND, Blockly.Java.ORDER_LOGICAL_AND],
  // a || (b || c) -> a || b || c
  [Blockly.Java.ORDER_LOGICAL_OR, Blockly.Java.ORDER_LOGICAL_OR]
];

/**
 * Initialise the database of variable names.
 * @param {!Blockly.Workspace} workspace Workspace to generate code from.
 */
Blockly.Java.init = function(workspace) {
  // Create a dictionary of definitions to be printed before the code.
  Blockly.Java.definitions_ = Object.create(null);
  // Create a dictionary mapping desired function names in definitions_
  // to actual function names (to avoid collisions with user functions).
  Blockly.Java.functionNames_ = Object.create(null);

  if (!Blockly.Java.variableDB_) {
    Blockly.Java.variableDB_ =
        new Blockly.Names(Blockly.Java.RESERVED_WORDS_);
  } else {
    Blockly.Java.variableDB_.reset();
  }

  var defvars = [];
  var variables = workspace.variableList;
  if (variables.length) {
    for (var i = 0; i < variables.length; i++) {
      defvars[i] = Blockly.Java.variableDB_.getName(variables[i],
          Blockly.Variables.NAME_TYPE);
    }
    Blockly.Java.definitions_['variables'] =
        'Object ' + defvars.join(', ') + ';';
  }
};

/**
 * Prepend the generated code with the variable definitions.
 * @param {string} code Generated code.
 * @return {string} Completed code.
 */
Blockly.Java.finish = function(code) {
  // Convert the definitions dictionary into a list.
  var definitions = [];
  for (var name in Blockly.Java.definitions_) {
    definitions.push(Blockly.Java.definitions_[name]);
  }
  // Clean up temporary data.
  delete Blockly.Java.definitions_;
  delete Blockly.Java.functionNames_;
  Blockly.Java.variableDB_.reset();
  return definitions.join('\n\n') + '\n\n\n' + code;
};

/**
 * Naked values are top-level blocks with outputs that aren't plugged into
 * anything.  A trailing semicolon is needed to make this legal.
 * @param {string} line Line of generated code.
 * @return {string} Legal line of code.
 */
Blockly.Java.scrubNakedValue = function(line) {
  return line + ';\n';
};

/**
 * Encode a string as a properly escaped Java string, complete with
 * quotes.
 * @param {string} string Text to encode.
 * @return {string} Java string.
 * @private
 */
Blockly.Java.quote_ = function(string) {
  // Can't use goog.string.quote since Google's style guide recommends
  // JS string literals use single quotes.
  string = string.replace(/\\/g, '\\\\')
                 .replace(/\n/g, '\\\n')
                 .replace(/'/g, '\\\'');
  return '\'' + string + '\'';
};

/**
 * Common tasks for generating Java from blocks.
 * Handles comments for the specified block and any connected value blocks.
 * Calls any statements following this block.
 * @param {!Blockly.Block} block The current block.
 * @param {string} code The Java code created for this block.
 * @return {string} Java code with comments and subsequent blocks added.
 * @private
 */
Blockly.Java.scrub_ = function(block, code) {
  var commentCode = '';
  // Only collect comments for blocks that aren't inline.
  if (!block.outputConnection || !block.outputConnection.targetConnection) {
    // Collect comment for this block.
    var comment = block.getCommentText();
    comment = Blockly.utils.wrap(comment, Blockly.Java.COMMENT_WRAP - 3);
    if (comment) {
      if (block.getProcedureDef) {
        // Use a comment block for function comments.
        commentCode += '/**\n' +
                       Blockly.Java.prefixLines(comment + '\n', ' * ') +
                       ' */\n';
      } else {
        commentCode += Blockly.Java.prefixLines(comment + '\n', '// ');
      }
    }
    // Collect comments for all value arguments.
    // Don't collect comments for nested statements.
    for (var i = 0; i < block.inputList.length; i++) {
      if (block.inputList[i].type == Blockly.INPUT_VALUE) {
        var childBlock = block.inputList[i].connection.targetBlock();
        if (childBlock) {
          var comment = Blockly.Java.allNestedComments(childBlock);
          if (comment) {
            commentCode += Blockly.Java.prefixLines(comment, '// ');
          }
        }
      }
    }
  }
  var nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  var nextCode = Blockly.Java.blockToCode(nextBlock);
  return commentCode + code + nextCode;
};

/**
 * Gets a property and adjusts the value while taking into account indexing.
 * @param {!Blockly.Block} block The block.
 * @param {string} atId The property ID of the element to get.
 * @param {number=} opt_delta Value to add.
 * @param {boolean=} opt_negate Whether to negate the value.
 * @param {number=} opt_order The highest order acting on this value.
 * @return {string|number}
 */
Blockly.Java.getAdjusted = function(block, atId, opt_delta, opt_negate,
    opt_order) {
  var delta = opt_delta || 0;
  var order = opt_order || Blockly.Java.ORDER_NONE;
  if (block.workspace.options.oneBasedIndex) {
    delta--;
  }
  var defaultAtIndex = block.workspace.options.oneBasedIndex ? '1' : '0';
  if (delta > 0) {
    var at = Blockly.Java.valueToCode(block, atId,
        Blockly.Java.ORDER_ADDITION) || defaultAtIndex;
  } else if (delta < 0) {
    var at = Blockly.Java.valueToCode(block, atId,
        Blockly.Java.ORDER_SUBTRACTION) || defaultAtIndex;
  } else if (opt_negate) {
    var at = Blockly.Java.valueToCode(block, atId,
        Blockly.Java.ORDER_UNARY_NEGATION) || defaultAtIndex;
  } else {
    var at = Blockly.Java.valueToCode(block, atId, order) ||
        defaultAtIndex;
  }

  if (Blockly.isNumber(at)) {
    // If the index is a naked number, adjust it right now.
    at = parseFloat(at) + delta;
    if (opt_negate) {
      at = -at;
    }
  } else {
    // If the index is dynamic, adjust it in code.
    if (delta > 0) {
      at = at + ' + ' + delta;
      var innerOrder = Blockly.Java.ORDER_ADDITION;
    } else if (delta < 0) {
      at = at + ' - ' + -delta;
      var innerOrder = Blockly.Java.ORDER_SUBTRACTION;
    }
    if (opt_negate) {
      if (delta) {
        at = '-(' + at + ')';
      } else {
        at = '-' + at;
      }
      var innerOrder = Blockly.Java.ORDER_UNARY_NEGATION;
    }
    innerOrder = Math.floor(innerOrder);
    order = Math.floor(order);
    if (innerOrder && order >= innerOrder) {
      at = '(' + at + ')';
    }
  }
  return at;
};

//Logic
Blockly.Java['controls_if'] = function(block) {
  // If/elseif/else condition.
  var n = 0;
  var code = '', branchCode, conditionCode;
  do {
    conditionCode = Blockly.Java.valueToCode(block, 'IF' + n,
      Blockly.Java.ORDER_NONE) || 'false';
    branchCode = Blockly.Java.statementToCode(block, 'DO' + n);
    code += (n > 0 ? ' else ' : '') +
        'if (' + conditionCode + ') {\n' + branchCode + '}';

    ++n;
  } while (block.getInput('IF' + n));

  if (block.getInput('ELSE')) {
    branchCode = Blockly.Java.statementToCode(block, 'ELSE');
    code += ' else {\n' + branchCode + '}';
  }
  return code + '\n';
};

Blockly.Java['controls_ifelse'] = Blockly.Java['controls_if'];

Blockly.Java['logic_compare'] = function(block) {
  // Comparison operator.
  var OPERATORS = {
    'EQ': '==',
    'NEQ': '!=',
    'LT': '<',
    'LTE': '<=',
    'GT': '>',
    'GTE': '>='
  };
  var operator = OPERATORS[block.getFieldValue('OP')];
  var order = (operator == '==' || operator == '!=') ?
      Blockly.Java.ORDER_EQUALITY : Blockly.Java.ORDER_RELATIONAL;
  var argument0 = Blockly.Java.valueToCode(block, 'A', order) || '0';
  var argument1 = Blockly.Java.valueToCode(block, 'B', order) || '0';
  var code = argument0 + ' ' + operator + ' ' + argument1;
  return [code, order];
};

Blockly.Java['logic_operation'] = function(block) {
  // Operations 'and', 'or'.
  var operator = (block.getFieldValue('OP') == 'AND') ? '&&' : '||';
  var order = (operator == '&&') ? Blockly.Java.ORDER_LOGICAL_AND :
      Blockly.Java.ORDER_LOGICAL_OR;
  var argument0 = Blockly.Java.valueToCode(block, 'A', order);
  var argument1 = Blockly.Java.valueToCode(block, 'B', order);
  if (!argument0 && !argument1) {
    // If there are no arguments, then the return value is false.
    argument0 = 'false';
    argument1 = 'false';
  } else {
    // Single missing arguments have no effect on the return value.
    var defaultArgument = (operator == '&&') ? 'true' : 'false';
    if (!argument0) {
      argument0 = defaultArgument;
    }
    if (!argument1) {
      argument1 = defaultArgument;
    }
  }
  var code = argument0 + ' ' + operator + ' ' + argument1;
  return [code, order];
};

Blockly.Java['logic_negate'] = function(block) {
  // Negation.
  var order = Blockly.Java.ORDER_LOGICAL_NOT;
  var argument0 = Blockly.Java.valueToCode(block, 'BOOL', order) ||
      'true';
  var code = '!' + argument0;
  return [code, order];
};

Blockly.Java['logic_boolean'] = function(block) {
  // Boolean values true and false.
  var code = (block.getFieldValue('BOOL') == 'TRUE') ? 'true' : 'false';
  return [code, Blockly.Java.ORDER_ATOMIC];
};

Blockly.Java['logic_null'] = function(block) {
  // Null data type.
  return ['null', Blockly.Java.ORDER_ATOMIC];
};

Blockly.Java['logic_ternary'] = function(block) {
  // Ternary operator.
  var value_if = Blockly.Java.valueToCode(block, 'IF',
      Blockly.Java.ORDER_CONDITIONAL) || 'false';
  var value_then = Blockly.Java.valueToCode(block, 'THEN',
      Blockly.Java.ORDER_CONDITIONAL) || 'null';
  var value_else = Blockly.Java.valueToCode(block, 'ELSE',
      Blockly.Java.ORDER_CONDITIONAL) || 'null';
  var code = value_if + ' ? ' + value_then + ' : ' + value_else;
  return [code, Blockly.Java.ORDER_CONDITIONAL];
};

//Loops
Blockly.Java['controls_repeat_ext'] = function(block) {
  // Repeat n times.
  if (block.getField('TIMES')) {
    // Internal number.
    var repeats = String(Number(block.getFieldValue('TIMES')));
  } else {
    // External number.
    var repeats = Blockly.Java.valueToCode(block, 'TIMES',
        Blockly.Java.ORDER_ASSIGNMENT) || '0';
  }
  var branch = Blockly.Java.statementToCode(block, 'DO');
  branch = Blockly.Java.addLoopTrap(branch, block.id);
  var code = '';
  var loopVar = Blockly.Java.variableDB_.getDistinctName(
      'count', Blockly.Variables.NAME_TYPE);
  var endVar = repeats;
  if (!repeats.match(/^\w+$/) && !Blockly.isNumber(repeats)) {
    var endVar = Blockly.Java.variableDB_.getDistinctName(
        'repeat_end', Blockly.Variables.NAME_TYPE);
    code += 'int ' + endVar + ' = ' + repeats + ';\n';
  }
  code += 'for (int ' + loopVar + ' = 0; ' +
      loopVar + ' < ' + endVar + '; ' +
      loopVar + '++) {\n' +
      branch + '}\n';
  return code;
};

Blockly.Java['controls_repeat'] =
    Blockly.Java['controls_repeat_ext'];

Blockly.Java['controls_whileUntil'] = function(block) {
  // Do while/until loop.
  var until = block.getFieldValue('MODE') == 'UNTIL';
  var argument0 = Blockly.Java.valueToCode(block, 'BOOL',
      until ? Blockly.Java.ORDER_LOGICAL_NOT :
      Blockly.Java.ORDER_NONE) || 'false';
  var branch = Blockly.Java.statementToCode(block, 'DO');
  branch = Blockly.Java.addLoopTrap(branch, block.id);
  if (until) {
    argument0 = '!' + argument0;
  }
  return 'while (' + argument0 + ') {\n' + branch + '}\n';
};

Blockly.Java['controls_for'] = function(block) {
  // For loop.
  var variable0 = Blockly.Java.variableDB_.getName(
      block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
  var argument0 = Blockly.Java.valueToCode(block, 'FROM',
      Blockly.Java.ORDER_ASSIGNMENT) || '0';
  var argument1 = Blockly.Java.valueToCode(block, 'TO',
      Blockly.Java.ORDER_ASSIGNMENT) || '0';
  var increment = Blockly.Java.valueToCode(block, 'BY',
      Blockly.Java.ORDER_ASSIGNMENT) || '1';
  var branch = Blockly.Java.statementToCode(block, 'DO');
  branch = Blockly.Java.addLoopTrap(branch, block.id);
  var code;
  if (Blockly.isNumber(argument0) && Blockly.isNumber(argument1) &&
      Blockly.isNumber(increment)) {
    // All arguments are simple numbers.
    var up = parseFloat(argument0) <= parseFloat(argument1);
    code = 'for (' + variable0 + ' = ' + argument0 + '; ' +
        variable0 + (up ? ' <= ' : ' >= ') + argument1 + '; ' +
        variable0;
    var step = Math.abs(parseFloat(increment));
    if (step == 1) {
      code += up ? '++' : '--';
    } else {
      code += (up ? ' += ' : ' -= ') + step;
    }
    code += ') {\n' + branch + '}\n';
  } else {
    code = '';
    // Cache non-trivial values to variables to prevent repeated look-ups.
    var startVar = argument0;
    if (!argument0.match(/^\w+$/) && !Blockly.isNumber(argument0)) {
      startVar = Blockly.Java.variableDB_.getDistinctName(
          variable0 + '_start', Blockly.Variables.NAME_TYPE);
      code += 'int ' + startVar + ' = ' + argument0 + ';\n';
    }
    var endVar = argument1;
    if (!argument1.match(/^\w+$/) && !Blockly.isNumber(argument1)) {
      var endVar = Blockly.Java.variableDB_.getDistinctName(
          variable0 + '_end', Blockly.Variables.NAME_TYPE);
      code += 'int ' + endVar + ' = ' + argument1 + ';\n';
    }
    // Determine loop direction at start, in case one of the bounds
    // changes during loop execution.
    var incVar = Blockly.Java.variableDB_.getDistinctName(
        variable0 + '_inc', Blockly.Variables.NAME_TYPE);
    code += 'int ' + incVar + ' = ';
    if (Blockly.isNumber(increment)) {
      code += Math.abs(increment) + ';\n';
    } else {
      code += 'Math.abs(' + increment + ');\n';
    }
    code += 'if (' + startVar + ' > ' + endVar + ') {\n';
    code += Blockly.Java.INDENT + incVar + ' = -' + incVar + ';\n';
    code += '}\n';
    code += 'for (' + variable0 + ' = ' + startVar + '; ' +
        incVar + ' >= 0 ? ' +
        variable0 + ' <= ' + endVar + ' : ' +
        variable0 + ' >= ' + endVar + '; ' +
        variable0 + ' += ' + incVar + ') {\n' +
        branch + '}\n';
  }
  return code;
};

//TODO:forEach
Blockly.Java['controls_forEach'] = function(block) {
  // For each loop.
  var variable0 = Blockly.Java.variableDB_.getName(
      block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
  var argument0 = Blockly.Java.valueToCode(block, 'LIST',
      Blockly.Java.ORDER_ASSIGNMENT) || '[]';
  var branch = Blockly.Java.statementToCode(block, 'DO');
  branch = Blockly.Java.addLoopTrap(branch, block.id);
  var code = '';
  // Cache non-trivial values to variables to prevent repeated look-ups.
  var listVar = argument0;
  if (!argument0.match(/^\w+$/)) {
    listVar = Blockly.Java.variableDB_.getDistinctName(
        variable0 + '_list', Blockly.Variables.NAME_TYPE);
    code += 'Object ' + listVar + ' = ' + argument0 + ';\n';
  }
  var indexVar = Blockly.Java.variableDB_.getDistinctName(
      variable0 + '_index', Blockly.Variables.NAME_TYPE);
  branch = Blockly.Java.INDENT + variable0 + ' = ' +
      listVar + '[' + indexVar + '];\n' + branch;
  code += 'for (Object ' + indexVar + ' : ' + listVar + ') {\n' + branch + '}\n';
  return code;
};

Blockly.Java['controls_flow_statements'] = function(block) {
  // Flow statements: continue, break.
  switch (block.getFieldValue('FLOW')) {
    case 'BREAK':
      return 'break;\n';
    case 'CONTINUE':
      return 'continue;\n';
  }
  throw 'Unknown flow statement.';
};

//Math
Blockly.Java['math_number'] = function(block) {
  // Numeric value.
  var code = parseFloat(block.getFieldValue('NUM'));
  return [code, Blockly.Java.ORDER_ATOMIC];
};

Blockly.Java['math_arithmetic'] = function(block) {
  // Basic arithmetic operators, and power.
  var OPERATORS = {
    'ADD': [' + ', Blockly.Java.ORDER_ADDITION],
    'MINUS': [' - ', Blockly.Java.ORDER_SUBTRACTION],
    'MULTIPLY': [' * ', Blockly.Java.ORDER_MULTIPLICATION],
    'DIVIDE': [' / ', Blockly.Java.ORDER_DIVISION],
    'POWER': [null, Blockly.Java.ORDER_COMMA]  // Handle power separately.
  };
  var tuple = OPERATORS[block.getFieldValue('OP')];
  var operator = tuple[0];
  var order = tuple[1];
  var argument0 = Blockly.Java.valueToCode(block, 'A', order) || '0';
  var argument1 = Blockly.Java.valueToCode(block, 'B', order) || '0';
  var code;
  // Power in Java requires a special case since it has no operator.
  if (!operator) {
    code = 'Math.pow(' + argument0 + ', ' + argument1 + ')';
    return [code, Blockly.Java.ORDER_FUNCTION_CALL];
  }
  code = argument0 + operator + argument1;
  return [code, order];
};

Blockly.Java['math_single'] = function(block) {
  // Math operators with single operand.
  var operator = block.getFieldValue('OP');
  var code;
  var arg;
  if (operator == 'NEG') {
    // Negation is a special case given its different operator precedence.
    arg = Blockly.Java.valueToCode(block, 'NUM',
        Blockly.Java.ORDER_UNARY_NEGATION) || '0';
    if (arg[0] == '-') {
      // --3 is not legal in JS.
      arg = ' ' + arg;
    }
    code = '-' + arg;
    return [code, Blockly.Java.ORDER_UNARY_NEGATION];
  }
  if (operator == 'SIN' || operator == 'COS' || operator == 'TAN') {
    arg = Blockly.Java.valueToCode(block, 'NUM',
        Blockly.Java.ORDER_DIVISION) || '0';
  } else {
    arg = Blockly.Java.valueToCode(block, 'NUM',
        Blockly.Java.ORDER_NONE) || '0';
  }
  // First, handle cases which generate values that don't need parentheses
  // wrapping the code.
  switch (operator) {
    case 'ABS':
      code = 'Math.abs(' + arg + ')';
      break;
    case 'ROOT':
      code = 'Math.sqrt(' + arg + ')';
      break;
    case 'LN':
      code = 'Math.log(' + arg + ')';
      break;
    case 'EXP':
      code = 'Math.exp(' + arg + ')';
      break;
    case 'POW10':
      code = 'Math.pow(10,' + arg + ')';
      break;
    case 'ROUND':
      code = 'Math.round(' + arg + ')';
      break;
    case 'ROUNDUP':
      code = 'Math.ceil(' + arg + ')';
      break;
    case 'ROUNDDOWN':
      code = 'Math.floor(' + arg + ')';
      break;
    case 'SIN':
      code = 'Math.sin(' + arg + ' / 180 * Math.PI)';
      break;
    case 'COS':
      code = 'Math.cos(' + arg + ' / 180 * Math.PI)';
      break;
    case 'TAN':
      code = 'Math.tan(' + arg + ' / 180 * Math.PI)';
      break;
  }
  if (code) {
    return [code, Blockly.Java.ORDER_FUNCTION_CALL];
  }
  // Second, handle cases which generate values that may need parentheses
  // wrapping the code.
  switch (operator) {
    case 'LOG10':
      code = 'Math.log(' + arg + ') / Math.log(10)';
      break;
    case 'ASIN':
      code = 'Math.asin(' + arg + ') / Math.PI * 180';
      break;
    case 'ACOS':
      code = 'Math.acos(' + arg + ') / Math.PI * 180';
      break;
    case 'ATAN':
      code = 'Math.atan(' + arg + ') / Math.PI * 180';
      break;
    default:
      throw 'Unknown math operator: ' + operator;
  }
  return [code, Blockly.Java.ORDER_DIVISION];
};

Blockly.Java['math_constant'] = function(block) {
  // Constants: PI, E, the Golden Ratio, sqrt(2), 1/sqrt(2), INFINITY.
  var CONSTANTS = {
    'PI': ['Math.PI', Blockly.Java.ORDER_MEMBER],
    'E': ['Math.E', Blockly.Java.ORDER_MEMBER],
    'GOLDEN_RATIO':
        ['(1 + Math.sqrt(5)) / 2', Blockly.Java.ORDER_DIVISION],
    'SQRT2': ['Math.SQRT2', Blockly.Java.ORDER_MEMBER],
    'SQRT1_2': ['Math.SQRT1_2', Blockly.Java.ORDER_MEMBER],
    'INFINITY': ['Infinity', Blockly.Java.ORDER_ATOMIC]
  };
  return CONSTANTS[block.getFieldValue('CONSTANT')];
};

//TODO:PRIME
Blockly.Java['math_number_property'] = function(block) {
  // Check if a number is even, odd, prime, whole, positive, or negative
  // or if it is divisible by certain number. Returns true or false.
  var number_to_check = Blockly.Java.valueToCode(block, 'NUMBER_TO_CHECK',
      Blockly.Java.ORDER_MODULUS) || '0';
  var dropdown_property = block.getFieldValue('PROPERTY');
  var code;
  if (dropdown_property == 'PRIME') {
    // Prime is a special case as it is not a one-liner test.
    var functionName = Blockly.Java.provideFunction_(
        'mathIsPrime',
        ['function ' + Blockly.Java.FUNCTION_NAME_PLACEHOLDER_ + '(n) {',
         '  // https://en.wikipedia.org/wiki/Primality_test#Naive_methods',
         '  if (n == 2 || n == 3) {',
         '    return true;',
         '  }',
         '  // False if n is NaN, negative, is 1, or not whole.',
         '  // And false if n is divisible by 2 or 3.',
         '  if (isNaN(n) || n <= 1 || n % 1 != 0 || n % 2 == 0 ||' +
            ' n % 3 == 0) {',
         '    return false;',
         '  }',
         '  // Check all the numbers of form 6k +/- 1, up to sqrt(n).',
         '  for (var x = 6; x <= Math.sqrt(n) + 1; x += 6) {',
         '    if (n % (x - 1) == 0 || n % (x + 1) == 0) {',
         '      return false;',
         '    }',
         '  }',
         '  return true;',
         '}']);
    code = functionName + '(' + number_to_check + ')';
    return [code, Blockly.Java.ORDER_FUNCTION_CALL];
  }
  switch (dropdown_property) {
    case 'EVEN':
      code = number_to_check + ' % 2 == 0';
      break;
    case 'ODD':
      code = number_to_check + ' % 2 == 1';
      break;
    case 'WHOLE':
      code = number_to_check + ' % 1 == 0';
      break;
    case 'POSITIVE':
      code = number_to_check + ' > 0';
      break;
    case 'NEGATIVE':
      code = number_to_check + ' < 0';
      break;
    case 'DIVISIBLE_BY':
      var divisor = Blockly.Java.valueToCode(block, 'DIVISOR',
          Blockly.Java.ORDER_MODULUS) || '0';
      code = number_to_check + ' % ' + divisor + ' == 0';
      break;
  }
  return [code, Blockly.Java.ORDER_EQUALITY];
};

Blockly.Java['math_change'] = function(block) {
  // Add to a variable in place.
  var argument0 = Blockly.Java.valueToCode(block, 'DELTA',
      Blockly.Java.ORDER_ADDITION) || '0';
  var varName = Blockly.Java.variableDB_.getName(
      block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
  return varName + ' = (typeof ' + varName + ' == \'number\' ? ' + varName +
      ' : 0) + ' + argument0 + ';\n';
};

// Rounding functions have a single operand.
Blockly.Java['math_round'] = Blockly.Java['math_single'];
// Trigonometry functions have a single operand.
Blockly.Java['math_trig'] = Blockly.Java['math_single'];


Blockly.Java['math_modulo'] = function(block) {
  // Remainder computation.
  var argument0 = Blockly.Java.valueToCode(block, 'DIVIDEND',
      Blockly.Java.ORDER_MODULUS) || '0';
  var argument1 = Blockly.Java.valueToCode(block, 'DIVISOR',
      Blockly.Java.ORDER_MODULUS) || '0';
  var code = argument0 + ' % ' + argument1;
  return [code, Blockly.Java.ORDER_MODULUS];
};

Blockly.Java['math_constrain'] = function(block) {
  // Constrain a number between two limits.
  var argument0 = Blockly.Java.valueToCode(block, 'VALUE',
      Blockly.Java.ORDER_COMMA) || '0';
  var argument1 = Blockly.Java.valueToCode(block, 'LOW',
      Blockly.Java.ORDER_COMMA) || '0';
  var argument2 = Blockly.Java.valueToCode(block, 'HIGH',
      Blockly.Java.ORDER_COMMA) || 'Infinity';
  var code = 'Math.min(Math.max(' + argument0 + ', ' + argument1 + '), ' +
      argument2 + ')';
  return [code, Blockly.Java.ORDER_FUNCTION_CALL];
};

Blockly.Java['math_random_int'] = function(block) {
  // Random integer between [X] and [Y].
  var argument0 = Blockly.Java.valueToCode(block, 'FROM',
      Blockly.Java.ORDER_COMMA) || '0';
  var argument1 = Blockly.Java.valueToCode(block, 'TO',
      Blockly.Java.ORDER_COMMA) || '0';
  var functionName = Blockly.Java.provideFunction_(
      'mathRandomInt',
      ['function ' + Blockly.Java.FUNCTION_NAME_PLACEHOLDER_ +
          '(a, b) {',
       '  if (a > b) {',
       '    // Swap a and b to ensure a is smaller.',
       '    var c = a;',
       '    a = b;',
       '    b = c;',
       '  }',
       '  return Math.floor(Math.random() * (b - a + 1) + a);',
       '}']);
  var code = functionName + '(' + argument0 + ', ' + argument1 + ')';
  return [code, Blockly.Java.ORDER_FUNCTION_CALL];
};

Blockly.Java['math_random_float'] = function(block) {
  // Random fraction between 0 and 1.
  return ['Math.random()', Blockly.Java.ORDER_FUNCTION_CALL];
};

//Text
Blockly.Java['text'] = function(block) {
  // Text value.
  var code = Blockly.Java.quote_(block.getFieldValue('TEXT'));
  return [code, Blockly.Java.ORDER_ATOMIC];
};

Blockly.Java['text_join'] = function(block) {
  // Create a string made up of any number of elements of any type.
  switch (block.itemCount_) {
    case 0:
      return ['\'\'', Blockly.Java.ORDER_ATOMIC];
    case 1:
      var element = Blockly.Java.valueToCode(block, 'ADD0',
          Blockly.Java.ORDER_NONE) || '\'\'';
      var code = 'String(' + element + ')';
      return [code, Blockly.Java.ORDER_FUNCTION_CALL];
    case 2:
      var element0 = Blockly.Java.valueToCode(block, 'ADD0',
          Blockly.Java.ORDER_NONE) || '\'\'';
      var element1 = Blockly.Java.valueToCode(block, 'ADD1',
          Blockly.Java.ORDER_NONE) || '\'\'';
      var code = 'String(' + element0 + ') + String(' + element1 + ')';
      return [code, Blockly.Java.ORDER_ADDITION];
    default:
      var elements = new Array(block.itemCount_);
      for (var i = 0; i < block.itemCount_; i++) {
        elements[i] = Blockly.Java.valueToCode(block, 'ADD' + i,
            Blockly.Java.ORDER_COMMA) || '\'\'';
      }
      var code = '[' + elements.join(',') + '].join(\'\')';
      return [code, Blockly.Java.ORDER_FUNCTION_CALL];
  }
};

Blockly.Java['text_append'] = function(block) {
  // Append to a variable in place.
  var varName = Blockly.Java.variableDB_.getName(
      block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
  var value = Blockly.Java.valueToCode(block, 'TEXT',
      Blockly.Java.ORDER_NONE) || '\'\'';
  return varName + ' = String(' + varName + ') + String(' + value + ');\n';
};

Blockly.Java['text_length'] = function(block) {
  // String or array length.
  var text = Blockly.Java.valueToCode(block, 'VALUE',
      Blockly.Java.ORDER_FUNCTION_CALL) || '\'\'';
  return [text + '.length', Blockly.Java.ORDER_MEMBER];
};

Blockly.Java['text_isEmpty'] = function(block) {
  // Is the string null or array empty?
  var text = Blockly.Java.valueToCode(block, 'VALUE',
      Blockly.Java.ORDER_MEMBER) || '\'\'';
  return ['!' + text + '.length', Blockly.Java.ORDER_LOGICAL_NOT];
};

Blockly.Java['text_indexOf'] = function(block) {
  // Search the text for a substring.
  var operator = block.getFieldValue('END') == 'FIRST' ?
      'indexOf' : 'lastIndexOf';
  var substring = Blockly.Java.valueToCode(block, 'FIND',
      Blockly.Java.ORDER_NONE) || '\'\'';
  var text = Blockly.Java.valueToCode(block, 'VALUE',
      Blockly.Java.ORDER_MEMBER) || '\'\'';
  var code = text + '.' + operator + '(' + substring + ')';
  // Adjust index if using one-based indices.
  if (block.workspace.options.oneBasedIndex) {
    return [code + ' + 1', Blockly.Java.ORDER_ADDITION];
  }
  return [code, Blockly.Java.ORDER_FUNCTION_CALL];
};

Blockly.Java['text_charAt'] = function(block) {
  // Get letter at index.
  // Note: Until January 2013 this block did not have the WHERE input.
  var where = block.getFieldValue('WHERE') || 'FROM_START';
  var textOrder = (where == 'RANDOM') ? Blockly.Java.ORDER_NONE :
      Blockly.Java.ORDER_MEMBER;
  var text = Blockly.Java.valueToCode(block, 'VALUE',
      textOrder) || '\'\'';
  switch (where) {
    case 'FIRST':
      var code = text + '.charAt(0)';
      return [code, Blockly.Java.ORDER_FUNCTION_CALL];
    case 'LAST':
      var code = text + '.slice(-1)';
      return [code, Blockly.Java.ORDER_FUNCTION_CALL];
    case 'FROM_START':
      var at = Blockly.Java.getAdjusted(block, 'AT');
      // Adjust index if using one-based indices.
      var code = text + '.charAt(' + at + ')';
      return [code, Blockly.Java.ORDER_FUNCTION_CALL];
    case 'FROM_END':
      var at = Blockly.Java.getAdjusted(block, 'AT', 1, true);
      var code = text + '.slice(' + at + ').charAt(0)';
      return [code, Blockly.Java.ORDER_FUNCTION_CALL];
    case 'RANDOM':
      var functionName = Blockly.Java.provideFunction_(
          'textRandomLetter',
          ['function ' + Blockly.Java.FUNCTION_NAME_PLACEHOLDER_ +
              '(text) {',
           '  var x = Math.floor(Math.random() * text.length);',
           '  return text[x];',
           '}']);
      var code = functionName + '(' + text + ')';
      return [code, Blockly.Java.ORDER_FUNCTION_CALL];
  }
  throw 'Unhandled option (text_charAt).';
};

/**
 * Returns an expression calculating the index into a string.
 * @private
 * @param {string} stringName Name of the string, used to calculate length.
 * @param {string} where The method of indexing, selected by dropdown in Blockly
 * @param {string=} opt_at The optional offset when indexing from start/end.
 * @return {string} Index expression.
 */
Blockly.Java.text.getIndex_ = function(stringName, where, opt_at) {
  if (where == 'FIRST') {
    return '0';
  } else if (where == 'FROM_END') {
    return stringName + '.length - 1 - ' + opt_at;
  } else if (where == 'LAST') {
    return stringName + '.length - 1';
  } else {
    return opt_at;
  }
};

Blockly.Java['text_getSubstring'] = function(block) {
  // Get substring.
  var text = Blockly.Java.valueToCode(block, 'STRING',
      Blockly.Java.ORDER_FUNCTION_CALL) || '\'\'';
  var where1 = block.getFieldValue('WHERE1');
  var where2 = block.getFieldValue('WHERE2');
  if (where1 == 'FIRST' && where2 == 'LAST') {
    var code = text;
  } else if (text.match(/^'?\w+'?$/) ||
      (where1 != 'FROM_END' && where1 != 'LAST' &&
      where2 != 'FROM_END' && where2 != 'LAST')) {
    // If the text is a variable or literal or doesn't require a call for
    // length, don't generate a helper function.
    switch (where1) {
      case 'FROM_START':
        var at1 = Blockly.Java.getAdjusted(block, 'AT1');
        break;
      case 'FROM_END':
        var at1 = Blockly.Java.getAdjusted(block, 'AT1', 1, false,
            Blockly.Java.ORDER_SUBTRACTION);
        at1 = text + '.length - ' + at1;
        break;
      case 'FIRST':
        var at1 = '0';
        break;
      default:
        throw 'Unhandled option (text_getSubstring).';
    }
    switch (where2) {
      case 'FROM_START':
        var at2 = Blockly.Java.getAdjusted(block, 'AT2', 1);
        break;
      case 'FROM_END':
        var at2 = Blockly.Java.getAdjusted(block, 'AT2', 0, false,
            Blockly.Java.ORDER_SUBTRACTION);
        at2 = text + '.length - ' + at2;
        break;
      case 'LAST':
        var at2 = text + '.length';
        break;
      default:
        throw 'Unhandled option (text_getSubstring).';
    }
    code = text + '.slice(' + at1 + ', ' + at2 + ')';
  } else {
    var at1 = Blockly.Java.getAdjusted(block, 'AT1');
    var at2 = Blockly.Java.getAdjusted(block, 'AT2');
    var getIndex_ = Blockly.Java.text.getIndex_;
    var wherePascalCase = {'FIRST': 'First', 'LAST': 'Last',
      'FROM_START': 'FromStart', 'FROM_END': 'FromEnd'};
    var functionName = Blockly.Java.provideFunction_(
        'subsequence' + wherePascalCase[where1] + wherePascalCase[where2],
        ['function ' + Blockly.Java.FUNCTION_NAME_PLACEHOLDER_ +
        '(sequence' +
        // The value for 'FROM_END' and'FROM_START' depends on `at` so
        // we add it as a parameter.
        ((where1 == 'FROM_END' || where1 == 'FROM_START') ? ', at1' : '') +
        ((where2 == 'FROM_END' || where2 == 'FROM_START') ? ', at2' : '') +
        ') {',
          '  var start = ' + getIndex_('sequence', where1, 'at1') + ';',
          '  var end = ' + getIndex_('sequence', where2, 'at2') + ' + 1;',
          '  return sequence.slice(start, end);',
          '}']);
    var code = functionName + '(' + text +
        // The value for 'FROM_END' and 'FROM_START' depends on `at` so we
        // pass it.
        ((where1 == 'FROM_END' || where1 == 'FROM_START') ? ', ' + at1 : '') +
        ((where2 == 'FROM_END' || where2 == 'FROM_START') ? ', ' + at2 : '') +
        ')';
  }
  return [code, Blockly.Java.ORDER_FUNCTION_CALL];
};

Blockly.Java['text_changeCase'] = function(block) {
  // Change capitalization.
  var OPERATORS = {
    'UPPERCASE': '.toUpperCase()',
    'LOWERCASE': '.toLowerCase()',
    'TITLECASE': null
  };
  var operator = OPERATORS[block.getFieldValue('CASE')];
  var textOrder = operator ? Blockly.Java.ORDER_MEMBER :
      Blockly.Java.ORDER_NONE;
  var text = Blockly.Java.valueToCode(block, 'TEXT',
      textOrder) || '\'\'';
  if (operator) {
    // Upper and lower case are functions built into Java.
    var code = text + operator;
  } else {
    // Title case is not a native Java function.  Define one.
    var functionName = Blockly.Java.provideFunction_(
        'textToTitleCase',
        ['function ' + Blockly.Java.FUNCTION_NAME_PLACEHOLDER_ +
            '(str) {',
         '  return str.replace(/\\S+/g,',
         '      function(txt) {return txt[0].toUpperCase() + ' +
            'txt.substring(1).toLowerCase();});',
         '}']);
    var code = functionName + '(' + text + ')';
  }
  return [code, Blockly.Java.ORDER_FUNCTION_CALL];
};

Blockly.Java['text_trim'] = function(block) {
  // Trim spaces.
  var OPERATORS = {
    'LEFT': ".replace(/^[\\s\\xa0]+/, '')",
    'RIGHT': ".replace(/[\\s\\xa0]+$/, '')",
    'BOTH': '.trim()'
  };
  var operator = OPERATORS[block.getFieldValue('MODE')];
  var text = Blockly.Java.valueToCode(block, 'TEXT',
      Blockly.Java.ORDER_MEMBER) || '\'\'';
  return [text + operator, Blockly.Java.ORDER_FUNCTION_CALL];
};

Blockly.Java['text_print'] = function(block) {
  // Print statement.
  var msg = Blockly.Java.valueToCode(block, 'TEXT',
      Blockly.Java.ORDER_NONE) || '\'\'';
  return 'window.alert(' + msg + ');\n';
};

Blockly.Java['text_prompt_ext'] = function(block) {
  // Prompt function.
  if (block.getField('TEXT')) {
    // Internal message.
    var msg = Blockly.Java.quote_(block.getFieldValue('TEXT'));
  } else {
    // External message.
    var msg = Blockly.Java.valueToCode(block, 'TEXT',
        Blockly.Java.ORDER_NONE) || '\'\'';
  }
  var code = 'window.prompt(' + msg + ')';
  var toNumber = block.getFieldValue('TYPE') == 'NUMBER';
  if (toNumber) {
    code = 'parseFloat(' + code + ')';
  }
  return [code, Blockly.Java.ORDER_FUNCTION_CALL];
};

Blockly.Java['text_prompt'] = Blockly.Java['text_prompt_ext'];

//Variables
Blockly.Java['variables_get'] = function(block) {
  // Variable getter.
  var code = Blockly.Java.variableDB_.getName(block.getFieldValue('VAR'),
      Blockly.Variables.NAME_TYPE);
  return [code, Blockly.Java.ORDER_ATOMIC];
};

Blockly.Java['variables_set'] = function(block) {
  // Variable setter.
  var argument0 = Blockly.Java.valueToCode(block, 'VALUE',
      Blockly.Java.ORDER_ASSIGNMENT) || '0';
  var varName = Blockly.Java.variableDB_.getName(
      block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
  return varName + ' = ' + argument0 + ';\n';
};

//Procedures
Blockly.Java['procedures_defreturn'] = function(block) {
  // Define a procedure with a return value.
  var funcName = Blockly.Java.variableDB_.getName(
      block.getFieldValue('NAME'), Blockly.Procedures.NAME_TYPE);
  var branch = Blockly.Java.statementToCode(block, 'STACK');
  if (Blockly.Java.STATEMENT_PREFIX) {
    branch = Blockly.Java.prefixLines(
        Blockly.Java.STATEMENT_PREFIX.replace(/%1/g,
        '\'' + block.id + '\''), Blockly.Java.INDENT) + branch;
  }
  if (Blockly.Java.INFINITE_LOOP_TRAP) {
    branch = Blockly.Java.INFINITE_LOOP_TRAP.replace(/%1/g,
        '\'' + block.id + '\'') + branch;
  }
  var returnValue = Blockly.Java.valueToCode(block, 'RETURN',
      Blockly.Java.ORDER_NONE) || '';
  if (returnValue) {
    returnValue = '  return ' + returnValue + ';\n';
  }
  var args = [];
  for (var i = 0; i < block.arguments_.length; i++) {
    args[i] = Blockly.Java.variableDB_.getName(block.arguments_[i],
        Blockly.Variables.NAME_TYPE);
  }
  var code = 'public ' + (returnValue?'Object ':'void ') + funcName + '(' + args.join(', ') + ') {\n' +
      branch + returnValue + '}';
  code = Blockly.Java.scrub_(block, code);
  // Add % so as not to collide with helper functions in definitions list.
  Blockly.Java.definitions_['%' + funcName] = code;
  return null;
};

// Defining a procedure without a return value uses the same generator as
// a procedure with a return value.
Blockly.Java['procedures_defnoreturn'] =
    Blockly.Java['procedures_defreturn'];

Blockly.Java['procedures_callreturn'] = function(block) {
  // Call a procedure with a return value.
  var funcName = Blockly.Java.variableDB_.getName(
      block.getFieldValue('NAME'), Blockly.Procedures.NAME_TYPE);
  var args = [];
  for (var i = 0; i < block.arguments_.length; i++) {
    args[i] = Blockly.Java.valueToCode(block, 'ARG' + i,
        Blockly.Java.ORDER_COMMA) || 'null';
  }
  var code = funcName + '(' + args.join(', ') + ')';
  return [code, Blockly.Java.ORDER_FUNCTION_CALL];
};

Blockly.Java['procedures_callnoreturn'] = function(block) {
  // Call a procedure with no return value.
  var funcName = Blockly.Java.variableDB_.getName(
      block.getFieldValue('NAME'), Blockly.Procedures.NAME_TYPE);
  var args = [];
  for (var i = 0; i < block.arguments_.length; i++) {
    args[i] = Blockly.Java.valueToCode(block, 'ARG' + i,
        Blockly.Java.ORDER_COMMA) || 'null';
  }
  var code = funcName + '(' + args.join(', ') + ');\n';
  return code;
};

Blockly.Java['procedures_ifreturn'] = function(block) {
  // Conditionally return value from a procedure.
  var condition = Blockly.Java.valueToCode(block, 'CONDITION',
      Blockly.Java.ORDER_NONE) || 'false';
  var code = 'if (' + condition + ') {\n';
  if (block.hasReturnValue_) {
    var value = Blockly.Java.valueToCode(block, 'VALUE',
        Blockly.Java.ORDER_NONE) || 'null';
    code += '  return ' + value + ';\n';
  } else {
    code += '  return;\n';
  }
  code += '}\n';
  return code;
};