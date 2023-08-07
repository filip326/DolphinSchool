import { H3Event } from "h3";
import { Permissions } from "../Dolphin/Permissions/PermissionManager";
import User from "../Dolphin/User/User";
import MethodResult from "../Dolphin/MethodResult";

interface IOptions {
    throwErrOnAuthFail: boolean;
    requirePerm?: Permissions;
    skipMFA?: boolean;
}

export default async (event: H3Event, options: IOptions): Promise<MethodResult<User>> => {
    if (event.context.auth.authenticated && event.context.auth.user &&
        (event.context.auth.mfa_required === false || options.skipMFA)) {
        if (options.requirePerm) {
            if (event.context.auth.user.hasPermission(options.requirePerm)) {
                return [event.context.auth.user, null];
            } else {
                if (options.throwErrOnAuthFail) {
                    throw throw403();
                }
                return [undefined, Error("Permission denied")];
            }
        } else {
            return [event.context.auth.user, null];
        }
    } else {
        if (options.throwErrOnAuthFail) {
            throw throw401();
        }
        return [undefined, Error("Login required")];
    }
};

function throw401() {
    return createError({
        statusCode: 401,
        statusMessage: "Unauthorized"
    });
}

function throw403() {
    return createError({
        statusCode: 403,
        statusMessage: "Forbidden"
    });
}
