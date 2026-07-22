const { alert } = require('forgedialog/alert');
const { makeDraggable } = require('forgedialog/interactions');

if (typeof alert !== 'function' || typeof makeDraggable !== 'function') process.exitCode = 1;
