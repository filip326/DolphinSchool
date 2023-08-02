import Dolphin from "../Dolphin";
import MethodResult from "../MethodResult";
import Token, { IToken } from "./Token";
import { Collection, Db } from "mongodb";

class GlobalTokenManger {
    private readonly tokenCollection: Collection<IToken>;

    private static instance: GlobalTokenManger;

    private constructor(db: Db) {
        this.tokenCollection = db.collection<IToken>("thirds_party_tokens");
    }

    public static getInstance(dolphin: Dolphin): GlobalTokenManger {
        if (GlobalTokenManger.instance) {
            return GlobalTokenManger.instance;
        }

        GlobalTokenManger.instance = new GlobalTokenManger(dolphin.database);
        return GlobalTokenManger.instance;
    }

    public async findToken(token: string): Promise<MethodResult<Token>> {
        try {
            const tokenObj = await this.tokenCollection.findOne({
                token: token
            });

            if (!tokenObj) {
                return [undefined, new Error("Token not found")];
            }

            // check if token is expired
            if (new Date(tokenObj.expires) < new Date()) {
                // delete the token
                await this.tokenCollection.deleteOne({
                    token: token
                });
                return [undefined, new Error("Token expired")];
            }

            return [new Token(tokenObj), null];
        } catch (err: any) {
            return [undefined, err as Error];
        }
    }

    public async deleteToken(token: string): Promise<MethodResult<boolean>> {
        try {
            const result = await this.tokenCollection.deleteOne({
                token: token
            });

            if (result.deletedCount === 0) {
                return [false, null];
            }

            return [true, null];
        } catch (err: any) {
            return [undefined, err as Error];
        }
    }

    public async createToken(token: IToken): Promise<MethodResult<Token>> {
        try {
            const result = await this.tokenCollection.insertOne(token);

            if (!result.acknowledged) {
                return [undefined, new Error("Failed to create token")];
            }

            return [new Token(token), null];
        } catch (err: any) {
            return [undefined, err as Error];
        }
    }
}

export default GlobalTokenManger;
