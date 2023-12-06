import WikiSpace from "~/server/Dolphin/Wiki/Space";

export default defineEventHandler(async (event) => {
    const { user, success, statusCode } = await event.context.auth.checkAuth();
    if (!success) {
        throw createError({
            message: "Not authorized",
            statusCode: statusCode,
        });
    }

    const body = await readBody(event);
    const { name, description } = body;

    if (
        !name ||
        typeof name !== "string" ||
        name.trim().length < 3 ||
        name.trim().length > 50
    ) {
        throw createError({
            message: "Invalid name",
            statusCode: 400,
        });
    }

    if (
        !description ||
        typeof description !== "string" ||
        description.length > 500 ||
        description.trim().length < 3
    ) {
        throw createError({
            message: "Invalid description",
            statusCode: 400,
        });
    }

    const [wikiSpace, error] = await WikiSpace.create({
        name,
        description,
        owner: user._id,
    });

    if (error) {
        console.error(error);
        throw createError({
            message: "Error while creating wiki space",
            statusCode: 500,
        });
    }

    return {
        name: wikiSpace.name,
        url: wikiSpace.url,
        description: wikiSpace.description,
    };
});
