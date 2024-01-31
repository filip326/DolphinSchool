export default defineEventHandler(async (event) => {
    const body = await readBody(event);

    // check body
    if (!body) {
        throw createError({
            status: 400,
            message: "Invalid body",
        });
    }
    if (!body.fullName || !body.tut || !body.teacher || !body.email) {
        throw createError({
            status: 400,
            message: "Invalid body",
        });
    }
    if (
        typeof body.fullName !== "string" ||
        typeof body.tut !== "string" ||
        typeof body.teacher !== "string" ||
        typeof body.email !== "string"
    ) {
        throw createError({
            status: 400,
            message: "Invalid body",
        });
    }
    if (body.description && typeof body.description !== "string") {
        throw createError({
            status: 400,
            message: "Invalid body",
        });
    }

    // todo add support ticket to database
});
