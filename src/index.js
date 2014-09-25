var context = module.exports;


context.Request = require("./request");
context.Response = require("./response");
context.Cookie = require("./cookie");


context.init = function(req, res, config) {

    res.init(req, config);
    req.init(res, config);
};
