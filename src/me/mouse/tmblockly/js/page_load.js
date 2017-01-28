var workspace = Blockly.inject('blocklyDiv',
{toolbox: document.getElementById('toolbox'),
zoom:
{controls: true,
wheel: false,
startScale: 1.0,
maxScale: 3,
minScale: 0.3,
scaleSpeed: 1.2},
trashcan: true});