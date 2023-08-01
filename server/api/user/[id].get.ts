import { ObjectId } from "mongodb"
import Dolphin from "../../Dolphin/Dolphin"
import GlobalUserManager from "../../Dolphin/User/GlobalUserManager"

export default defineEventHandler(async (event) => {

    if (!event.context.auth.authenticated || event.context.auth.mfa_required || !event.context.auth.user) {
        throw createError({ statusCode: 401, message: "Unauthorized" })
    }

    const dolphin = Dolphin.instance ?? await Dolphin.init()
    // const user = event.context.auth.user
    
    // get user with id
    const userId = getRouterParams(event).id

    // check if id is valid hex ObjectId
    if (/^[0-9a-fA-F]{24}$/.test(userId) === false) {
        throw createError({ statusCode: 400, message: "Invalid user id" })
    }

    if (ObjectId.isValid(userId) === false) {
        throw createError({ statusCode: 400, message: "Invalid user id" })
    }

    // get user
    const [ userWithId, userFindError ] = await GlobalUserManager.getInstance(dolphin).findUser({ id: new ObjectId(userId) })

    if (userFindError) {
        throw createError({ statusCode: 404, message: "User not found" })
    }

    // reply with user data
    return {
        username: userWithId.username,
        fullName: userWithId.fullName,
        type: userWithId.type,
    }

})