/* eslint-disable no-case-declarations */
import { ObjectId } from "mongodb";
import MethodResult, { DolphinErrorTypes } from "../MethodResult";
import ASMSQInterpreter, { ASMSQResult } from "./AdvancedSyntaxObject";
import User from "../User/User";

interface ParsedASMSQResult {
    name: string;
    id: ObjectId | ObjectId[];
    collectionName: string;
    type: "user" | "class" | "cource" | "grade";
}

export default class ASMSQ {
    public static async suggest(
        query: string,
    ): Promise<MethodResult<ParsedASMSQResult[]>> {
        const result: ASMSQResult[] = new ASMSQInterpreter(query).result;

        if (!result || result.length === 0) {
            return [undefined, DolphinErrorTypes.NOT_FOUND];
        }

        const parsedResultRes = await this.processASMSQResult(result);
        if (parsedResultRes[1]) {
            return [undefined, parsedResultRes[1]];
        }

        return [parsedResultRes[0], null];
    }

    private static async processASMSQResult(
        result: ASMSQResult[],
    ): Promise<MethodResult<ParsedASMSQResult[]>> {
        if (!result || result.length === 0) {
            return [undefined, DolphinErrorTypes.NOT_FOUND];
        }

        const parsedResult: ParsedASMSQResult[] = [];

        result.forEach(async (item) => {
            switch (item.subtype) {
                case "user":
                    if (!item.name) {
                        return;
                    }
                    const userResult = await User.searchUsersByName(item.name);
                    if (!userResult[0] || userResult[1]) {
                        return;
                    }
                    userResult[0].forEach((user) => {
                        parsedResult.push({
                            name: user.fullName,
                            id: user._id,
                            collectionName: "users",
                            type: "user",
                        });
                    });
                    return;
                case "class":
                    // todo
                    return;
                case "course":
                    // todo
                    return;
                case "grade":
                    // todo
                    return;
            }
        });

        return [parsedResult, null];
    }
}
