import TutCourse from "~/server/Dolphin/Tut/TutCourse";
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

    // filter search to only contain letters and spaces
    const maskedSearch = search.replace(/[^a-zA-Z0-9 ]/g, "");

    if (maskedSearch.length < 3) {
        throw createError({
            statusCode: 400,
            message: "Search string must be at least 3 characters long",
        });
    }

    // now search for users
    const [users, searchError] = await User.searchUsersByName(maskedSearch, 5);
    if (searchError) {
        throw createError({
            statusCode: 500,
            message: "Internal server error",
        });
    }

    const course = new Map();

    (
        await Promise.all(
            users.map(async function (user): Promise<[string, string] | undefined> {
                if (!user.isStudent()) return;
                const [tutCourse, error] = await TutCourse.getTutCourseByUser(user._id);
                if (error || !tutCourse) return undefined;
                return [user._id.toHexString(), tutCourse.name];
            }),
        )
    ).forEach((value) => (value ? course.set(value[0], value[1]) : null));

    return users.map((user) => ({
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
    }));
});
