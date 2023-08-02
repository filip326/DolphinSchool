import Dolphin from "@/server/Dolphin/Dolphin";

export default eventHandler(async (event) => {
    const dolphin = Dolphin.instance ?? (await Dolphin.init());
    const { username, password } = await readBody(event);
    console.log(await readBody(event));

    if (!username || !password || typeof username !== "string" || typeof password !== "string") {
        throw createError({ statusCode: 400, message: "Invalid body" });
    }

    const [user, findUserError] = await dolphin.users.findUser({ username });

    if (findUserError) {
        throw createError({
            statusCode: 401,
            message: "Invalid username or password"
        });
    }

    const [passwordCorrect, passwordCheckingError] = await user.comparePassword(password);

    if (passwordCheckingError) {
        throw createError({ statusCode: 500, message: "Internal server error" });
    }

    if (!passwordCorrect) {
        throw createError({
            statusCode: 401,
            message: "Invalid username or password"
        });
    }

    const [session, sessionCreateError] = await dolphin.sessions.createSession(user);

    if (sessionCreateError) {
        throw createError({ statusCode: 500, message: "Internal server error" });
    }

    await session.activate();

    const token = session.token;
    const expires = session.expires;

    // check if user needs 2fa
    // TODO: implement 2fa

    setCookie(event, "token", token, {
        maxAge: 30 * 24 * 60 * 60, // 30 days
        secure: useRuntimeConfig().prod,
        httpOnly: true,
        sameSite: "strict",
        path: "/"
    });

    // send response with username
    return {
        username,
        expires
    };
});
