import { H3Event } from "h3"
import { Permissions } from "../Dolphin/Permissions/PermissionManager"

interface IOptions {
    authRequired: boolean;
    throwErrOnAuthFail: boolean;
    requirePerm: Permissions;
}

export default async (event: H3Event, options: IOptions): Promise<boolean> => {
    if (event.context.auth.authenticated && event.context.auth.user) {
        if (options.requirePerm) {
            if (event.context.auth.user.hasPermission(options.requirePerm)) {
                return true
            } else {
                if (options.throwErrOnAuthFail) {
                    throw throw403()
                }
                return false
            }
        } else {
            return true
        }
    } else {
        if (options.authRequired) {
            if (options.throwErrOnAuthFail) {
                throw throw401()
            }
            return false
        } else {
            return true
        }
    }
}

function throw401() {
    return createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
    })
}

function throw403() {
    return createError({
        statusCode: 403,
        statusMessage: "Forbidden",
    })
}
