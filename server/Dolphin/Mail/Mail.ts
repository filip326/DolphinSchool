import { Collection, ObjectId, WithId } from "mongodb";
import MethodResult, { DolphinErrorTypes } from "../MethodResult";
import Dolphin from "../Dolphin";

type Postfaecher = "inbox" | "outbox" | "stared" | "read";

interface IMail {
    sendBy: ObjectId;
    sendTo: ObjectId[];
    subject: string;
    content: string;
    readBy?: ObjectId[];
    staredBy?: ObjectId[];
    timestamp: number;
}

class Mail implements IMail {
    public static async createMail(mail: {
        sendBy: ObjectId;
        sendTo: ObjectId[];
        subject: string;
        content: string;
    }): Promise<MethodResult<boolean>> {
        const dolphin = Dolphin.instance ?? (await Dolphin.init(useRuntimeConfig()));
        const mailCollection = dolphin.database.collection<IMail>("mails");
        // add the time the mail was created to the mail object
        const timestamp = Date.now();
        const mailWithTime = { ...mail, timestamp };
        const result = await mailCollection.insertOne(mailWithTime);
        if (result.acknowledged) {
            return [true, null];
        } else {
            return [undefined, DolphinErrorTypes.FAILED];
        }
    }

    public static async getMail(
        id: ObjectId,
        user: ObjectId,
    ): Promise<MethodResult<Mail>> {
        const dolphin = Dolphin.instance ?? (await Dolphin.init(useRuntimeConfig()));
        const mailCollection = dolphin.database.collection<IMail>("mails");
        const result = await mailCollection.findOne({ _id: id });
        if (result) {
            return [new Mail(mailCollection, result, user), null];
        } else {
            return [undefined, DolphinErrorTypes.NOT_FOUND];
        }
    }

    public static async getMails(options: {
        sendBy?: ObjectId;
        sendTo?: ObjectId;
        postfachSearch?: {
            postfach: Postfaecher;
        };
        user: ObjectId;
    }): Promise<MethodResult<Mail[]>> {
        const dolphin = Dolphin.instance ?? (await Dolphin.init(useRuntimeConfig()));

        let returningResult: Mail[] = [];

        if (!options.sendBy && !options.sendTo && !options.postfachSearch) {
            return [undefined, DolphinErrorTypes.INVALID_ARGUMENT];
        }

        if (options.sendBy) {
            const mailCollection = dolphin.database.collection<IMail>("mails");
            const result = await mailCollection
                .find({ sendBy: options.sendBy })
                .toArray();
            returningResult = result.map(
                (mail) => new Mail(mailCollection, mail, options.user),
            );
        }

        if (options.sendTo) {
            const mailCollection = dolphin.database.collection<IMail>("mails");
            const result = await mailCollection
                .find({ sendTo: options.sendTo })
                .toArray();
            returningResult = result.map(
                (mail) => new Mail(mailCollection, mail, options.user),
            );
        }

        if (options.postfachSearch) {
            const mailCollection = dolphin.database.collection<IMail>("mails");

            if (options.postfachSearch.postfach === "inbox") {
                // get all mails that are send to user id
                // ! the query makes no sense but works
                const result = await mailCollection
                    .find({ sendTo: options.user.toString() })
                    .toArray();
                returningResult = result.map(
                    (mail) => new Mail(mailCollection, mail, options.user),
                );
            } else if (options.postfachSearch.postfach === "outbox") {
                // get all mails where sendBy is user id
                const result = await mailCollection
                    .find({ sendBy: options.user })
                    .toArray();
                returningResult = result.map(
                    (mail) => new Mail(mailCollection, mail, options.user),
                );
            } else if (options.postfachSearch.postfach === "stared") {
                // get all mails where staredBy contains user id
                const result = await mailCollection
                    .find({ staredBy: options.user.toString() })
                    .toArray();
                returningResult = result.map(
                    (mail) => new Mail(mailCollection, mail, options.user),
                );
            } else if (options.postfachSearch.postfach === "read") {
                // get all mails where readBy contains user id
                const result = await mailCollection
                    .find({ readBy: options.user.toString() })
                    .toArray();
                returningResult = result.map(
                    (mail) => new Mail(mailCollection, mail, options.user),
                );
            }
        }

        if (returningResult.length > 0) {
            return [returningResult, null];
        } else {
            return [undefined, DolphinErrorTypes.NOT_FOUND];
        }
    }

    id: ObjectId;
    sendBy: ObjectId;
    sendTo: ObjectId[];
    subject: string;
    content: string;
    readBy?: ObjectId[]; // ! only for internal use (database) DO NOT SEND TO CLIENT
    staredBy?: ObjectId[]; // ! only for internal use (database) DO NOT SEND TO CLIENT
    stared?: boolean; // send to client
    read?: boolean; // send to client
    user: ObjectId;
    mailCollection: Collection<IMail>;
    timestamp: number;

    private constructor(
        collection: Collection<IMail>,
        mail: WithId<IMail>,
        user: ObjectId,
    ) {
        this.id = mail._id;
        this.sendBy = mail.sendBy;
        this.sendTo = mail.sendTo;
        this.subject = mail.subject;
        this.content = mail.content;
        this.readBy = mail.readBy;
        this.staredBy = mail.staredBy;
        // if user is in readBy array, set read to true
        this.read = this.readBy?.includes(user);
        // if user is in staredBy array, set stared to true
        this.stared = this.staredBy?.includes(user);
        this.user = user;
        this.mailCollection = collection;
        this.timestamp = mail.timestamp;
    }

    async setRead(read: boolean): Promise<MethodResult<boolean>> {
        if (read) {
            if (!this.readBy?.includes(this.user)) {
                this.readBy?.push(this.user);
                const result = await this.mailCollection.updateOne(
                    { _id: this.id },
                    { $set: { readBy: this.readBy } },
                );
                if (result.acknowledged) {
                    read = true;
                    return [true, null];
                } else {
                    return [undefined, DolphinErrorTypes.FAILED];
                }
            }
        } else {
            if (this.readBy?.includes(this.user)) {
                this.readBy = this.readBy.filter((id) => id !== this.user);
                const result = await this.mailCollection.updateOne(
                    { _id: this.id },
                    { $set: { readBy: this.readBy } },
                );
                if (result.acknowledged) {
                    this.read = false;
                    return [true, null];
                } else {
                    return [undefined, DolphinErrorTypes.FAILED];
                }
            }
        }

        return [true, null]; // return true, because it is already set to the value
    }

    async setStared(stared: boolean): Promise<MethodResult<boolean>> {
        if (stared) {
            if (!this.staredBy?.includes(this.user)) {
                this.staredBy?.push(this.user);
                const result = await this.mailCollection.updateOne(
                    { _id: this.id },
                    { $set: { staredBy: this.staredBy } },
                );
                if (result.acknowledged) {
                    this.stared = true;
                    return [true, null];
                } else {
                    return [undefined, DolphinErrorTypes.FAILED];
                }
            }
        } else {
            if (this.staredBy?.includes(this.user)) {
                this.staredBy = this.staredBy.filter((id) => id !== this.user);
                const result = await this.mailCollection.updateOne(
                    { _id: this.id },
                    { $set: { staredBy: this.staredBy } },
                );
                if (result.acknowledged) {
                    this.stared = false;
                    return [true, null];
                } else {
                    return [undefined, DolphinErrorTypes.FAILED];
                }
            }
        }

        return [true, null]; // return true, because it is already set to the value
    }
}

export default Mail;
export { IMail, Postfaecher };
