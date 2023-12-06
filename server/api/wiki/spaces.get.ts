import Course from "~/server/Dolphin/Course/Course";
import { Permissions } from "~/server/Dolphin/Permissions/PermissionManager";
import TutCourse from "~/server/Dolphin/Tut/TutCourse";
import WikiSpace from "~/server/Dolphin/Wiki/Space";

export default defineEventHandler(async (event) => {
    const { user, success, statusCode } = await event.context.auth.checkAuth();
    if (!success) {
        throw createError({
            message: "Not authorized",
            statusCode: statusCode,
        });
    }

    if (user.hasPermission(Permissions.VIEW_ALL_WIKIS)) {
        const [spacesList, error] = await WikiSpace.list();
        if (error) {
            throw createError({
                message: "Error while listing wiki spaces",
                statusCode: 500,
            });
        }

        return spacesList.map((space) => ({
            name: space.name,
            url: space.url,
            description: space.description,
        }));
    }

    const [tutCourses] = await TutCourse.listTutCourseByUser(user._id);
    const [courses] = await Course.listByMember(user._id);

    const [spacesList, error] = await WikiSpace.list([
        user._id,
        ...(courses ?? []).map((course) => course._id),
        ...(tutCourses ?? []).map((tutCourse) => tutCourse._id),
    ]);
    if (error) {
        throw createError({
            message: "Error while listing wiki spaces",
            statusCode: 500,
        });
    }
    return spacesList.map((space) => ({
        name: space.name,
        url: space.url,
        description: space.description,
    }));
});
