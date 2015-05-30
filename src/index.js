var ri = exports;


ri.Request = require("./request");
ri.Response = require("./response");


ri.init = function(req, res, config) {
    res.init(req, config);
    req.init(res, config);
};
