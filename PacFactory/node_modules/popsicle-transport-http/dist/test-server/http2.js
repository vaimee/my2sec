"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tlsServer = exports.server = void 0;
const http2_1 = require("http2");
const fs_1 = require("fs");
const path_1 = require("path");
const url_1 = require("url");
const app = (req, res) => {
    var _a;
    const url = new url_1.URL((_a = req.url) !== null && _a !== void 0 ? _a : "", "http://localhost");
    if (url.pathname === "/close") {
        res.destroy();
        return;
    }
    if (url.pathname === "/timeout") {
        return;
    }
    if (url.pathname === "/download") {
        res.setHeader("Content-Length", 12);
        res.write("hello ");
        setTimeout(function () {
            if (req.aborted)
                return;
            res.write("world!");
            res.end();
        }, 200);
        return;
    }
    res.end("Success");
};
exports.server = http2_1.createServer(app);
exports.tlsServer = http2_1.createSecureServer({
    key: fs_1.readFileSync(path_1.join(__dirname, "support/server-key.pem")),
    cert: fs_1.readFileSync(path_1.join(__dirname, "support/server-crt.pem")),
    ca: fs_1.readFileSync(path_1.join(__dirname, "support/ca-crt.pem")),
    allowHTTP1: true,
}, app);
//# sourceMappingURL=http2.js.map