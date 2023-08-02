import Dolphin from "@/server/Dolphin/Dolphin";

export default eventHandler(async (event) => {
  const dolphin = Dolphin.instance ?? (await Dolphin.init());
  // find the session by the cookie "token"
  const token = parseCookies(event).token;
  if (!token || typeof token !== "string") {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const [session, sessionFindError] = await dolphin.sessions.findSession(token);
  if (sessionFindError) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  // disable the session
  const [sessionDisableResult, sessionDisableError] = await session.disable();
  if (sessionDisableError || sessionDisableResult !== true) {
    throw createError({ statusCode: 500, message: "Internal server error" });
  }

  // delete the cookie
  deleteCookie(event, "token");

  // send response
  return {
    message: "Logged out"
  };
});
