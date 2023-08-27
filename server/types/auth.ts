import { H3Event } from "h3";
import User from "../Dolphin/User/User";
import { Permissions } from "../Dolphin/Permissions/PermissionManager";

interface CheckAuthOptions {
    throwErrorOnNotAuth?: boolean;
    minimumPermissionLevel?: Permissions;
}

type CheckAuthStatusCode = 200 | 401 | 403 | 500;

type CheckAuthResult = {
    success: boolean;
    statusCode: CheckAuthStatusCode;
    user?: User;
};

interface Auth {
    authenticated: boolean | false;
    mfa_required?: boolean;
    user?: User;
    checkAuth: (event: H3Event, options: CheckAuthOptions) => Promise<CheckAuthResult>;
}

export default Auth;
export { CheckAuthOptions, CheckAuthResult, CheckAuthStatusCode };
