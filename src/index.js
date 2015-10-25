var ri = exports;


ri.Request = require("./Request");
ri.Response = require("./Response");

ri.parseCookie = require("./parseCookie");
ri.parseCookies = require("./parseCookies");

ri.init = function(req, res, config) {
    res.init(req, config);
    req.init(res, config);
};
