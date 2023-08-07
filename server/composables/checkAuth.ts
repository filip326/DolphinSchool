import { H3Event } from "h3";
import { Permissions } from "../Dolphin/Permissions/PermissionManager";
import User from "../Dolphin/User/User";

interface IOptions {
    authRequired: boolean;
    throwErrOnAuthFail: boolean;
    requirePerm?: Permissions;
}

export default async (event: H3Event, options: IOptions): Promise<{success: boolean, usr: User | null}> => {
    if (event.context.auth.authenticated && event.context.auth.user) {
        if (options.requirePerm) {
            if (event.context.auth.user.hasPermission(options.requirePerm)) {
                return {success: true, usr: event.context.auth.user!};
            } else {
                if (options.throwErrOnAuthFail) {
                    throw throw403();
                }
                return {success: false, usr: null};
            }
        } else {
            return {success: true, usr: event.context.auth.user!};
        }
    } else {
        if (options.authRequired) {
            if (options.throwErrOnAuthFail) {
                throw throw401();
            }
            return {success: false, usr: null};
        } else {
            return {success: true, usr: event.context.auth.user!};
        }
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
