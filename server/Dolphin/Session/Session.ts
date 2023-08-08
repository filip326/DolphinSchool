import Dolphin from "../Dolphin";
import MethodResult from "../MethodResult";
import { ObjectId, WithId } from "mongodb";
import User from "../User/User";

enum SessionState {
    INACTIVE = 0,
    ACTIVE = 1,
    MFA_REQ = 2,
    DELETED = 3
}

interface ISession {
    type: "Session" | "ShortSession";

    token: string;
    userId: ObjectId;
    expires: number;

    lastUsed: number;

    state: SessionState;
}

class Session implements WithId<ISession> {
    // static methods
    private static generateToken(): string {
        let returnString = "";
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (let i = 0; i < 32; i++) {
            returnString += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return returnString;
    }

    static async createSession(
        user: User,
        expires?: number,
        short?: boolean
    ): Promise<MethodResult<Session>> {
        const session: ISession = {
            type: short ? "ShortSession" : "Session",
            token: this.generateToken(),
            userId: user._id,
            expires: expires ?? Date.now() + 604_800_000, // 7 days
            state: SessionState.INACTIVE,
            lastUsed: Date.now()
        };
        try {
            const dolphin: Dolphin | undefined = Dolphin.instance;
            if (!dolphin) throw new Error("Dolphin instance not initialized");
            const collection = dolphin.database.collection("sessions");
            const dbResult = await collection.insertOne(session);
            if (dbResult.acknowledged) {
                const sessionWithId: WithId<ISession> = {
                    ...session,
                    _id: dbResult.insertedId
                };

                return [new Session(sessionWithId), null];
            } else {
                return [undefined, new Error("Failed to create session")];
            }
        } catch {
            return [undefined, new Error("Failed to create session")];
        }
    }

    static async createShortSession(user: User): Promise<MethodResult<Session>> {
        return this.createSession(user, Date.now() + 3600_000, true); // 1 hour
    }

    static async findSession(token: string): Promise<MethodResult<Session>> {
        try {
            const dolphin: Dolphin | undefined = Dolphin.instance;
            if (!dolphin) throw new Error("Dolphin instance not initialized");
            const collection = dolphin.database.collection<ISession>("sessions");
            const dbResult = await collection.findOne({
                token: token
            });
            if (dbResult) {
                return [new Session(dbResult), null];
            } else {
                return [undefined, new Error("Session not found")];
            }
        } catch {
            return [undefined, new Error("Failed to find session")];
        }
    }

    static async tick() {
        const dolphin: Dolphin | undefined = Dolphin.instance;
        if (!dolphin) throw new Error("Dolphin instance not initialized");
        const sessionCollection = dolphin.database.collection<ISession>("sessions");
        // set all expired sessions to deleted
        await sessionCollection.updateMany(
            { expires: { $lt: Date.now() }, state: SessionState.ACTIVE },
            { $set: { state: SessionState.DELETED } }
        );

        // delete all inactive session that are expired for more than 48 hours
        await sessionCollection.deleteMany({
            state: SessionState.DELETED,
            expires: { $lt: Date.now() - 48 * 60 * 60 * 1000 }
        });

        // extend all non-expired sessions, that will expire in the next hour, and were used in the last 10 minutes by another hour
        await sessionCollection.updateMany(
            {
                $and: [
                    { state: SessionState.ACTIVE }, // active
                    { expires: { $gt: Date.now() } }, // not expired yet
                    {
                        expires: {
                            $lt: Date.now() + 60 * 60 * 1000
                        }
                    }, // will expire in the next hour
                    {
                        lastUsed: {
                            $gt: Date.now() - 10 * 60 * 1000
                        }
                    } // used in the last 10 minutes
                ]
            },
            { $inc: { expires: 60 * 60 * 1000 } } // extend by 1 hour
        );
    }

    _id: ObjectId;
    type: "Session" | "ShortSession";
    token: string;
    userId: ObjectId;
    lastUsed: number;
    expires: number;
    state: SessionState;

    private constructor(session: WithId<ISession>) {
        this._id = session._id;
        this.type = session.type;
        this.token = session.token;
        this.userId = session.userId;
        this.state = session.state;
        this.expires = session.expires;
        this.lastUsed = Date.now();
    }

    async activate(): Promise<MethodResult<boolean>> {
        this.state = SessionState.ACTIVE;
        try {
            const dolphin: Dolphin | undefined = Dolphin.instance;
            if (!dolphin) throw new Error("Dolphin instance not initialized");
            const dbResult = await dolphin.database
                .collection("sessions")
                .updateOne({ _id: this._id }, { $set: { state: SessionState.ACTIVE } });
            return [dbResult.modifiedCount === 1, null];
        } catch {
            return [undefined, new Error("Failed to activate session")];
        }
    }

    async reportUsage(): Promise<MethodResult<boolean>> {
        this.lastUsed = Date.now();
        try {
            const dolphin: Dolphin | undefined = Dolphin.instance;
            if (!dolphin) throw new Error("Dolphin instance not initialized");
            const dbResult = await dolphin.database
                .collection("sessions")
                .updateOne({ _id: this._id }, { $set: { lastUsed: this.lastUsed } });
            return [dbResult.modifiedCount === 1, null];
        } catch {
            return [undefined, new Error("Failed to report session usage")];
        }
    }

    async refresh(expries?: number): Promise<MethodResult<boolean>> {
        this.expires = expries ?? Date.now() + 1000 * 60 * 60 * 24 * 7; // 7 days
        try {
            const dolphin: Dolphin | undefined = Dolphin.instance;
            if (!dolphin) throw new Error("Dolphin instance not initialized");
            const dbResult = await dolphin.database
                .collection("sessions")
                .updateOne({ _id: this._id }, { $set: { expires: expries } });
            return [dbResult.modifiedCount === 1, null];
        } catch {
            return [undefined, new Error("Failed to refresh session")];
        }
    }

    async disable(): Promise<MethodResult<boolean>> {
        this.state = SessionState.DELETED;
        try {
            const dolphin: Dolphin | undefined = Dolphin.instance;
            if (!dolphin) throw new Error("Dolphin instance not initialized");
            const dbResult = await dolphin.database
                .collection("sessions")
                .updateOne({ _id: this._id }, { $set: { state: SessionState.DELETED } });
            return [dbResult.modifiedCount === 1, null];
        } catch {
            return [undefined, new Error("Failed to disable session")];
        }
    }

    async destroy(): Promise<MethodResult<boolean>> {
        this.state = SessionState.DELETED;
        try {
            const dolphin: Dolphin | undefined = Dolphin.instance;
            if (!dolphin) throw new Error("Dolphin instance not initialized");
            const dbResult = await dolphin.database.collection("sessions").deleteOne({
                _id: this._id
            });
            return [dbResult.acknowledged, null];
        } catch {
            return [undefined, new Error("Failed to delete session")];
        }
    }

    get timeCreated(): Date {
        return this._id.getTimestamp();
    }

    get isExpired(): boolean {
        if (this.expires === -1) {
            return false;
        }
        if (this.expires < Date.now()) {
            return true;
        }
        return false;
    }
}

export default Session;
export { ISession, SessionState };
