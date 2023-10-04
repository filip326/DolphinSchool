import UserMessage from "~/server/Dolphin/Messenger/UserMessage";
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
    // - Posteingang
    // - Ungelesen (only if there are unread messages)
    // - Markiert
    // - Postausgang
    // - Neue Nachricht

    // check if there are unread messages
    const [unreadMessage, unreadMessageFindError] = await UserMessage.listUsersMessages(
        user,
        {},
        { read: false },
    );
    if (unreadMessageFindError)
        throw createError({
            statusCode: 500,
            name: "unreadMessageFindError",
            message: "Could not find unread messages",
        });

    if (unreadMessage.length > 0) {
        navbar.push({
            icon: "mdi-email",
            label: "Kommunikation",
            location: "/mail/inbox",
            children: [
                {
                    label: "Ungelesen",
                    location: "/mail/unread",
                    notification: unreadMessage.length,
                },
                { label: "Markiert", location: "/mail/stared" },
                { label: "Postausgang", location: "/mail/outbox" },
                { label: "Neue Nachricht", location: "/mail/write" },
            ],
        });
    } else {
        navbar.push({
            icon: "mdi-email",
            label: "Kommunikation",
            location: "/mail/inbox",
            children: [
                { label: "Markiert", location: "/mail/stared" },
                { label: "Postausgang", location: "/mail/outbox" },
                { label: "Neue Nachricht", location: "/mail/write" },
            ],
        });
    }

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
                children: tuts.map((tut) => ({ label: tut.name, location: `/tut/${tut._id}` })),
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
        } else if (user.isParent()) {
            // get all students linked to this parent
            // and then list all linked tut-courses

            const [students, studentsFindError] = await user.getStudents();
            if (!studentsFindError) {
                const tutCourses = (
                    (await Promise.all(students.map((s) => TutCourse.getTutCourseByUser(s._id))))
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
            }
        }
    }

    return navbar;
});
