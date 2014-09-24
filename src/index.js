var createConfig = require("config"),
    context = module.exports;


context.Request = require("./request");
context.Response = require("./response");
context.Cookie = require("./cookie");


context.createInit = function(options) {
    var config = createConfig(options);

    function init(req, res) {

        res.init(req, config);
        req.init(res, config);
    }

    init.config = config;

    return init;
};
