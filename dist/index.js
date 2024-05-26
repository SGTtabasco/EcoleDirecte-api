"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const generate_header = (token = null) => {
    let default_header = {
        "Origin": "https://www.ecoledirecte.com",
        "Referer": "https://www.ecoledirecte.com/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.6312.124 Safari/537.36",
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Token": ""
    };
    // add X-Token if token is given
    if (token) {
        default_header["X-Token"] = token;
    }
    return default_header;
};
class User {
    constructor(username, password, version = "4.57.1") {
        this.token = null;
        this.responceLogin = null;
        this.inDoubleAuth = false;
        this.DoubleAuthResponse = null;
        this.DoubleAuthCode = null;
        this.username = username;
        this.password = password;
        this.versionAPI = version;
    }
    login() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (this.inDoubleAuth && !this.DoubleAuthCode) {
                throw SyntaxError("login called with Double auth pending");
            }
            const r = (yield axios_1.default.post(`https://api.ecoledirecte.com/v3/login.awp?v=${this.versionAPI}`, `data=${JSON.stringify({
                identifiant: this.username,
                motdepasse: this.password,
                cv: this.inDoubleAuth ? (_a = this.DoubleAuthCode) === null || _a === void 0 ? void 0 : _a.cv : undefined,
                cn: this.inDoubleAuth ? (_b = this.DoubleAuthCode) === null || _b === void 0 ? void 0 : _b.cn : undefined,
                fa: this.inDoubleAuth ? [this.DoubleAuthCode] : undefined
            })}`, {
                headers: this.inDoubleAuth ? generate_header(this.token) : generate_header()
            })).data;
            this.responceLogin = r;
            this.token = r.token;
            if (r.code == 505) {
                return { code: r.code, message: r.message, type: "LOGIN_FAILED_INVALID_CREDENTIALS" };
            }
            if (r.code == 250) {
                // need double auth
                // get the question + response
                const double = yield axios_1.default.post(`https://api.ecoledirecte.com/v3/connexion/doubleauth.awp?verbe=get&v=${this.versionAPI}`, "data={}", {
                    headers: generate_header(this.token)
                });
                if (double.data.code != 200)
                    return { code: r.code, message: r.message, type: "DOUBLE_AUTH_FAILED" };
                this.token = double.headers["x-token"]; // update the token with the new
                this.inDoubleAuth = true;
                const data = double.data;
                // decode question + response
                const question = atob(data.data.question);
                const response = data.data.propositions.map((v) => atob(v));
                this.DoubleAuthResponse = response;
                return { code: r.code, message: "", type: "NEED_DOUBLE_AUTH", double_auth: { question, propositions: response } };
            }
            if (r.code != 200) {
                return { code: r.code, message: r.message, type: "LOGIN_FAILED" };
            }
            return { code: r.code, message: r.message, type: "LOGIN_SUCCESS" };
        });
    }
    validate_double_auth(resp) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!this.inDoubleAuth) {
                throw SyntaxError("validate_double_auth called but not in Double Auth State");
            }
            const b64 = btoa(resp);
            // verify if b64 in DoubleAuthResponse
            if (!((_a = this.DoubleAuthResponse) === null || _a === void 0 ? void 0 : _a.includes(resp))) {
                throw SyntaxError("validate_double_auth called with a resp who didn't exist in DoubleAuthResponse");
            }
            const r = yield axios_1.default.post(`https://api.ecoledirecte.com/v3/connexion/doubleauth.awp?verbe=post&v=${this.versionAPI}`, `data=${JSON.stringify({ choix: b64 })}`, { headers: generate_header(this.token) });
            // change the token
            this.token = r.headers["x-token"];
            if (r.data.code != 200) {
                return { code: r.data.code, message: r.data.message, type: "DOUBLE_AUTH_FAILED" };
            }
            // save cn and cv
            this.DoubleAuthCode = { cv: r.data.data.cv, cn: r.data.data.cn };
            // relogin
            return yield this.login();
        });
    }
}
exports.default = User;
