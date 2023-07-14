import { Collection, Db, WithId } from "mongodb";
import Session, { ISession, SessionState } from "./Session";
import User from "../User/User";
import MethodResult from "../MethodResult";


class SessionManager {
    
    private sessionCollection: Collection<ISession>;

    constructor(db: Db) {
        this.sessionCollection = db.collection<ISession>("sessions");
    }

    private generateToken(): string {
        let returnString = "";
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (let i = 0; i < 32; i++) {
            returnString += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return returnString;
    }

    async createSession(user: User, ip: string, expires?: number, short?: boolean): Promise<MethodResult<Session>> {
        const session: ISession = {
            type: short ? "ShortSession" : "Session",
            token: this.generateToken(),
            userId: user._id,
            expires: expires ?? Date.now() + 604_800_000, // 7 days
            ip: ip,
            state: SessionState.INACTIVE,
            lastUsed: Date.now(),
        };
        try {
            const dbResult = await this.sessionCollection.insertOne(session);
            if (dbResult.acknowledged) {

                const sessionWithId: WithId<ISession> = {
                    ...session,
                    _id: dbResult.insertedId,
                };

                return [ new Session(sessionWithId, this.sessionCollection), null ];
            } else {
                return [ undefined, new Error("Failed to create session") ];
            }
        } catch {
            return [ undefined, new Error("Failed to create session") ];
        }
    }

    async createShortSession(user: User, ip: string): Promise<MethodResult<Session>> {
        return this.createSession(user, ip, Date.now() + 3600_000, true); // 1 hour
    }

    async findSession(token: string): Promise<MethodResult<Session>> {
    
        try {
            const dbResult = await this.sessionCollection.findOne({ token: token });
            if (dbResult) {
                return [ new Session(dbResult, this.sessionCollection), null ];
            } else {
                return [ undefined, new Error("Session not found") ];
            }
        } catch {
            return [ undefined, new Error("Failed to find session") ];
        }
    
    }

    async tick() {

        // find all expired session
        const expiredSessions = (await this.sessionCollection.find({ expires: { $lt: Date.now() }, state: SessionState.ACTIVE }).toArray()).map(session => new Session(session, this.sessionCollection));

        // set expired session to inactive
        for await (const session of expiredSessions) {
            try {
                await session.disable();
            } catch {
                console.error("Failed to disable session");
            }
        }

        // delete all inactive session that are older than 48 hours
        try {
            await this.sessionCollection.deleteMany({ state: SessionState.DELETED, expires: { $lt: Date.now() - 48 * 60 * 60 * 1000 } });
        } catch {
            console.error("Failed to delete inactive sessions");
        }

    }

}

export default SessionManager;
