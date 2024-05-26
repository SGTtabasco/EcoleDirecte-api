import axios from "axios";

interface LoginParamsRequest {
    identifiant: string;
    motdepasse: string;
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
    type: "LOGIN_SUCCESS" | "LOGIN_FAILED" | "LOGIN_FAILED_INVALID_CREDENTIALS"
}

export default class User {
    username: string;
    password: string;
    versionAPI: string;
    token: string | null = null;
    responceLogin: LoginParamsResponse | null = null;

    constructor(username: string, password: string, version: string = "4.57.1") {
        this.username = username;
        this.password = password
        this.versionAPI = version
    }

    async login (): Promise<LoginParamsResponseError> {
        const r = (await axios.post(`https://api.ecoledirecte.com/v3/login.awp?v=${this.versionAPI}`,
            `data=${JSON.stringify({identifiant: this.username, motdepasse: this.password} as LoginParamsRequest)}`,
            {
                headers: {
                    "Origin": "https://www.ecoledirecte.com",
                    "Referer": "https://www.ecoledirecte.com/",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.6312.124 Safari/537.36",
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            })).data as LoginParamsResponse;

        if (r.code == 505) {
            return {code: r.code, message: r.message, type: "LOGIN_FAILED_INVALID_CREDENTIALS"}
        }
        if (r.code != 200) {
            return {code: r.code, message: r.message, type: "LOGIN_FAILED"}
        }

        this.token = r.token;

        return {code: r.code, message: r.message, type: "LOGIN_SUCCESS"}
    }
}