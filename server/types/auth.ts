import User from "../Dolphin/User/User";

interface Auth {
    authenticated: boolean | false
    mfa_required?: boolean
    user?: User
};

export default Auth;
