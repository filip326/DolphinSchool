import MethodResult, { DolphinErrorTypes } from "../MethodResult";
import { Collection, ObjectId, WithId } from "mongodb";
import { IUserMessage } from "./UserMessage";
import Dolphin from "../Dolphin";

interface IMessageAttachement {
    expires: number;
    id: ObjectId;
}

interface IMessage {
    sender: ObjectId;
    attachments?: IMessageAttachement[];
    subject: string;
    content: string;
    receivers: string; // a string with the receivers (names) seperated by a semicolon
    anonymous: boolean;
    edited?: number;
}

class Message implements IMessage {
    static async getMessageById(id: ObjectId): Promise<MethodResult<Message>> {
        const dolphin = Dolphin.instance ?? (await Dolphin.init(useRuntimeConfig()));
        const dbResult = await dolphin.database
            .collection<IMessage>("messages")
            .findOne({ _id: id });
        if (!dbResult) return [undefined, DolphinErrorTypes.NOT_FOUND];
        return [
            new Message(
                dolphin.database.collection<IMessage>("messages"),
                dolphin.database.collection<IUserMessage>("userMessages"),
                dbResult,
            ),
            null,
        ];
    }

    static async createMessage(
        message: Omit<Omit<IMessage, "edited">, "anonymous">,
    ): Promise<MethodResult<Message>> {
        const dolphin = Dolphin.instance ?? (await Dolphin.init(useRuntimeConfig()));
        const messageCollection = dolphin.database.collection<IMessage>("messages");
        const userMessageCollection =
            dolphin.database.collection<IUserMessage>("userMessages");

        const result = await messageCollection.insertOne({
            ...message,
            anonymous: false,
        });
        if (!result.acknowledged) return [undefined, DolphinErrorTypes.FAILED];
        const messageResult = await messageCollection.findOne({ _id: result.insertedId });
        if (!messageResult) return [undefined, DolphinErrorTypes.NOT_FOUND];
        return [
            new Message(messageCollection, userMessageCollection, messageResult),
            null,
        ];
    }

    static async listMessagesBySender(
        sender: ObjectId,
        options: { limit?: number; skip?: number },
    ): Promise<MethodResult<Message[]>> {
        const dolphin = Dolphin.instance ?? (await Dolphin.init(useRuntimeConfig()));
        const messageCollection = dolphin.database.collection<IMessage>("messages");
        const messages = await messageCollection
            .find({ sender }, { limit: options.limit, skip: options.skip })
            .toArray();
        return [
            messages.map(
                (message) =>
                    new Message(
                        messageCollection,
                        dolphin.database.collection<IUserMessage>("userMessages"),
                        message,
                    ),
            ),
            null,
        ];
    }

    _id: ObjectId;
    sender: ObjectId;
    anonymous: boolean;
    attachments?: IMessageAttachement[];
    _subject: string;
    _content: string;
    receivers: string;
    edited?: number;
    private readonly messageCollection: Collection<IMessage>;
    private readonly userMessageCollection: Collection<IUserMessage>;

    private constructor(
        messageCollection: Collection<IMessage>,
        userMessageCollection: Collection<IUserMessage>,
        message: WithId<IMessage>,
    ) {
        this._id = message._id;
        this.sender = message.sender;
        this.attachments = message.attachments;
        this._subject = message.subject;
        this._content = message.content;
        this.anonymous = message.anonymous;
        this.receivers = message.receivers;
        this.messageCollection = messageCollection;
        this.userMessageCollection = userMessageCollection;
        this.edited = message.edited;
    }

    async deleteForAll(): Promise<MethodResult<boolean>> {
        try {
            const deleteResult = await this.messageCollection.deleteOne({
                _id: this._id,
            });
            const deleteAllResult = await this.userMessageCollection.deleteMany({
                message: { $eq: this._id },
            });
            return [deleteAllResult.acknowledged && deleteResult.acknowledged, null];
        } catch {
            return [undefined, DolphinErrorTypes.DATABASE_ERROR];
        }
    }

    async updateContent(newContent: string): Promise<MethodResult<boolean>> {
        this.edited = Date.now();
        this._content = newContent;

        try {
            const updateResult = await this.messageCollection.updateOne(
                { _id: this._id },
                {
                    $set: {
                        content: newContent,
                        edited: this.edited,
                    },
                },
            );
            return [updateResult.acknowledged, null];
        } catch {
            return [undefined, DolphinErrorTypes.DATABASE_ERROR];
        }
    }

    async delete(): Promise<MethodResult<boolean>> {
        try {
            const deleteResult = await this.userMessageCollection.deleteMany({
                message: { $eq: this._id },
            });
            const deleteResult2 = await this.messageCollection.deleteOne({
                _id: this._id,
            });
            return [deleteResult.acknowledged ?? deleteResult2.acknowledged, null];
        } catch {
            return [undefined, DolphinErrorTypes.DATABASE_ERROR];
        }
    }

    get time() {
        return this._id.getTimestamp();
    }

    get subject(): string {
        return this._subject;
    }
    get content(): string {
        return this._content;
    }
}

export default Message;
export { IMessage, IMessageAttachement };
