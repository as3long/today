var config = Ham.config;
var sessions = {};
var ham_sessionKey = config.session_key||'ham_session_id';
var EXPIRES =config.session_expires || 30 * 60 * 1000;

function randString(size) {
    var result = '';
    var allChar = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    size = size || 1;
    while (size--) {
        result += allChar.charAt(rand(0, allChar.length - 1));
    }
    return result;
}

var generate = function () {
    var session = {};
    session.id = Date.now() + randString(12);
    session.cookies = {
        expire: Date.now() + EXPIRES
    }
    sessions[session.id] = session;
    return session;
}
var parseCookie = function (cookie) {
    var cookies = {};
    if (!cookie) {
        return cookies;
    }
    var list = cookie.split(";");
    for (var i = 0; i < list.length; i++) {
        var pair = list[i].split("=");
        cookies[pair[0].trim()] = pair[1];
    }
    return cookies;
}

var serializeCookies = function (cookies) {
    var arr = [];
    for (var key in cookies) {
        arr.push(serialize(key, cookies[key]));
    }
    return arr;
}

var serialize = function (name, value, option) {
    var pairs = [name + '=' + encodeURI(value)];
    //设置cookie默认共用"/"路径
    option = option || {
        path: "/"
    };
    if (option.maxAge) pairs.push('Max-Age=' + option.maxAge);
    if (option.domain) pairs.push('Domain=' + option.domain);
    if (option.path) pairs.push('Path=' + option.path);
    if (option.expires) pairs.push('Expires=' + option.expires);
    if (option.httpOnly) pairs.push('HttpOnly');
    if (option.secure) pairs.push('Secure');
    return pairs.join('; ');
}
module.exports = function (req, res) {
    req.cookies = parseCookie(req.headers.cookie);
    var id = req.cookies[ham_sessionKey];
    if (!id) {
        req.session = generate();
    } else {
        var session = sessions[id];
        if (session) {
            if (session.cookies.expire > Date.now()) {
                session.cookies.expire = Date.now() + EXPIRES;
                req.session = session;
            } else {
                delete sessions[id];
                req.session = generate();
            }
        } else {
            req.session = generate();
        }
    }

    for (var key in sessions) {
        if (sessions[key].cookies.expire < Date.now()) {
            delete sessions[key];
        }
    }

    var writeHead = res.writeHead;
    res.writeHead = function () {
        delete req.cookies[ham_sessionKey];
        var sessionStr = serialize(ham_sessionKey, req.session.id);
        res.setHeader('Set-Cookie', serializeCookies(req.cookies).concat(sessionStr));
        return writeHead.apply(res, arguments);
    }
}