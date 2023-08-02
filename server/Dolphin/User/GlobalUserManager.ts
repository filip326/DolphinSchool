import { Db, Collection } from "mongodb";
import FindUserOptions from "../User/FindUserOptions";
import SearchUserOptions from "../User/SearchUserOptions";
import MethodResult from "../MethodResult";
import User, { IUser } from "./User";
import CreateUserOptions from "./CreateUserOptions";
import genPassword from "./PasswordGen";

import { hash } from "bcrypt";
import UserCreated from "./UserCreated";
import Dolphin from "../Dolphin";

class GlobalUserManager {
    private readonly userCollection: Collection<IUser>;

    private static instance: GlobalUserManager;

    private constructor(db: Db) {
        this.userCollection = db.collection<IUser>("users");
    }

    public static getInstance(dolphin: Dolphin): GlobalUserManager {
        if (GlobalUserManager.instance) {
            return GlobalUserManager.instance;
        }

        GlobalUserManager.instance = new GlobalUserManager(dolphin.database);
        return GlobalUserManager.instance;
    }

    /**
     * Search multiple users
     * @param options SearchUserOptions
     * @returns Array of users
     */
    async searchUsers(options: SearchUserOptions): Promise<MethodResult<User[]>> {
        if (options.nameQuery || options.cources || options.class || options.parent || options.child) {
            try {
                const dbResult = await this.userCollection.find({
                    fullName: { $regex: options.nameQuery ?? "" },
                    cources: options.cources ?? null,
                    class: options.class ?? null,
                    parent: options.parent ?? null,
                    child: options.child ?? null
                }).skip(options.skip ?? 0);

                if (options.max) {
                    dbResult.limit(options.max);
                }
                return [(await dbResult.toArray()).map((user) => new User(this.userCollection, user)), null];
            } catch {
                return [undefined, Error("Database error")];
            }
        }

        return [undefined, Error("SearchUserOptions invalid")];
    }

    /**
     * find one user by options
     * @param options FindUserOptions
     * @returns a user
     */
    async findUser(options: FindUserOptions): Promise<MethodResult<User>> {
        if (options.id) {
            try {
                const dbResult = await this.userCollection.findOne({ _id: options.id });
                if (dbResult) {
                    const user = new User(this.userCollection, dbResult);
                    return [user, null];
                }
                return [undefined, Error("User not found")];
            } catch {
                return [undefined, Error("Database error")];
            }
        }

        if (options.fullName) {
            try {
                const dbResult = await this.userCollection.findOne({ fullName: options.fullName });
                if (dbResult) {
                    const user = new User(this.userCollection, dbResult);
                    return [user, null];
                }
                return [undefined, Error("User not found")];
            } catch {
                return [undefined, Error("Database error")];
            }
        }

        if (options.username) {
            try {
                const dbResult = await this.userCollection.findOne({ username: options.username });
                if (dbResult) {
                    const user = new User(this.userCollection, dbResult);
                    return [user, null];
                }
                return [undefined, Error("User not found")];
            } catch {
                return [undefined, Error("Database error")];
            }
        }

        return [undefined, Error("FindUserOptions invalid")];
    }

    /**
     * create a user
     * @param options CreateUserOptions
     * @returns UserCreated
     */
    async createUser(options: CreateUserOptions): Promise<MethodResult<UserCreated>> {
        const alreadyExists = await this.userCollection.findOne(
            { fullName: options.fullName }
        );

        if (alreadyExists) {
            return [undefined, Error("User already exists")];
        }

        if (!options.password) {
            options.password = genPassword(12);
        }

        const hashedPassword = await hash(options.password, 12);

        const dbResult = await this.userCollection.insertOne({
            type: options.type,
            fullName: options.fullName,
            username: options.username,
            password: hashedPassword,
            permissions: options.permissions ?? 0
        });
        if (!dbResult.acknowledged) {
            return [undefined, new Error("Database error")];
        }
        const userSearchResult = await this.userCollection.findOne({ _id: dbResult.insertedId });
        if (!userSearchResult) {
            return [undefined, new Error("Database error")];
        }
        const user = new User(this.userCollection, userSearchResult);
        return [{ ...user, clearPassword: options.password }, null];
    }

    /**
     * List of all users
     * @param options amount and skip
     * @returns Array of users
     */
    async list(options: { amount?: number; skip?: number }): Promise<MethodResult<User[]>> {
        const users = await this.userCollection.find().skip(options.skip ?? 0).limit(options.amount ?? 10).toArray();
        return [users.map((user) => new User(this.userCollection, user)), null];
    }
}

export default GlobalUserManager;
