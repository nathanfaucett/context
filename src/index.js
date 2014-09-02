var context = module.exports;


context.Request = require("./request");
context.Response = require("./response");
context.Cookie = require("./cookie");

context.init = function(req, res) {
    res.init(req);
    req.init(res);
};