import { Collection, ObjectId, WithId } from "mongodb";
import { UserType } from "./UserTypes";
import MethodResult from "../MethodResult";
import Student from "./Student/Student";
import PermissionManager, { Permissions } from "../Permissions/PermissionManager";
import Parent from "./Parent/Parent";
import { compare, hash } from "bcrypt";
import { ISubject } from "../Course/Subject";

import { randomBytes } from "node:crypto";

import * as OTPAuth from "otpauth";
import { random } from "node-emoji";

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

    // student properties
    parents?: ObjectId[];

    // parent properties
    students?: ObjectId[];

    //teacher properties
    subjects?: ISubject[];
}

class User implements WithId<IUser> {
    _id: ObjectId;
    type: UserType;
    fullName: string;
    username: string;
    password: string;
    permissions: number;

    mfa_secret?: string;
    mfa_setup_secret?: string;
    doNotAskForMFASetupUntil?: number;

    parents?: ObjectId[];
    students?: ObjectId[];

    nickname?: string;

    subjects?: ISubject[];

    _permissionManager: PermissionManager;

    userCollection: Collection<IUser>;

    private _totp?: OTPAuth.TOTP;
    private _setupTotp?: OTPAuth.TOTP;

    constructor(collection: Collection<IUser>, user: WithId<IUser>) {
        this._id = user._id;
        this.type = user.type;
        this.fullName = user.fullName;
        this.password = user.password;
        this.username = user.username;
        this.permissions = user.permissions;

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
                { $set: { permissions: this.permissions } }
            );
            return [updateResult.ok === 1, null];
        } catch {
            return [undefined, new Error("Database error")];
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
                { $set: { permissions: this.permissions } }
            );
            return [updateResult.ok === 1, null];
        } catch {
            return [undefined, new Error("Database error")];
        }
    }

    isStudent(): this is Student {
        return this.type === "student";
    }

    isParent(): this is Parent {
        return this.type === "parent";
    }

    /**
     * set the user's password
     * @param password string
     */
    async setPassword(password: string): Promise<MethodResult<boolean>> {
        let passwordHash: string;
        try {
            passwordHash = await hash(password, 12);
        } catch {
            return [undefined, new Error("Hashing error")];
        }
        this.password = passwordHash;
        try {
            const dbResult = await this.userCollection.findOneAndUpdate(
                {
                    _id: this._id
                },
                { $set: { password: this.password } }
            );
            if (dbResult.ok === 1) {
                return [true, null];
            } else {
                return [false, null];
            }
        } catch {
            return [undefined, new Error("Database error")];
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
            return [undefined, new Error("Hashing error")];
        }
    }

    get mfaEnabled(): boolean {
        return this.mfa_secret !== undefined;
    }

    checkMFA(code: string): boolean {
        if (useRuntimeConfig().prod === false && code === "123456") {
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
            return [undefined, Error("MFA is already set up")];
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
            { $set: { mfa_secret: this.mfa_secret } }
        );

        // 5. return the setup url for the user to scan if the database update was successful
        //    else return an error
        if (dbResult.ok === 1) {
            return [
                this._setupTotp.toString(),
                null
            ];
        }

        // if it was not successful, return an error and undo the changes to this object
        this.mfa_secret = undefined;
        this._totp = undefined;
        return [undefined, Error("Database error")];

    }

    async completeMFASetup(code: string): Promise<MethodResult<boolean>> {

        // 0. check if mfa is already set up
        if (this.mfa_secret) {
            return [undefined, Error("MFA is already set up")];
        }

        // 1. check if there is a setup totp object
        if (!this._setupTotp || !this.mfa_setup_secret) {
            return [undefined, Error("MFA is not set up")];
        }

        // 2. check if code is valid
        if (!this._setupTotp.validate({ token: code, window: 10 })) {
            return [undefined, Error("Code is invalid")];
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
                $unset: { mfa_setup_secret: "" }
            }
        );

        // 4. return true if the database update was successful
        //    else return an error
        if (dbResult.ok === 1) {
            return [true, null];
        }

        // if it was not successful, return an error and undo the changes to this object
        this.mfa_secret = undefined;
        this._totp = undefined;
        return [undefined, Error("Database error")];

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
                return [undefined, Error("Invalid period")];
        }

        const dbResult = await this.userCollection.findOneAndUpdate(
            { _id: this._id },
            { $set: { doNotAskForMFASetupUntil: this.doNotAskForMFASetupUntil } }
        );

        if (dbResult.ok === 1) {
            return [true, null];
        }

        this.doNotAskForMFASetupUntil = undefined;
        return [undefined, Error("Database error")];

    }
}

export default User;
export { IUser };
