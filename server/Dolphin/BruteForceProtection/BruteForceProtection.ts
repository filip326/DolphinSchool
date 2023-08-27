import MethodResult, { DolphinErrorTypes } from "../MethodResult";
import { Collection, Db } from "mongodb";

import { randomBytes } from "node:crypto";
import Dolphin from "../Dolphin";

const failedAttemtsAllowed = 5;

class BruteForceProtection {
    private bruteForceProtection: Collection<BruteForceProtectionEntry>;
    private bruteForceProtectionBypass: Collection<BruteForceProtectionBypassEntry>;

    private static instance: BruteForceProtection;

    private constructor(database: Db) {
        this.bruteForceProtection = database.collection("bruteForceProtection");
        this.bruteForceProtectionBypass = database.collection("bruteForceProtectionBypass");
    }

    public static getInstance(dolphin: Dolphin): BruteForceProtection {
        if (BruteForceProtection.instance) {
            return BruteForceProtection.instance;
        }

        BruteForceProtection.instance = new BruteForceProtection(dolphin.database);
        return BruteForceProtection.instance;
    }

    async isLoginAllowed(username: string, bypassToken?: string): Promise<MethodResult<boolean>> {
        if (!bypassToken) {
            try {
                const dbResult = await this.bruteForceProtection.findOne({
                    username: username,
                    expires: {
                        $gt: Date.now(),
                    },
                });

                if (!dbResult) {
                    return [true, null];
                }

                if (dbResult.failedAttemts >= failedAttemtsAllowed) {
                    return [false, null];
                }

                // if there is a BruteForceProtectionEntry, but less than 3 failed attempts, return true
                return [true, null];
            } catch {
                return [undefined, DolphinErrorTypes.DATABASE_ERROR];
            }
        }

        // check if device Token is valid
        try {
            const dbResult = this.bruteForceProtectionBypass.findOne({
                username: username,
                token: bypassToken,
                expires: { $gt: Date.now() },
            });

            // if device token is not valid, check if login is allowed without deviceToken
            if (!dbResult) return this.isLoginAllowed(username);

            // if device token is valid, check if login is allowed with deviceToken
            const dbResult2 = await this.bruteForceProtection.findOne({
                username: username,
                token: bypassToken,
                expires: { $gt: Date.now() },
            });

            if (!dbResult2) {
                return [true, null];
            }

            if (dbResult2.failedAttemts >= failedAttemtsAllowed) {
                return [false, null];
            }

            // if device token is valid and less than 3 failed attempts, return true
            return [true, null];
        } catch {
            return [undefined, DolphinErrorTypes.DATABASE_ERROR];
        }
    }

    async reportFailedLoginAttempt(
        username: string,
        bypassToken?: string,
    ): Promise<MethodResult<boolean>> {
        if (bypassToken) {
            // check if device Token is valid
            try {
                const dbResult = this.bruteForceProtectionBypass.findOne({
                    username: username,
                    token: bypassToken,
                    expires: {
                        $gt: Date.now(),
                    },
                });
                if (!dbResult) return this.reportFailedLoginAttempt(username);

                // if device token is valid, check if there already is a BruteForceProtectionEntry
                const dbResult2 = await this.bruteForceProtection.findOne({
                    username: username,
                    token: bypassToken,
                    expires: {
                        $gt: Date.now(),
                    },
                });

                // if there is no BruteForceProtectionEntry, create one, valid for 3 hours
                if (!dbResult2) {
                    try {
                        await this.bruteForceProtection.insertOne({
                            username: username,
                            token: bypassToken,
                            failedAttemts: 1,
                            expires: Date.now() + 3 * 60 * 60 * 1000,
                        });
                    } catch {
                        return [undefined, DolphinErrorTypes.DATABASE_ERROR];
                    }
                }
                // if there already is a BruteforceProtectionEntry, increment failed attempts and exceed expiration to 3 hours
                else {
                    try {
                        await this.bruteForceProtection.updateOne(
                            {
                                username: username,
                                token: bypassToken,
                            },
                            {
                                $inc: {
                                    failedAttemts: 1,
                                },
                                $set: {
                                    expires: Date.now() + 3 * 60 * 60 * 1000,
                                },
                            },
                        );
                    } catch {
                        return [undefined, DolphinErrorTypes.DATABASE_ERROR];
                    }
                }
            } catch {
                return [undefined, DolphinErrorTypes.DATABASE_ERROR];
            }
        }

        // do the same with username and without deviceToken
        const dbResult = await this.bruteForceProtection.findOne({
            username: username,
            token: { $exists: false },
            expires: { $gt: Date.now() },
        });

        // if there is a valid BruteForceProtectionEntry, increment failed attempts and exceed expiration to 3 hours
        if (dbResult) {
            try {
                await this.bruteForceProtection.updateOne(
                    {
                        username: username,
                        token: { $exists: false },
                    },
                    {
                        $inc: { failedAttemts: 1 },
                        $set: {
                            expires: Date.now() + 3 * 60 * 60 * 1000,
                        },
                    },
                );
                return [true, null];
            } catch {
                return [undefined, DolphinErrorTypes.DATABASE_ERROR];
            }
        }
        // if there is no valid BruteForceProtectionEntry, create one, valid for 3 hours
        else {
            try {
                await this.bruteForceProtection.insertOne({
                    username: username,
                    failedAttemts: 1,
                    expires: Date.now() + 3 * 60 * 60 * 1000,
                });
                return [true, null];
            } catch {
                return [undefined, DolphinErrorTypes.DATABASE_ERROR];
            }
        }
    }

    /**
     * ! WARN ! use this function only after a successful login attempt. It will issue a BruteForceProtection bypass for the given device
     */
    async issueBypassToken(username: string): Promise<MethodResult<string>> {
        // issue a new token
        const token = randomBytes(32).toString("hex");

        // write it to the database, valid for 30 days
        try {
            await this.bruteForceProtectionBypass.insertOne({
                username: username,
                token: token,
                expires: Date.now() + 30 * 24 * 60 * 60 * 1000,
            });
            return [token, null];
        } catch {
            return [undefined, DolphinErrorTypes.DATABASE_ERROR];
        }
    }

    /**
     * ! WARN ! use this function only after a successful login attempt. It will exceed the expiration of the given bypass token to 30 days
     */
    async exceedBypassToken(username: string, bypassToken: string): Promise<MethodResult<boolean>> {
        // check if token exists
        try {
            const dbResult = await this.bruteForceProtectionBypass.findOne({
                username: username,
                token: bypassToken,
                expires: { $gt: Date.now() },
            });
            if (!dbResult) return [false, null];

            // if token exists, exceed expiration to 30 days
            const dbResult2 = await this.bruteForceProtectionBypass.updateOne(
                {
                    username: username,
                    token: bypassToken,
                },
                {
                    $set: {
                        expires: Date.now() + 30 * 24 * 60 * 60 * 1000,
                    },
                },
            );
            return [dbResult2.acknowledged, null];
        } catch {
            return [undefined, DolphinErrorTypes.DATABASE_ERROR];
        }
    }

    /**
     * Please call this function periodically to clean up expired entries
     */
    async cleanUp() {
        try {
            // clean up expired BruteForceProtectionEntries
            await this.bruteForceProtection.deleteMany({
                expires: { $lt: Date.now() },
            });
            // clean up expired BruteForceProtectionBypass Tokens
            await this.bruteForceProtectionBypass.deleteMany({
                expires: { $lt: Date.now() },
            });
        } catch {
            // do nothing
        }
    }
}

interface BruteForceProtectionEntry {
    username: string;
    token?: string;
    failedAttemts: number;
    expires: number;
}

interface BruteForceProtectionBypassEntry {
    username: string;
    expires: number;
    token: string;
}

export default BruteForceProtection;
