interface LoginParamsResponse {
    code: number;
    token: string;
    message: string;
    data: {
        changementMDP: boolean;
        accounts: Array<{
            idLogin: number;
            id: number;
            uid: string;
            identifiant: string;
            typeCompte: string;
            codeOgec: string;
            main: boolean;
            lastConnexion: string;
            civilite: string;
            prenom: string;
            particule: string;
            nom: string;
            email: string;
            nomEtablissement: string;
            logoEtablissement: string;
            couleurAgendaEtablissement: string;
            dicoEnLigneLeRobert: boolean;
            socketToken: string;
            modules: Array<{
                code: string;
                enable: boolean;
                ordre: number;
                badge: number;
            }>;
            parametresIndividuels: {
                lsuPoilDansLaMainBorne1: string;
                lsuPoilDansLaMainBorne2: string;
                lsuPoilDansLaMainBorne3: string;
                modeCalculLSU: string;
                isQrcode: boolean;
                accessibiliteVisuelle: boolean;
                checkAuthentificationSecure: boolean;
                typeSaisieNotesDefaut: string;
                nbJoursMaxRenduDevoirCDT: string;
                typeViewCDTDefaut: string;
                blocPMAccueil: boolean;
                blocActuAccueil: boolean;
            };
            profile: {
                nomEtablissement: string;
                idEtablissement: string;
                photo: string;
                email?: string;
                telPortable: string;
                isChefEtab?: boolean;
                sexe?: string;
                infoEDT?: string;
                rneEtablissement?: string;
                idReelEtab?: string;
                classe?: {
                    id: number;
                    code: string;
                    libelle: string;
                    estNote: number;
                };
            };
        }>;
    };
}
interface LoginParamsResponseError {
    code: number;
    message: string;
    type: "LOGIN_SUCCESS" | "LOGIN_FAILED" | "LOGIN_FAILED_INVALID_CREDENTIALS" | "NEED_DOUBLE_AUTH" | "DOUBLE_AUTH_FAILED";
    double_auth?: {
        question: string;
        propositions: string[];
    };
}
export default class User {
    username: string;
    password: string;
    versionAPI: string;
    token: string | null;
    responceLogin: LoginParamsResponse | null;
    inDoubleAuth: boolean;
    DoubleAuthResponse: string[] | null;
    DoubleAuthCode: {
        cn: string;
        cv: string;
    } | null;
    constructor(username: string, password: string, version?: string);
    login(): Promise<LoginParamsResponseError>;
    validate_double_auth(resp: string): Promise<LoginParamsResponseError>;
}
export {};
