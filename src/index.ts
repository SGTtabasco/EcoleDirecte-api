import axios from "axios";

interface LoginParamsRequest {
    identifiant: string;
    motdepasse: string;
    isReLogin: false
    cn?: string
    cv?: string
    uuid: ""
    fa: {cn: string, cv: string}[]
}

interface LoginParamsResponse {
    code: number
    token: string
    message: string
    data: {
        changementMDP: boolean
        accounts: Array<{
            idLogin: number
            id: number
            uid: string
            identifiant: string
            typeCompte: string
            codeOgec: string
            main: boolean
            lastConnexion: string
            civilite: string
            prenom: string
            particule: string
            nom: string
            email: string
            nomEtablissement: string
            logoEtablissement: string
            couleurAgendaEtablissement: string
            dicoEnLigneLeRobert: boolean
            socketToken: string
            modules: Array<{
                code: string
                enable: boolean
                ordre: number
                badge: number
            }>
            parametresIndividuels: {
                lsuPoilDansLaMainBorne1: string
                lsuPoilDansLaMainBorne2: string
                lsuPoilDansLaMainBorne3: string
                modeCalculLSU: string
                isQrcode: boolean
                accessibiliteVisuelle: boolean
                checkAuthentificationSecure: boolean
                typeSaisieNotesDefaut: string
                nbJoursMaxRenduDevoirCDT: string
                typeViewCDTDefaut: string
                blocPMAccueil: boolean
                blocActuAccueil: boolean
            }
            profile: {
                nomEtablissement: string
                idEtablissement: string
                photo: string
                email?: string
                telPortable: string
                isChefEtab?: boolean
                sexe?: string
                infoEDT?: string
                rneEtablissement?: string
                idReelEtab?: string
                classe?: {
                    id: number
                    code: string
                    libelle: string
                    estNote: number
                }
            }
        }>
    }
}

interface LoginParamsResponseError {
    code: number
    message: string
    type: "LOGIN_SUCCESS" | "LOGIN_FAILED" | "LOGIN_FAILED_INVALID_CREDENTIALS" | "NEED_DOUBLE_AUTH" | "DOUBLE_AUTH_FAILED"
    double_auth?: {
        question: string
        propositions: string[]
    }
}

interface DoubleAuthResponse {
    code: number
    host: string
    message?: string
    data: {
        question: string // in base 64
        propositions: string[] // in base 64
    }
}

const generate_header = (token: string | null = null) => {
    let default_header = {
        "Origin": "https://www.ecoledirecte.com",
        "Referer": "https://www.ecoledirecte.com/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.6312.124 Safari/537.36",
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Token": ""
    }

    // add X-Token if token is given
    if (token) {
        default_header["X-Token"] = token
    }
    return default_header
}

export default class User {
    username: string;
    password: string;
    versionAPI: string;
    token: string | null = null;
    responceLogin: LoginParamsResponse | null = null;
    inDoubleAuth: boolean = false
    DoubleAuthResponse: string[] | null = null
    DoubleAuthCode: {cn: string, cv: string} | null = null



    constructor(username: string, password: string, version: string = "4.57.1") {
        this.username = username;
        this.password = password
        this.versionAPI = version
    }

    async login (): Promise<LoginParamsResponseError> {
        if (this.inDoubleAuth && !this.DoubleAuthCode) {
            throw SyntaxError("login called with Double auth pending")
        }
        const r = (await axios.post(`https://api.ecoledirecte.com/v3/login.awp?v=${this.versionAPI}`,
            `data=${JSON.stringify({
                identifiant: this.username,
                motdepasse: this.password,
                cv: this.inDoubleAuth ? this.DoubleAuthCode?.cv : undefined,
                cn: this.inDoubleAuth ? this.DoubleAuthCode?.cn : undefined,
                fa: this.inDoubleAuth ? [this.DoubleAuthCode] : undefined
            } as LoginParamsRequest)}`,
            {
                headers: this.inDoubleAuth ? generate_header(this.token) : generate_header()
            })).data as LoginParamsResponse;

        this.responceLogin = r;
        this.token = r.token;

        if (r.code == 505) {
            return {code: r.code, message: r.message, type: "LOGIN_FAILED_INVALID_CREDENTIALS"}
        }

        if (r.code == 250) {
            // need double auth
            // get the question + response
            const double = await axios.post(`https://api.ecoledirecte.com/v3/connexion/doubleauth.awp?verbe=get&v=${this.versionAPI}`,
                "data={}",
                {
                    headers: generate_header(this.token)
                });

            if (double.data.code != 200) return {code: r.code, message: r.message, type: "DOUBLE_AUTH_FAILED"};
            this.token = double.headers["x-token"]; // update the token with the new
            this.inDoubleAuth = true;

            const data = double.data as DoubleAuthResponse;
            // decode question + response
            const question = atob(data.data.question);
            const response = data.data.propositions.map((v) => atob(v));
            this.DoubleAuthResponse = response;
            return {code: r.code, message: "", type: "NEED_DOUBLE_AUTH", double_auth: {question, propositions: response}};

        }
        if (r.code != 200) {
            return {code: r.code, message: r.message, type: "LOGIN_FAILED"}
        }

        return {code: r.code, message: r.message, type: "LOGIN_SUCCESS"}
    }

    async validate_double_auth(resp: string): Promise<LoginParamsResponseError> {
        if (!this.inDoubleAuth) {
            throw SyntaxError("validate_double_auth called but not in Double Auth State")
        }

        const b64 = btoa(resp)

        // verify if b64 in DoubleAuthResponse
        if (!this.DoubleAuthResponse?.includes(resp)) {

            throw SyntaxError("validate_double_auth called with a resp who didn't exist in DoubleAuthResponse")
        }
        const r = await axios.post(`https://api.ecoledirecte.com/v3/connexion/doubleauth.awp?verbe=post&v=${this.versionAPI}`,
            `data=${JSON.stringify({choix: b64})}`,
            {headers: generate_header(this.token)});

        // change the token
        this.token = r.headers["x-token"]

        if (r.data.code != 200) {
            return {code: r.data.code, message: r.data.message, type:"DOUBLE_AUTH_FAILED"}
        }

        // save cn and cv
        this.DoubleAuthCode = {cv: r.data.data.cv, cn: r.data.data.cn}
        // relogin
        return await this.login()
    }
}