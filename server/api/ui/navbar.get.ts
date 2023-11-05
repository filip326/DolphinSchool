import { Permissions } from "~/server/Dolphin/Permissions/PermissionManager";
import Course from "~/server/Dolphin/Course/Course";
import TutCourse from "~/server/Dolphin/Tut/TutCourse";

type NavBarSubelement = { label: string; location: string; notification?: number };
type NavBarElement = {
    icon: string;
    label: string;
    location: string;
    notification?: number;
    children?: NavBarSubelement[];
};
type NavBar = NavBarElement[];

export default defineEventHandler(async (event): Promise<NavBar> => {
    const { success, user } = await event.context.auth.checkAuth();

    if (!success) {
        // user is not logged in
        // return basic navbar with login and logout
        return [
            { icon: "mdi-login", label: "Login", location: "/login" },
            { icon: "mdi-account-plus", label: "Register", location: "/register" },
        ];
    }

    // since logged in, return a navbar with all the links

    const navbar: NavBar = [];

    // first add the home link
    navbar.push({ icon: "mdi-home", label: "Home", location: "/home" });

    // add the "Kommunikation" link with sublinks
    // navbar.push({
    //     icon: "mdi-email",
    //     label: "Kommunikation",
    //     location: "/mail/inbox",
    //     children: [
    //         { label: "Markiert", location: "/mail/stared" },
    //         { label: "Postausgang", location: "/mail/outbox" },
    //         { label: "Neue Nachricht", location: "/mail/write" },
    //     ],
    // });

    const mailNavbar: NavBarSubelement[] = [];

    mailNavbar.push({ label: "Posteingang", location: "/mail/inbox" });

    mailNavbar.push({ label: "Postausgang", location: "/mail/outbox" });

    mailNavbar.push({
        label: "Markiert",
        location: "/mail/stared",
    });

    if (user.hasPermission(Permissions.SEND_MAIL)) {
        mailNavbar.push({ label: "Neue Nachricht", location: "/mail/write" });
    }

    navbar.push({
        icon: "mdi-email",
        label: "Kommunikation",
        location: "/mail/inbox",
        children: mailNavbar,
    });

    // check if user is a teacher
    if (user.isTeacher()) {
        // add the "Meine Klasse" link with sublinks
        // eacht tut of the teacher is a sublink
        // get the tuts of the teacher
        const [tuts, tutsFindError] = await TutCourse.listTutCourseByUser(user._id);
        if (tutsFindError)
            throw createError({
                statusCode: 500,
                name: "tutsFindError",
                message: "Could not find tuts",
            });

        if (tuts.length !== 0) {
            navbar.push({
                icon: "mdi-account-group",
                label: "Meine Klassenleitungen",
                location: "/tut",
                children: tuts.map((tut) => ({
                    label: tut.name,
                    location: `/tut/${tut._id}`,
                })),
            });
        }

        // also get courses of the teacher
        const [courses, coursesFindError] = await Course.listByMember(user._id);
        if (coursesFindError)
            throw createError({
                statusCode: 500,
                name: "coursesFindError",
                message: "Could not find courses",
            });

        if (courses.length !== 0) {
            navbar.push({
                icon: "mdi-book-open-page-variant-outline",
                label: "Meine Kurse",
                location: "/course",
                children: courses.map((course) => ({
                    label: course.name,
                    location: `/course/${course._id}`,
                })),
            });
        }
    } else {
        // add the "Meine Klasse" link without any sublinks
        // the "Meine Klasse" link should point directly to the tut of the user

        // if user is a student, get the tut of the student
        // else if user is a parent, get the tut of the student of the parent
        if (user.isStudent()) {
            // get the tut course of the user
            const [tut, tutFindError] = await TutCourse.getTutCourseByUser(user._id);
            if (!tutFindError) {
                if (tut.grade <= 10) {
                    navbar.push({
                        icon: "mdi-account-group",
                        label: "Meine Klasse",
                        location: `/tut/${tut._id}`,
                    });
                } else {
                    navbar.push({
                        icon: "mdi-account-group",
                        label: "Mein TUT-Kurs",
                        location: `/tut/${tut._id}`,
                    });
                }
            }
            // also get courses of the student
            const [courses, coursesFindError] = await Course.listByMember(user._id);
            if (coursesFindError)
                throw createError({
                    statusCode: 500,
                    name: "coursesFindError",
                    message: "Could not find courses",
                });
            if (courses.length !== 0) {
                navbar.push({
                    icon: "mdi-book-open-page-variant-outline",
                    label: "Meine Kurse",
                    location: "/course",
                    children: courses.map((course) => ({
                        label: course.name,
                        location: `/course/${course._id}`,
                    })),
                });
            }
        } else if (user.isParent()) {
            // get all students linked to this parent
            // and then list all linked tut-courses

            const [students, studentsFindError] = await user.getStudents();
            if (!studentsFindError) {
                const tutCourses = (
                    (
                        await Promise.all(
                            students.map((s) => TutCourse.getTutCourseByUser(s._id)),
                        )
                    )
                        .map((tut) => tut[0])
                        .filter((tut) => tut != undefined) as TutCourse[]
                ).filter(
                    (course, index, self) =>
                        index === self.findIndex((c) => c._id.equals(course._id)),
                );
                // add to navbar
                navbar.push({
                    icon: "mdi-account-group",
                    label: "Klassen und TUT-Kurse",
                    location: "/tut",
                    children: tutCourses.map((tut) => ({
                        label: tut.name,
                        location: `/tut/${tut._id}`,
                    })),
                });
                // also get courses of each student of the parent
                // and add them to the navbar
                // split it into multiple parts, called "{genitive(name)} Kurse"

                let studentsCoursesNavbar: NavBarElement[] = [];

                await Promise.all(
                    students.map(async (s) => {
                        const [courses, coursesFindError] = await Course.listByMember(
                            s._id,
                        );
                        if (coursesFindError)
                            throw createError({
                                statusCode: 500,
                                name: "coursesFindError",
                                message: "Could not find courses",
                            });
                        studentsCoursesNavbar.push({
                            icon: "mdi-book-open-page-variant-outline",
                            label: `${genitive(s.fullName.split(" ")[0])} Kurse`,
                            location: `/course/${s._id}`,
                            children: courses.map((course) => ({
                                label: course.name,
                                location: `/course/${course._id}`,
                            })),
                        });
                    }),
                );

                studentsCoursesNavbar = studentsCoursesNavbar.sort(
                    // sort by name
                    (a, b) => a.label.localeCompare(b.label),
                );

                navbar.push(...studentsCoursesNavbar);
            }
        }
    }
    function genitive(name: string): string {
        // genitive s in german is without apostrophe except for names ending with s, x, z
        // example:
        // Max -> Max' Kurse
        // Julian -> Julians Kurse
        // Nicolai -> Nicolais Kurse
        // Felix -> Felix' Kurse
        if (name.endsWith("s") || name.endsWith("x") || name.endsWith("z")) {
            return `${name}'`;
        } else {
            return `${name}s`;
        }
    }

    const adminNavbar: NavBarSubelement[] = [];

    // check for different permissions and add the corresponding links
    if (user.hasPermission(Permissions.MANAGE_BLOCKED_PWDS)) {
        adminNavbar.push({
            label: "Gesperrte Passwörter",
            location: "/admin/blocked-pwds",
        });
    }

    if (user.hasPermission(Permissions.MANAGE_COURSES)) {
        adminNavbar.push({ label: "Kurse verwalten", location: "/admin/courses" });
        adminNavbar.push({
            label: "Klassen und Tutorkurse",
            location: "/admin/tut-courses",
        });
    }

    if (user.hasPermission(Permissions.VIEW_ALL_USERS)) {
        adminNavbar.push({ label: "Benutzer verwalten", location: "/admin/users" });
    }

    if (user.hasPermission(Permissions.MANAGE_SUBJECTS)) {
        adminNavbar.push({ label: "Fächer verwalten", location: "/admin/subjects" });
    }

    if (adminNavbar.length > 0) {
        navbar.push({
            icon: "mdi-shield-account",
            label: "Administration",
            location: "/admin",
            children: adminNavbar,
        });
    }

    return navbar;
});
