Context
=======

response and request helpers


```javascript
var context = require("context");

server.on("request", function(req, res) {
    context.init(req, res);
    req.app = res.app = app;
});

//override methods or add new ones, to both the context.Request and the context.Response
context.Request.prototype.JSONstringify = function() {
    var app = this.app;
    
    return JSON.stringify(body, app.get("json replacer"), app.get("json spaces"));
}
```