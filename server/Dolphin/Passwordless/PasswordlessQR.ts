
// how passwordless works
// 1. client requests passwordless token + challenge
// 2. server generates token + challenge
// 3. client creates qr code with token hash + challenge, scanned by user with phone
// 4. phone sends token hash + solved challenge to server
// 5. client logs in with token

import { ObjectId } from "mongodb";
import Dolphin from "../Dolphin";
import { createHash, randomBytes } from "crypto";
import MethodResult from "../MethodResult";
import User from "../User/User";

import { server } from "@passwordless-id/webauthn";
import { AuthenticationEncoded } from "@passwordless-id/webauthn/dist/esm/types";

interface IPasswordlessQR {
    token: string;
    token_hash: string;
    challenge: string;
    expirery: number;
    user?: ObjectId;
}

class PasswordlessQR {

    static async requestChallenge(): Promise<MethodResult<{ token: string, url: string }>> {
        const dolphin = Dolphin.instance;
        if (!dolphin) throw Error("Dolphin not initialized");

        const token = randomBytes(256).toString("hex");
        const challenge = randomBytes(32).toString("hex");

        const expirery = Date.now() + 1000 * 60 * 5; // 5 minutes

        const tokenSHA256 = createHash("sha256").update(token).digest("hex");

        const dbResult = await dolphin.database.collection<IPasswordlessQR>("passwordless").insertOne({
            token,
            token_hash: tokenSHA256,
            challenge,
            expirery
        });

        if (!dbResult.acknowledged) {
            return [undefined, Error("Database error")];
        }

        return [{
            token,
            url: `${process.env.DOMAIN}/passwordless/aprove?token=${tokenSHA256}&challenge=${challenge}`,
        }, null];
    }

    static async approve(
        user: User,
        tokenHash: string,
        solvedChallenge: AuthenticationEncoded
    ): Promise<MethodResult<boolean>> {

        const dolphin = Dolphin.instance;
        if (!dolphin) throw Error("Dolphin not initialized");

        const dbResult = await dolphin.database.collection<IPasswordlessQR>("passwordless").findOne({
            token_hash: tokenHash
        });

        const challenge = dbResult?.challenge;

        if (!challenge) {
            return [undefined, Error("Invalid token")];
        }

        const credentials = user.getWebAuthNCredentials(solvedChallenge.credentialId);
        if (!credentials) return [undefined, Error("Invalid credentials")];
        try {
            const result = await server.verifyAuthentication(solvedChallenge, credentials, {
                challenge,
                origin: process.env.DOMAIN ?? "",
                userVerified: true,
                counter: -1,
            });

            if (!result) {
                return [ undefined, Error("Unknown error") ];
            }

            // write user id to database
            const dbResult = await dolphin.database.collection<IPasswordlessQR>("passwordless").updateOne({
                token_hash: tokenHash
            }, {
                $set: {
                    user: user._id
                }
            });

            if (!dbResult.acknowledged) {
                return [undefined, Error("Database error")];
            }

            return [true, null];

        } catch {
            return [undefined, Error("Invalid credentials")];
        }


    }

    static async login(token: string): Promise<MethodResult<User | false>> {
        const dolphin = Dolphin.instance;
        if (!dolphin) throw Error("Dolphin not initialized");

        const challenge = await dolphin.database.collection<IPasswordlessQR>("passwordless").findOne({
            token
        });

        if (!challenge) {
            return [undefined, Error("Invalid token")];
        }

        if (challenge.expirery < Date.now()) {
            return [undefined, Error("Token expired")];
        }

        if (!challenge.user) {
            return [ false, null ];
        }

        const user = await dolphin.database.collection<User>("users").findOne({
            _id: challenge.user
        });

        if (!user) {
            return [undefined, Error("Invalid user")];
        }

        // login successful, delete token since it's single use
        await dolphin.database.collection<IPasswordlessQR>("passwordless").deleteOne({
            token
        });

        return [user, null];
    }

}

export default PasswordlessQR;