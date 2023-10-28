import { ObjectId } from "mongodb";
import Mail from "~/server/Dolphin/Mail/Mail";

export default eventHandler(async (event) => {
    const checkAuthResult = await event.context.auth.checkAuth({});
    if (!checkAuthResult.success || !checkAuthResult.user) {
        throw createError({ statusCode: 401, message: "Unauthorized" });
    }

    const { id } = getRouterParams(event);

    // get the Mail
    const mail = await Mail.getMail(new ObjectId(id), checkAuthResult.user._id);
    if (!mail[0] || mail[1]) {
        throw createError({ statusCode: 404, message: "Not Found" });
    }

    if (
        !mailWasSentToUser(mail[0], checkAuthResult.user._id) &&
        !mail[0].sendBy.equals(checkAuthResult.user._id)
    ) {
        throw createError({ statusCode: 403, message: "Forbidden" });
    }

    const { action, value } = await readBody(event);

    if (
        !action ||
        value == undefined ||
        typeof action != "string" ||
        typeof value != "boolean"
    ) {
        throw createError({ statusCode: 400, message: "Bad Request" });
    }

    switch (action) {
        case "read": {
            const res = await mail[0].mailCollection.updateOne(
                {
                    _id: mail[0].id,
                },
                {
                    $set: {
                        readBy: value
                            ? [...(mail[0].readBy ?? []), checkAuthResult.user._id]
                            : mail[0].readBy?.filter(
                                  (id) => !id.equals(checkAuthResult.user._id),
                              ),
                    },
                },
            );
            if (res.acknowledged) {
                break;
            } else {
                throw createError({ statusCode: 500, message: "Internal Server Error" });
            }
        }
        case "star": {
            const res = await mail[0].mailCollection.updateOne(
                {
                    _id: mail[0].id,
                },
                {
                    $set: {
                        staredBy: value
                            ? [...(mail[0].staredBy ?? []), checkAuthResult.user._id]
                            : mail[0].staredBy?.filter(
                                  (id) => !id.equals(checkAuthResult.user._id),
                              ),
                    },
                },
            );
            if (res.acknowledged) {
                break;
            } else {
                throw createError({ statusCode: 500, message: "Internal Server Error" });
            }
        }
        default: {
            throw createError({ statusCode: 400, message: "Bad Request" });
        }
    }
    return { success: true };
});

function mailWasSentToUser(mail: Mail, userId: ObjectId) {
    return mail.sendTo.some((id: ObjectId) => userId.equals(id));
}
