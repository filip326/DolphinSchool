import { ObjectId } from "mongodb";
import { Permissions } from "~/server/Dolphin/PermissionsAndRoles/PermissionManager";
import User from "~/server/Dolphin/User/User";

export default defineEventHandler(async (event) => {
    const { success, statusCode } = await event.context.auth.checkAuth({
        PermissionLevel: Permissions.CHANGE_USER_PASSWORD,
    });
    if (!success) {
        throw createError({ statusCode });
    }

    const { id } = getRouterParams(event);

    if (!ObjectId.isValid(id)) {
        throw createError({ statusCode: 400, message: "Invalid id" });
    }

    const targetId = new ObjectId(id);

    const [target, targetFindError] = await User.getUserById(targetId);

    if (targetFindError) {
        throw createError({ statusCode: 500, message: "Failed" });
    }

    if (!target) {
        throw createError({ statusCode: 404, message: "User not found" });
    }

    // create a random password
    const randomPassword = createRandomPassword(12);

    // set the password
    const [setPasswordSuccess] = await target.setPassword(randomPassword);
    if (!setPasswordSuccess) {
        throw createError({ statusCode: 500, message: "Failed" });
    }

    await target.setPasswordChangeRequired(true);

    return {
        password: randomPassword,
    };
});

function createRandomPassword(length: number = 10): string {
    const lowerCaseLetters = "abcdefghijklmnopqrstuvwxyz";
    const upperCaseLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+-=[]{};':,./<>?";
    const all = lowerCaseLetters + upperCaseLetters + numbers + symbols;

    let password = "";
    password += lowerCaseLetters[Math.floor(Math.random() * lowerCaseLetters.length)];
    password += upperCaseLetters[Math.floor(Math.random() * upperCaseLetters.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    while (password.length < length) {
        password += all[Math.floor(Math.random() * all.length)];
    }

    // shuffle the password
    const passwordArray = password.split("");
    for (let i = passwordArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
    }
    password = passwordArray.join("");

    return password;
}
