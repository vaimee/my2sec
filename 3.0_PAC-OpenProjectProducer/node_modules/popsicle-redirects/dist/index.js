"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redirects = exports.MaxRedirectsError = void 0;
const url_1 = require("url");
/**
 * Redirection types to handle.
 */
var REDIRECT_TYPE;
(function (REDIRECT_TYPE) {
    REDIRECT_TYPE[REDIRECT_TYPE["FOLLOW_WITH_GET"] = 0] = "FOLLOW_WITH_GET";
    REDIRECT_TYPE[REDIRECT_TYPE["FOLLOW_WITH_CONFIRMATION"] = 1] = "FOLLOW_WITH_CONFIRMATION";
})(REDIRECT_TYPE || (REDIRECT_TYPE = {}));
/**
 * Possible redirection status codes.
 */
const REDIRECT_STATUS = {
    "301": REDIRECT_TYPE.FOLLOW_WITH_GET,
    "302": REDIRECT_TYPE.FOLLOW_WITH_GET,
    "303": REDIRECT_TYPE.FOLLOW_WITH_GET,
    "307": REDIRECT_TYPE.FOLLOW_WITH_CONFIRMATION,
    "308": REDIRECT_TYPE.FOLLOW_WITH_CONFIRMATION,
};
/**
 * Maximum redirects error.
 */
class MaxRedirectsError extends Error {
    constructor(request, message) {
        super(message);
        this.request = request;
        this.code = "EMAXREDIRECTS";
    }
}
exports.MaxRedirectsError = MaxRedirectsError;
/**
 * Create a new request object and tidy up any loose ends to avoid leaking info.
 */
function safeRedirect(initReq) {
    const originalUrl = new url_1.URL(initReq.url);
    return (req, location, method) => {
        const newUrl = new url_1.URL(location, req.url);
        req.signal.emit("redirect", newUrl.toString());
        const newRequest = initReq.clone();
        newRequest.url = newUrl.toString();
        newRequest.method = method;
        // Delete cookie header when leaving the original URL.
        if (newUrl.origin !== originalUrl.origin) {
            newRequest.headers.delete("cookie");
            newRequest.headers.delete("authorization");
        }
        return newRequest;
    };
}
/**
 * Middleware function for following HTTP redirects.
 */
function redirects(fn, maxRedirects = 5, confirmRedirect = () => false) {
    return async function (initReq, done) {
        const safeClone = safeRedirect(initReq);
        let req = initReq.clone();
        let redirectCount = 0;
        while (redirectCount++ < maxRedirects) {
            const res = await fn(req, done);
            const redirect = REDIRECT_STATUS[res.status];
            const location = res.headers.get("Location");
            if (redirect === undefined || !location)
                return res;
            await res.destroy(); // Ignore the result of the response on redirect.
            if (redirect === REDIRECT_TYPE.FOLLOW_WITH_GET) {
                const method = initReq.method.toUpperCase() === "HEAD" ? "HEAD" : "GET";
                req = safeClone(req, location, method);
                req.$rawBody = null; // Override internal raw body.
                req.headers.set("Content-Length", "0");
                continue;
            }
            if (redirect === REDIRECT_TYPE.FOLLOW_WITH_CONFIRMATION) {
                const { method } = req;
                // Following HTTP spec by automatically redirecting with GET/HEAD.
                if (method.toUpperCase() === "GET" || method.toUpperCase() === "HEAD") {
                    req = safeClone(req, location, method);
                    continue;
                }
                // Allow the user to confirm redirect according to HTTP spec.
                if (confirmRedirect(req, res)) {
                    req = safeClone(req, location, method);
                    continue;
                }
            }
            return res;
        }
        throw new MaxRedirectsError(req, `Maximum redirects exceeded: ${maxRedirects}`);
    };
}
exports.redirects = redirects;
//# sourceMappingURL=index.js.map