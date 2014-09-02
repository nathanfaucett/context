var utils = require("utils");


function Cookie(name, value, unparsed, opts) {
    if (utils.isObject(unparsed)) {
        opts = unparsed;
        unparsed = null;
    }
    opts || (opts = {});

    this.name = name;
    this.value = value;
    this.path = opts.path || null;
    this.domain = opts.domain || null;
    this.expires = opts.expires || null;
    this.maxAge = opts.maxAge || null;
    this.secure = !! opts.secure || null;
    this.httpOnly = opts.httpOnly != null ? !! opts.httpOnly : true;
    this.unparsed = unparsed;
}

Cookie.prototype.serialize = function() {
    var str = this.name + "=" + encodeURIComponent(this.value);

    if ((this.maxAge = +this.maxAge)) this.expires = new Date(Date.now() + this.maxAge);

    if (this.path) str += "; Path=" + this.path;
    if (this.domain) str += "; Domain=" + this.domain;
    if (this.expires) str += "; Expires=" + this.expires.toUTCString();
    if (this.httpOnly) str += "; HttpOnly";
    if (this.secure) str += "; Secure";

    return str;
};

Cookie.prototype.toString = Cookie.prototype.serialize;


module.exports = Cookie;
