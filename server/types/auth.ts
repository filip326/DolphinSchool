import User from "../Dolphin/User/User";
import { Permissions } from "../Dolphin/PermissionsAndRoles/PermissionManager";

interface CheckAuthOptions {
    PermissionLevel?: Permissions;
}

type CheckAuthStatusCode = 200 | 401 | 403 | 500;

type CheckAuthResult =
    | {
          success: false;
          statusCode: CheckAuthStatusCode;
          user?: User;
      }
    | { user: User; success: true; statusCode: CheckAuthStatusCode };

interface Auth {
    authenticated: boolean | false;
    mfa_required?: boolean;
    change_password_required?: boolean;
    user?: User;
    checkAuth: (options?: CheckAuthOptions) => Promise<CheckAuthResult>;
}

export default Auth;
export { CheckAuthOptions, CheckAuthResult, CheckAuthStatusCode };
