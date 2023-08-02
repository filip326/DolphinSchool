import MethodResult from "../MethodResult";
import { Collection, ObjectId, WithId } from "mongodb";

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

class Session implements ISession {
    _id: ObjectId;

    type: "Session" | "ShortSession";

    token: string;
    userId: ObjectId;

    lastUsed: number;

    expires: number;

    state: SessionState;

    private sessionCollection: Collection<ISession>;

    constructor(session: WithId<ISession>, sessionCollection: Collection<ISession>) {
        this._id = session._id;
        this.type = session.type;
        this.token = session.token;
        this.userId = session.userId;
        this.state = session.state;
        this.expires = session.expires;
        this.lastUsed = Date.now();

        this.sessionCollection = sessionCollection;
    }

    async activate(): Promise<MethodResult<boolean>> {
        this.state = SessionState.ACTIVE;
        try {
            const dbResult = await this.sessionCollection.updateOne(
                { _id: this._id },
                { $set: { state: SessionState.ACTIVE } }
            );
            return [dbResult.modifiedCount === 1, null];
        } catch {
            return [undefined, new Error("Failed to activate session")];
        }
    }

    async reportUsage(): Promise<MethodResult<boolean>> {
        this.lastUsed = Date.now();
        try {
            const dbResult = await this.sessionCollection.updateOne(
                { _id: this._id },
                { $set: { lastUsed: this.lastUsed } }
            );
            return [dbResult.modifiedCount === 1, null];
        } catch {
            return [undefined, new Error("Failed to report session usage")];
        }
    }

    async refresh(expries?: number): Promise<MethodResult<boolean>> {
        this.expires = expries ?? Date.now() + 1000 * 60 * 60 * 24 * 7; // 7 days
        try {
            const dbResult = await this.sessionCollection.updateOne(
                { _id: this._id },
                { $set: { expires: expries } }
            );
            return [dbResult.modifiedCount === 1, null];
        } catch {
            return [undefined, new Error("Failed to refresh session")];
        }
    }

    async disable(): Promise<MethodResult<boolean>> {
        this.state = SessionState.DELETED;
        try {
            const dbResult = await this.sessionCollection.updateOne(
                { _id: this._id },
                { $set: { state: SessionState.DELETED } }
            );
            return [dbResult.modifiedCount === 1, null];
        } catch {
            return [undefined, new Error("Failed to disable session")];
        }
    }

    async destroy(): Promise<MethodResult<boolean>> {
        this.state = SessionState.DELETED;
        try {
            const dbResult = await this.sessionCollection.deleteOne({
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
