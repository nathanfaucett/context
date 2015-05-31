var has = require("has");


var defineProperty = Object.defineProperty;


module.exports = safeDefineProperty;


function safeDefineProperty(obj, prop, desc) {
    if (!has(obj, prop)) {
        defineProperty(obj, prop, desc);
    }
}
