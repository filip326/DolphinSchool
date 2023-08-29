import Dolphin from "../Dolphin";
import { Collection, ObjectId, WithId } from "mongodb";
import { UserType } from "./UserTypes";
import MethodResult, { DolphinErrorTypes } from "../MethodResult";
import PermissionManager, { Permissions } from "../Permissions/PermissionManager";
import { compare, hash } from "bcrypt";
import { ISubject } from "../Course/Subject";

import { randomBytes } from "node:crypto";

import * as OTPAuth from "otpauth";
import CreateUserOptions from "./CreateUserOptions";
import SearchUserOptions from "./SearchUserOptions";
import { RegistrationEncoded } from "@passwordless-id/webauthn/dist/esm/types";

interface IUser {
    type: UserType;
    fullName: string;
    username: string;
    password: string;
    mfa_secret?: string;
    mfa_setup_secret?: string;
    doNotAskForMFASetupUntil?: number;
    permissions: number;
    nickname?: string;

    changePasswordRequired: boolean;

    // student properties
    parents?: ObjectId[];

    // parent properties
    students?: ObjectId[];

    //teacher properties
    subjects?: ISubject[];

    webAuthNCredentials?: {
        [key: string]:
            | {
                  credential: {
                      id: string;
                      publicKey: string;
                      algorithm: "RS256" | "ES256";
                  };
                  authenticator: {
                      name: string;
                  };
              }
            | undefined;
    };
}

class User implements WithId<IUser> {
    // static methods to create, find, get or delete users

    static async searchUsers(options: SearchUserOptions): Promise<MethodResult<User[]>> {
        if (options.nameQuery || options.cources || options.class || options.parent || options.child) {
            try {
                const dolphin = Dolphin.instance ?? (await Dolphin.init(useRuntimeConfig()));
                const userCollection = dolphin.database.collection<IUser>("users");
                if (!userCollection) throw new Error("User collection not found");
                const dbResult = await userCollection
                    .find({
                        fullName: {
                            $regex: options.nameQuery ?? "",
                        },
                        cources: options.cources ?? null,
                        class: options.class ?? null,
                        parent: options.parent ?? null,
                        child: options.child ?? null,
                    })
                    .skip(options.skip ?? 0);

                if (options.max) {
                    dbResult.limit(options.max);
                }
                return [(await dbResult.toArray()).map((user: WithId<IUser>) => new User(userCollection, user)), null];
            } catch {
                return [undefined, DolphinErrorTypes.DATABASE_ERROR];
            }
        }

        return [undefined, DolphinErrorTypes.INVALID_ARGUMENT];
    }

    static async getUserById(id: ObjectId): Promise<MethodResult<User>> {
        const dolphin = Dolphin.instance ?? (await Dolphin.init(useRuntimeConfig()));
        const userCollection = dolphin.database.collection<IUser>("users");
        const user = await userCollection.findOne({ _id: id });
        if (!user) {
            return [undefined, DolphinErrorTypes.NOT_FOUND];
        }
        return [new User(userCollection, user), null];
    }

    static async getUserByUsername(username: string): Promise<MethodResult<User>> {
        const dolphin = Dolphin.instance ?? (await Dolphin.init(useRuntimeConfig()));
        const userCollection = dolphin.database.collection<IUser>("users");
        const user = await userCollection.findOne({ username });
        if (!user) {
            return [undefined, DolphinErrorTypes.NOT_FOUND];
        }
        return [new User(userCollection, user), null];
    }

    static async searchUsersByName(query: string): Promise<MethodResult<User[]>> {
        const dolphin = Dolphin.instance ?? (await Dolphin.init(useRuntimeConfig()));
        const userCollection = dolphin.database.collection<IUser>("users");
        const users = await userCollection.find({ fullName: { $regex: query, $options: "i" } }).toArray();
        return [users.map((user) => new User(userCollection, user)), null];
    }

    static async listUsers(options: { limit?: number; skip?: number }): Promise<MethodResult<User[]>> {
        const dolphin = Dolphin.instance ?? (await Dolphin.init(useRuntimeConfig()));
        const userCollection = dolphin.database.collection<IUser>("users");
        const users = await userCollection.find({}, { ...options }).toArray();
        return [users.map((user) => new User(userCollection, user)), null];
    }

    static async createUser(
        options: CreateUserOptions,
    ): Promise<MethodResult<{ id: ObjectId; username: string; password: string }>> {
        const dolphin = Dolphin.instance ?? (await Dolphin.init(useRuntimeConfig()));
        const userCollection = dolphin.database.collection<IUser>("users");

        const password = this.generatePassword();
        const passwordHash = await hash(password, 12);

        const user: IUser = {
            type: options.type,
            fullName: options.fullName,
            username: options.username,
            password: passwordHash,
            permissions: options.permissions ?? 0,
            changePasswordRequired: true,
        };

        // check if user type is valid
        if (!["student", "teacher", "parent"].includes(options.type)) {
            return [undefined, DolphinErrorTypes.INVALID_TYPE];
        }

        // check if user with same username exists
        const existingUser = await userCollection.findOne({ username: options.username });
        if (existingUser) {
            return [undefined, DolphinErrorTypes.ALREADY_EXISTS];
        }

        const result = await userCollection.insertOne(user);

        if (!result.acknowledged) {
            return [undefined, DolphinErrorTypes.FAILED];
        }

        return [{ id: result.insertedId, username: options.username, password }, null];
    }

    private static generatePassword(): string {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,;:!?@#$%^&*()_+-=";
        let password = "";
        for (let i = 0; i < 12; i++) {
            password += chars[Math.floor(Math.random() * chars.length)];
        }
        return password;
    }

    _id: ObjectId;
    type: UserType;
    fullName: string;
    username: string;
    password: string;
    permissions: number;

    changePasswordRequired: boolean;

    mfa_secret?: string;
    mfa_setup_secret?: string;
    doNotAskForMFASetupUntil?: number;

    parents?: ObjectId[];
    students?: ObjectId[];

    nickname?: string;

    subjects?: ISubject[];

    _permissionManager: PermissionManager;

    userCollection: Collection<IUser>;

    webAuthNCredentials?: {
        [key: string]:
            | {
                  credential: {
                      id: string;
                      publicKey: string;
                      algorithm: "RS256" | "ES256";
                  };
                  authenticator: {
                      name: string;
                  };
              }
            | undefined;
    };

    private _totp?: OTPAuth.TOTP;
    private _setupTotp?: OTPAuth.TOTP;

    private constructor(collection: Collection<IUser>, user: WithId<IUser>) {
        this._id = user._id;
        this.type = user.type;
        this.fullName = user.fullName;
        this.password = user.password;
        this.username = user.username;
        this.permissions = user.permissions;

        this.changePasswordRequired = user.changePasswordRequired;

        this.parents = user.parents;
        this.students = user.students;

        this.nickname = user.nickname;

        this.subjects = user.subjects;

        this._permissionManager = new PermissionManager(this.permissions);

        this.userCollection = collection;

        this.mfa_secret = user.mfa_secret;
        this.mfa_setup_secret = user.mfa_setup_secret;
        this.doNotAskForMFASetupUntil = user.doNotAskForMFASetupUntil;

        if (this.mfa_secret) {
            this._totp = new OTPAuth.TOTP({
                issuer: "DolphinSchool",
                label: this.username,
                algorithm: "SHA1",
                digits: 6,
                period: 30,
                secret: OTPAuth.Secret.fromBase32(this.mfa_secret),
            });
        }
        if (this.mfa_setup_secret) {
            this._setupTotp = new OTPAuth.TOTP({
                issuer: "DolphinSchool",
                label: this.username,
                algorithm: "SHA1",
                digits: 6,
                period: 30,
                secret: OTPAuth.Secret.fromBase32(this.mfa_setup_secret),
            });
        }

        this.webAuthNCredentials = user.webAuthNCredentials;
    }

    /**
     * only for type == "student"
     * @param index
     * @returns
     */
    async getParents(index?: number): Promise<MethodResult<User | User[]>> {
        let parentsIds = this.parents;

        if (!parentsIds && this.type !== "student") {
            return [undefined, DolphinErrorTypes.INVALID_TYPE];
        } else {
            parentsIds = this.parents ?? [];
        }

        if (index && index % 1 === 0 && index < parentsIds.length && index >= 0) {
            const dbResult = await this.userCollection.findOne({
                _id: parentsIds[index],
            });
            if (!dbResult) {
                return [undefined, DolphinErrorTypes.NOT_FOUND];
            }
            const parent = new User(this.userCollection, dbResult);
            if (parent.isParent()) {
                return [parent, null];
            }
            return [undefined, DolphinErrorTypes.INVALID_TYPE];
        }

        const dbResult = await this.userCollection.find({ $or: parentsIds.map((id) => ({ _id: id })) }).toArray();
        if (!dbResult || dbResult.length === 0) {
            return [undefined, DolphinErrorTypes.NOT_FOUND];
        }
        const parents = dbResult.map((id) => new User(this.userCollection, id));
        for (const parent of parents) {
            if (!parent.isStudent()) {
                return [undefined, DolphinErrorTypes.INVALID_TYPE];
            }
        }
        return [parents, null];
    }

    /**
     * only for type == "parent"
     * @param index
     * @returns
     */
    async getStudents(index?: number): Promise<MethodResult<User | User[]>> {
        let studentsIds = this.students;

        if (!studentsIds && this.type !== "parent") {
            return [undefined, DolphinErrorTypes.INVALID_TYPE];
        } else {
            studentsIds = this.students ?? [];
        }

        if (index && index % 1 === 0 && index < studentsIds.length && index >= 0) {
            const dbResult = await this.userCollection.findOne({
                _id: studentsIds[index],
            });
            if (!dbResult) {
                return [undefined, DolphinErrorTypes.NOT_FOUND];
            }
            const student = new User(this.userCollection, dbResult);
            if (student.isStudent()) {
                return [student, null];
            }
            return [undefined, DolphinErrorTypes.INVALID_TYPE];
        }

        const dbResult = await this.userCollection.find({ $or: studentsIds.map((id) => ({ _id: id })) }).toArray();
        if (!dbResult || dbResult.length === 0) {
            return [undefined, DolphinErrorTypes.NOT_FOUND];
        }
        const students = dbResult.map((id) => new User(this.userCollection, id)) as User[];
        for (const student of students) {
            if (!student.isStudent()) {
                return [undefined, DolphinErrorTypes.INVALID_TYPE];
            }
        }
        return [students, null];
    }

    /**
     * check if the user has a permission
     * @param perm Permission
     */
    hasPermission(perm: Permissions): boolean {
        return this._permissionManager.has(perm);
    }

    /**
     * give the user a permission
     * @param perm Permission
     */
    async allowPermission(perm: Permissions): Promise<MethodResult<boolean>> {
        this._permissionManager.allow(perm);
        this.permissions = this._permissionManager.permissions;
        try {
            const updateResult = await this.userCollection.findOneAndUpdate(
                { _id: this._id },
                { $set: { permissions: this.permissions } },
            );
            return [updateResult.ok === 1, null];
        } catch {
            return [undefined, DolphinErrorTypes.DATABASE_ERROR];
        }
    }

    /**
     * deny the user a permission
     * @param perm Permission
     */
    async denyPermission(perm: Permissions): Promise<MethodResult<boolean>> {
        this._permissionManager.deny(perm);
        this.permissions = this._permissionManager.permissions;
        try {
            const updateResult = await this.userCollection.findOneAndUpdate(
                { _id: this._id },
                { $set: { permissions: this.permissions } },
            );
            return [updateResult.ok === 1, null];
        } catch {
            return [undefined, DolphinErrorTypes.DATABASE_ERROR];
        }
    }

    isStudent(): boolean {
        return this.type === "student";
    }

    isParent(): boolean {
        return this.type === "parent";
    }

    async setPasswordChangeRequired(required: boolean): Promise<MethodResult<boolean>> {
        this.changePasswordRequired = required;
        try {
            const updateResult = await this.userCollection.findOneAndUpdate(
                { _id: this._id },
                { $set: { changePasswordRequired: this.changePasswordRequired } },
            );
            return [updateResult.ok === 1, null];
        } catch {
            return [undefined, DolphinErrorTypes.DATABASE_ERROR];
        }
    }

    /**
     * set the user's password
     * @param password string
     */
    async setPassword(password: string): Promise<MethodResult<boolean>> {
        // check some password requirements
        if (password.length < 8) {
            return [undefined, DolphinErrorTypes.INVALID_ARGUMENT];
        }
        if (!/[a-z]/.test(password)) {
            return [undefined, DolphinErrorTypes.INVALID_ARGUMENT];
        }
        if (!/[A-Z]/.test(password)) {
            return [undefined, DolphinErrorTypes.INVALID_ARGUMENT];
        }
        if (!/[0-9]/.test(password)) {
            return [undefined, DolphinErrorTypes.INVALID_ARGUMENT];
        }

        let passwordHash: string;
        try {
            passwordHash = await hash(password, 12);
        } catch {
            return [undefined, DolphinErrorTypes.FAILED];
        }
        this.password = passwordHash;
        try {
            const dbResult = await this.userCollection.findOneAndUpdate(
                {
                    _id: this._id,
                },
                { $set: { password: this.password } },
            );
            if (dbResult.ok === 1) {
                return [true, null];
            } else {
                return [false, null];
            }
        } catch {
            return [undefined, DolphinErrorTypes.DATABASE_ERROR];
        }
    }

    /**
     * Compare a password with the user's password
     * @param password string
     */
    async comparePassword(password: string): Promise<MethodResult<boolean>> {
        try {
            const hashResult = await compare(password, this.password);
            return [hashResult, null];
        } catch {
            return [undefined, DolphinErrorTypes.FAILED];
        }
    }

    get mfaEnabled(): boolean {
        return this.mfa_secret !== undefined;
    }

    get isSettingUp2fa(): boolean {
        return this.mfa_setup_secret !== undefined;
    }

    checkMFA(code: string): boolean {
        if (useRuntimeConfig().prod === false && code === "12345678") {
            // in development mode, allow 123456 as a valid code for testing purposes
            return true;
        }

        // if there is no totp set up, return true ( = allow access)
        if (!this._totp) {
            return true;
        }

        return this._totp.validate({ token: code, window: 10 }) !== null;
    }

    async setUpMFA(): Promise<MethodResult<string>> {
        // 0. check if mfa is already set up
        if (this.mfa_secret) {
            return [undefined, DolphinErrorTypes.ALREADY_EXISTS];
        }

        // 1. generate secret
        const secret = OTPAuth.Secret.fromHex(randomBytes(32).toString("hex"));

        // 2. save secret to this.mfa_secret
        this.mfa_setup_secret = secret.base32;

        // 3. create totp object
        this._setupTotp = new OTPAuth.TOTP({
            issuer: "DolphinSchool",
            label: this.username,
            algorithm: "SHA1",
            digits: 6,
            period: 30,
            secret: secret,
        });

        // 4. save this.mfa_secret to database

        const dbResult = await this.userCollection.findOneAndUpdate(
            { _id: this._id },
            { $set: { mfa_setup_secret: this.mfa_setup_secret } },
        );

        // 5. return the setup url for the user to scan if the database update was successful
        //    else return an error
        if (dbResult.ok === 1) {
            return [this._setupTotp.toString(), null];
        }

        // if it was not successful, return an error and undo the changes to this object
        this.mfa_setup_secret = undefined;
        this._setupTotp = undefined;
        return [undefined, DolphinErrorTypes.DATABASE_ERROR];
    }

    async completeMFASetup(code: string): Promise<MethodResult<boolean>> {
        // 0. check if mfa is already set up
        if (this.mfa_secret) {
            return [undefined, DolphinErrorTypes.ALREADY_EXISTS];
        }

        // 1. check if there is a setup totp object
        if (!this._setupTotp || !this.mfa_setup_secret) {
            return [undefined, DolphinErrorTypes.NOT_SUPPORTED];
        }

        // 2. check if code is valid
        if (this._setupTotp.validate({ token: code, window: 30, timestamp: Date.now() }) === null) {
            console.log("Expected code" + this._setupTotp.generate());
            console.log("Actual code" + code);
            return [false, null];
        }

        // 3. save this.mfa_secret to database
        this.mfa_secret = this.mfa_setup_secret;
        this.mfa_setup_secret = undefined;
        this._totp = this._setupTotp;
        this._setupTotp = undefined;

        const dbResult = await this.userCollection.findOneAndUpdate(
            { _id: this._id },
            {
                $set: { mfa_secret: this.mfa_secret },
                $unset: { mfa_setup_secret: "" },
            },
        );

        // 4. return true if the database update was successful
        //    else return an error
        if (dbResult.ok === 1) {
            return [true, null];
        }

        // if it was not successful, return an error and undo the changes to this object
        this.mfa_secret = undefined;
        this._totp = undefined;
        return [undefined, DolphinErrorTypes.DATABASE_ERROR];
    }

    get askForMFASetup(): boolean {
        if (this.mfaEnabled) {
            return false; // when mfa is enabled, do not ask to setup mfa
        }
        if (!this.doNotAskForMFASetupUntil) {
            return true; // when doNotAskForMFASetupUntil is not set, ask to setup mfa
        }
        if (this.doNotAskForMFASetupUntil < Date.now()) {
            return true; // when doNotAskForMFASetupUntil is in the past, ask to setup mfa
        }
        return false; // when doNotAskForMFASetupUntil is in the future, do not ask to setup mfa
    }

    async doNotAskForMFASetup(period: "7d" | "30d"): Promise<MethodResult<boolean>> {
        switch (period) {
            case "7d":
                this.doNotAskForMFASetupUntil = Date.now() + 1000 * 60 * 60 * 24 * 7;
                break;
            case "30d":
                this.doNotAskForMFASetupUntil = Date.now() + 1000 * 60 * 60 * 24 * 30;
                break;
            default:
                return [undefined, DolphinErrorTypes.INVALID_ARGUMENT];
        }

        const dbResult = await this.userCollection.findOneAndUpdate(
            { _id: this._id },
            { $set: { doNotAskForMFASetupUntil: this.doNotAskForMFASetupUntil } },
        );

        if (dbResult.ok === 1) {
            return [true, null];
        }

        this.doNotAskForMFASetupUntil = undefined;
        return [undefined, DolphinErrorTypes.DATABASE_ERROR];
    }

    async disableMFA(): Promise<MethodResult<boolean>> {
        if (!this.mfaEnabled) {
            return [undefined, DolphinErrorTypes.NOT_SUPPORTED];
        }

        const tempMFASecret = this.mfa_secret,
            tempTOTP = this._totp;

        this.mfa_secret = undefined;
        this.mfa_setup_secret = undefined;
        this._totp = undefined;
        this._setupTotp = undefined;

        const dbResult = await this.userCollection.findOneAndUpdate(
            { _id: this._id },
            { $unset: { mfa_secret: "", mfa_setup_secret: "" } },
        );

        if (dbResult.ok === 1) {
            return [true, null];
        }

        this.mfa_secret = tempMFASecret;
        this._totp = tempTOTP;
        return [undefined, DolphinErrorTypes.DATABASE_ERROR];
    }

    async cancelMFASetup(): Promise<MethodResult<boolean>> {
        this._setupTotp = undefined;
        this.mfa_setup_secret = undefined;

        const dbResult = await this.userCollection.findOneAndUpdate(
            { _id: this._id },
            { $unset: { mfa_setup_secret: "" } },
        );

        if (dbResult.ok === 1) {
            return [true, null];
        }

        return [undefined, DolphinErrorTypes.DATABASE_ERROR];
    }

    getWebAuthNCredentials(id: string) {
        return this.webAuthNCredentials?.[id]?.credential;
    }

    async addWebAuthNCredential(credential: RegistrationEncoded): Promise<MethodResult<boolean>> {
        // 1. get credential id
        const id = credential.credential.id;

        // 2. create an empty object if webAuthNCredentials is undefined
        if (!this.webAuthNCredentials) {
            this.webAuthNCredentials = {};
        }

        // 3. check if credential id already exists
        if (this.webAuthNCredentials[id]) {
            return [undefined, DolphinErrorTypes.ALREADY_EXISTS];
        }

        // 4. add credential to webAuthNCredentials
        this.webAuthNCredentials[id] = {
            credential: credential.credential,
            authenticator: {
                name: credential.authenticatorData,
            },
        };

        // 5. save webAuthNCredentials to database
        const dbResult = await this.userCollection.findOneAndUpdate(
            { _id: this._id },
            {
                $set: {
                    [`webAuthNCredentials.${id}`]: this.webAuthNCredentials[id],
                },
            },
        );

        // 6. return true if the database update was successful
        //    else return an error
        if (dbResult.ok === 1) {
            return [true, null];
        }

        // if it was not successful, return an error and undo the changes to this object
        this.webAuthNCredentials[id] = undefined;
        return [undefined, DolphinErrorTypes.DATABASE_ERROR];
    }
}

export default User;
export { IUser };
