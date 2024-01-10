import User from "../Dolphin/User/User";
import { Permissions } from "../Dolphin/Permissions/PermissionManager";

interface ICheckAuthOptions {
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

interface IAuth {
    authenticated: boolean | false;
    mfa_required?: boolean;
    change_password_required?: boolean;
    user?: User;
    checkAuth: (options?: ICheckAuthOptions) => Promise<CheckAuthResult>;
}

export default IAuth;
export { ICheckAuthOptions as CheckAuthOptions, CheckAuthResult, CheckAuthStatusCode };
