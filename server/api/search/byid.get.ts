import { ObjectId } from "mongodb";
import User from "~/server/Dolphin/User/User";

export default defineEventHandler(async (event) => {
    const { success, statusCode } = await event.context.auth.checkAuth();
    if (!success) {
        throw createError({
            statusCode: statusCode,
        });
    }

    // check if there is a string query param "search"
    const { search } = getQuery(event);
    if (typeof search !== "string") {
        throw createError({
            statusCode: 400,
            message: "Invalid query parameters",
        });
    }

    // now search for users
    const [user, searchError] = await User.getUserById(new ObjectId(search));
    if (searchError) {
        throw createError({
            statusCode: 500,
            message: "Internal server error",
        });
    }

    const course = new Map();

    return {
        id: user._id.toHexString(),
        label: `${user.fullName} (${
            user.type === "student"
                ? course.has(user._id.toHexString())
                    ? `Schüler:in ${course.get(user._id.toHexString())}`
                    : "Schüler:in"
                : user.type === "parent"
                ? "Elternteil"
                : "Lehrkraft"
        })`,
    };
});
