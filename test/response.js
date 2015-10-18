var tape = require("tape"),
    http = require("http"),
    request = require("request"),
    ri = require("..");


function createServer(callback) {
    var server = new http.Server(function(req, res) {
        ri.init(req, res);

        if (callback) {
            callback(req, res);
        }
        res.end();
        server.close();
    });

    server.listen(9999);
}

function makeRequest(done) {
    request.get("http://localhost:9999/time?id=1", {
        headers: {
            "Content-Type": "application/json",
            "Content-Length": "0"
        },
        success: function() {
            done();
        },
        error: function(response) {
            done(response.data);
        }
    });
}

tape("Response #charset - it should return charset from request object", function(assert) {
    createServer(function(req, res) {
        assert.equal(res.charset, "utf-8");
        assert.equal(res.charset, "utf-8");
    });

    makeRequest(assert.end);
});

tape("Response #contentType - it should return Content Type from request object", function(assert) {
    createServer(function(req, res) {
        res.setHeader("Content-Type", "application/json");
        assert.equal(res.contentType, "application/json");
        assert.equal(res.contentType, "application/json");
    });

    makeRequest(assert.end);
});

tape("Response #contentLength - it should return Content Length from request object", function(assert) {
    createServer(function(req, res) {
        assert.equal(res.contentLength, 0);
        assert.equal(res.contentLength, 0);
    });

    makeRequest(assert.end);
});
