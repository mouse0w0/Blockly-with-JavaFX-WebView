var toolboxText = document.getElementById('toolbox').outerHTML;
toolboxText = toolboxText.replace(/{(\w+)}/g, function(m, p1) {return I18n[p1];});
var toolboxXml = Blockly.Xml.textToDom(toolboxText);

var workspace = Blockly.inject('blocklyDiv',
{toolbox: document.getElementById('toolbox'),
toolbox: toolboxXml,
zoom:
{controls: true,
wheel: false,
startScale: 1.0,
maxScale: 3,
minScale: 0.3,
scaleSpeed: 1.2},
trashcan: true});