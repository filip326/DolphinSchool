import User from "../../Dolphin/User/User";
import Session from "../../Dolphin/Session/Session";
import BruteForceProtection from "../../Dolphin/BruteForceProtection/BruteForceProtection";

export default eventHandler(async (event) => {
    const { username, password } = await readBody(event);

    if (!username || !password || typeof username !== "string" || typeof password !== "string") {
        throw createError({ statusCode: 400, message: "Invalid body" });
    }

    if (
        !BruteForceProtection.isLoginAllowed(
            username,
            parseCookies(event)["bf-bypass-token"] || undefined,
        )
    ) {
        // if login is not allowed, throw an error
        throw createError({ statusCode: 429, message: "Too many requests" });
    }

    const [user, findUserError] = await User.getUserByUsername(username);

    if (findUserError || !user) {
        throw createError({
            statusCode: 401,
            message: "Invalid username or password",
        });
    }

    const [passwordCorrect, passwordCheckingError] = await user.comparePassword(password);

    if (passwordCheckingError) {
        throw createError({ statusCode: 500, message: "Internal server error" });
    }

    if (!passwordCorrect) {
        // if password is incorrect, report failed login attempt and throw an error
        BruteForceProtection.reportFailedLoginAttempt(
            username,
            parseCookies(event)["bf-bypass-token"] || undefined,
        );
        throw createError({
            statusCode: 401,
            message: "Invalid username or password",
        });
    }

    const [session, sessionCreateError] = await Session.createSession(user);

    if (sessionCreateError || !session) {
        throw createError({ statusCode: 500, message: "Internal server error" });
    }

    const token = session.token;

    setCookie(event, "token", token, {
        maxAge: 30 * 24 * 60 * 60, // 30 days
        secure: useRuntimeConfig().prod,
        httpOnly: true,
        sameSite: "strict",
        path: "/",
    });

    // if there is no bf-bypass-token cookie, issue a new one
    if (!parseCookies(event)["bf-bypass-token"]) {
        const [bypassToken, bypassTokenError] =
            await BruteForceProtection.issueBypassToken(username);
        if (bypassTokenError || !bypassToken) {
            throw createError({ statusCode: 500, message: "Internal server error" });
        }
        setCookie(event, "bf-bypass-token", bypassToken, {
            maxAge: 90 * 24 * 60 * 60, // 90 days
            secure: useRuntimeConfig().prod,
            httpOnly: true,
            sameSite: "strict",
            path: "/",
        });
    } else {
        // exceed the max age of the cookie if there already is one
        BruteForceProtection.exceedBypassToken(
            username,
            parseCookies(event)["bf-bypass-token"] as string,
        );
        setCookie(event, "bf-bypass-token", parseCookies(event)["bf-bypass-token"] as string, {
            maxAge: 90 * 24 * 60 * 60, // 90 days
            secure: useRuntimeConfig().prod,
            httpOnly: true,
            sameSite: "strict",
            path: "/",
        });
    }

    if (user.mfaEnabled) {
        await session.continueToMFA();
        return "continue with 2fa";
    }
    await session.activate();

    if (user.askForMFASetup) {
        return "continue with 2fa setup";
    }

    // send response with username
    return "Login successful";
});
