import User from "../Dolphin/User/User";

export default interface Auth {
    authenticated: boolean;
    mfa_required?: boolean;
    user?: User;
}
