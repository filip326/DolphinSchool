
export default defineEventHandler(async (event) => {

  // check authentication
  if (!event.context.auth.authenticated || event.context.auth.mfa_required || !event.context.auth.user) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  // get user object
  // const user = event.context.auth.user
    


});