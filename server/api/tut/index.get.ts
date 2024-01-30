import TutCourse from "~/server/Dolphin/Tut/TutCourse";

type TutCourseList = {
    id: string;
    name: string;
    type: "teacher" | "viceTeacher";
    studentCount: number;
};

export default defineEventHandler(async (event): Promise<TutCourseList[]> => {
    const { success, user, statusCode } = await event.context.auth.checkAuth();
    if (!success || !user) {
        throw createError({ statusCode });
    }

    const [tutCourse, tutCourseError] = await TutCourse.listTutCourseByUser(user._id);

    if (tutCourseError) {
        throw createError({ statusCode: 500 });
    }

    const tutCoursesList = tutCourse
        .filter((v) => v.teacher.equals(user._id) || v.viceTeacher?.equals(user._id))
        .map(
            (v): TutCourseList => ({
                id: v._id.toHexString(),
                name: v.name,
                type: v.teacher.equals(user._id) ? "teacher" : "viceTeacher",
                studentCount: v.students.length,
            }),
        );

    return tutCoursesList;
});
