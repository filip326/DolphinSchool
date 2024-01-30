import Subject from "~/server/Dolphin/Course/Subject";
import { Permissions } from "~/server/Dolphin/PermissionsAndRoles/PermissionManager";

export default defineEventHandler(async (event) => {
    // check for permission
    const { success, statusCode } = await event.context.auth.checkAuth({
        PermissionLevel: Permissions.MANAGE_SUBJECTS,
    });
    if (!success) {
        throw createError({ statusCode });
    }

    // check body
    const { name, shortName, color } = await readBody(event);
    if (
        typeof name !== "string" ||
        typeof shortName !== "string" ||
        shortName.length > 3 ||
        !color ||
        typeof color !== "object" ||
        !("r" in color) ||
        !("g" in color) ||
        !("b" in color) ||
        typeof color.r !== "number" ||
        typeof color.g !== "number" ||
        typeof color.b !== "number" ||
        color.r < 0 ||
        color.r > 255 ||
        color.r % 1 !== 0 ||
        color.g < 0 ||
        color.g > 255 ||
        color.g % 1 !== 0 ||
        color.b < 0 ||
        color.b > 255 ||
        color.b % 1 !== 0
    ) {
        throw createError({ statusCode: 400, message: "Invalid request body" });
    }

    // create the subject
    const [subject, subjectError] = await Subject.create({
        longName: name,
        short: shortName,
        color: {
            r: color.r,
            g: color.g,
            b: color.b,
        },
    });

    if (subjectError) {
        throw createError({ statusCode: 400, message: "Invalid request body" });
    }

    // return the subject
    return {
        id: subject._id.toHexString(),
        name: subject.longName,
        shortName: subject.short,
    };
});
