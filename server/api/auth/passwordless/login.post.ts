import PasswordlessQR from "../../../Dolphin/Passwordless/PasswordlessQR";
import Session from "../../../Dolphin/Session/Session";

export default defineEventHandler(async (event) => {

    const { token, } = await readBody(event);

    if (!token || typeof token !== "string") {
        return createError({
            statusCode: 400,
            statusMessage: "Bad Request",
        });
    }

    // check if the token is valid to login using PasswordlessQR
    const [loginResult, loginError,] = await PasswordlessQR.login(token);

    if (loginError) {

        return createError({
            statusCode: 500,
            statusMessage: "Internal Server Error",
        });

    }

    if (!loginResult) {
        return "waiting for aproval";
    }

    // create a new session and return login sucessful
    const [session, sessionError,] = await Session.createSession(loginResult);

    if (sessionError || !session) {
        return createError({
            statusCode: 500,
            statusMessage: "Internal Server Error",
        });
    }

    // set the cookie
    setCookie(event, "token", session.token, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    await session.activate();

    return "Login successful";

});