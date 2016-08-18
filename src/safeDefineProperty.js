var has = require("@nathanfaucett/has");


var defineProperty = Object.defineProperty;


module.exports = safeDefineProperty;


function safeDefineProperty(object, prop, desc) {
    if (!has(object, prop)) {
        defineProperty(object, prop, desc);
    }
}
