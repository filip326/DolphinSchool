// how passwordless works
// 1. client requests passwordless token + challenge
// 2. server generates token + challenge
// 3. client creates qr code with token hash + challenge, scanned by user with phone
// 4. phone sends token hash + solved challenge to server
// 5. client logs in with token

import { ObjectId } from "mongodb";
import Dolphin from "../Dolphin";
import { createHash, randomBytes } from "crypto";
import MethodResult, { DolphinErrorTypes } from "../MethodResult";
import User from "../User/User";

import { server } from "@passwordless-id/webauthn";
import {
    AuthenticationEncoded,
    RegistrationEncoded,
} from "@passwordless-id/webauthn/dist/esm/types";

interface IPasswordlessQR {
    token: string;
    token_hash: string;
    challenge: string;
    expirery: number;
    user?: ObjectId;
}

class PasswordlessQR {
    static async requestChallenge(): Promise<
        MethodResult<{
            token: string;
            url: string;
            challenge: string;
            tokenSHA256: string;
            expires: number;
        }>
    > {
        this.tick();
        const dolphin = Dolphin.instance ?? (await Dolphin.init(useRuntimeConfig()));

        const token = randomBytes(256).toString("hex");
        const challenge = randomBytes(32).toString("hex");

        const expirery = Date.now() + 1000 * 60 * 5; // 5 minutes

        const tokenSHA256 = createHash("sha256").update(token).digest("hex");

        const dbResult = await dolphin.database
            .collection<IPasswordlessQR>("passwordless")
            .insertOne({
                token,
                token_hash: tokenSHA256,
                challenge,
                expirery,
            });

        if (!dbResult.acknowledged) {
            return [undefined, DolphinErrorTypes.DATABASE_ERROR];
        }

        return [
            {
                token,
                url: `${process.env.DOMAIN}/passwordless/aprove?token=${tokenSHA256}&challenge=${challenge}`,
                challenge,
                tokenSHA256,
                expires: expirery,
            },
            null,
        ];
    }

    static async approve(
        user: User,
        tokenHash: string,
        solvedChallenge: AuthenticationEncoded,
    ): Promise<MethodResult<boolean>> {
        this.tick();

        const dolphin = Dolphin.instance ?? (await Dolphin.init(useRuntimeConfig()));

        const dbResult = await dolphin.database
            .collection<IPasswordlessQR>("passwordless")
            .findOne({
                token_hash: tokenHash,
            });

        if (!dbResult) {
            return [undefined, DolphinErrorTypes.INVALID_ARGUMENT];
        }

        const challenge = dbResult.challenge;

        const credentials = user.getWebAuthNCredentials(solvedChallenge.credentialId);

        if (!credentials) return [undefined, DolphinErrorTypes.INVALID_ARGUMENT];
        try {
            const result = await server.verifyAuthentication(
                {
                    credentialId: solvedChallenge.credentialId,
                    authenticatorData: solvedChallenge.authenticatorData,
                    clientData: solvedChallenge.clientData,
                    signature: solvedChallenge.signature,
                },
                credentials,
                {
                    challenge,
                    origin: process.env.DOMAIN ?? "",
                    userVerified: true,
                    counter: -1,
                },
            );

            if (!result) {
                return [undefined, DolphinErrorTypes.FAILED];
            }

            // write user id to database
            const dbResult = await dolphin.database
                .collection<IPasswordlessQR>("passwordless")
                .updateOne(
                    {
                        token_hash: tokenHash,
                    },
                    {
                        $set: {
                            user: user._id,
                        },
                        $inc: {
                            expirery: 1000 * 120, // add 120 seconds to expirery
                        },
                    },
                );

            if (!dbResult.acknowledged) {
                return [undefined, DolphinErrorTypes.DATABASE_ERROR];
            }

            return [true, null];
        } catch (err) {
            return [undefined, DolphinErrorTypes.FAILED];
        }
    }

    static async login(token: string): Promise<MethodResult<User | false>> {
        this.tick();
        const dolphin = Dolphin.instance ?? (await Dolphin.init(useRuntimeConfig()));

        const challenge = await dolphin.database
            .collection<IPasswordlessQR>("passwordless")
            .findOne({
                token,
            });

        if (!challenge) {
            return [undefined, DolphinErrorTypes.INVALID_ARGUMENT];
        }

        if (challenge.expirery < Date.now()) {
            return [undefined, DolphinErrorTypes.NOT_SUPPORTED];
        }

        if (!challenge.user) {
            return [false, null];
        }

        // login successful, delete token since it's single use
        await dolphin.database.collection<IPasswordlessQR>("passwordless").deleteOne({
            token,
        });

        return User.getUserById(challenge.user);
    }

    static async register(
        user: User,
        token: string,
        solvedChallenge: RegistrationEncoded,
    ): Promise<MethodResult<boolean>> {
        this.tick();
        // get challenge from database by token
        const dolphin = Dolphin.instance ?? (await Dolphin.init(useRuntimeConfig()));

        const challenge = await dolphin.database
            .collection<IPasswordlessQR>("passwordless")
            .findOne({
                token,
            });

        if (!challenge) {
            return [undefined, DolphinErrorTypes.INVALID_ARGUMENT];
        }

        if (challenge.expirery < Date.now()) {
            return [undefined, DolphinErrorTypes.NOT_SUPPORTED];
        }

        try {
            // auth registration
            const result = await server.verifyRegistration(solvedChallenge, {
                challenge: challenge.challenge,
                origin: process.env.DOMAIN ?? "",
            });

            if (!result) {
                return [undefined, DolphinErrorTypes.FAILED];
            }

            // write credentials to database
            const [addResult, addError] =
                await user.addWebAuthNCredential(solvedChallenge);

            if (addError || !addResult) {
                return [undefined, DolphinErrorTypes.DATABASE_ERROR];
            }

            // login successful, delete token since it's single use
            await dolphin.database.collection<IPasswordlessQR>("passwordless").deleteOne({
                token,
            });

            return [true, null];
        } catch {
            return [undefined, DolphinErrorTypes.FAILED];
        }
    }

    static async tick() {
        const dolphin = Dolphin.instance ?? (await Dolphin.init(useRuntimeConfig()));
        await dolphin.database.collection<IPasswordlessQR>("passwordless").deleteMany({
            expirery: {
                $lt: Date.now() - 1000 * 60 * 2, // delete 2 minutes after expirery
            },
        });
    }
}

export default PasswordlessQR;
