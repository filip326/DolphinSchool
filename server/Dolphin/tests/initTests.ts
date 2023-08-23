// functions userfull for tests

import { hash } from "bcrypt";
import { IUser } from "../User/User";

/**
 *
 * @param amount
 * @returns as many dummy users as specified in amount
 */
async function manyDummyUsers(amount: number): Promise<IUser[]> {
    const users: IUser[] = [];
    for (let i = 0; i < amount; i++) {
        users.push({
            username: `testUser${i}`,
            fullName: `Test User ${i}`,
            type: i % 3 === 0 ? "student" : i % 3 === 1 ? "teacher" : "parent",
            password: await hash("testPassword", 10),
            permissions: 0
        });
    }
    return users;
}

export { manyDummyUsers };
