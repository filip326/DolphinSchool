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
    receivers: ObjectId[];
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

    id: ObjectId;
    sender: ObjectId;
    anonymous: boolean;
    attachments?: IMessageAttachement[];
    _subject: string;
    _content: string;
    receivers: ObjectId[];
    edited?: number;
    private readonly messageCollection: Collection<IMessage>;
    private readonly userMessageCollection: Collection<IUserMessage>;

    private constructor(
        messageCollection: Collection<IMessage>,
        userMessageCollection: Collection<IUserMessage>,
        message: WithId<IMessage>,
    ) {
        this.id = message._id;
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
                _id: this.id,
            });
            const deleteAllResult = await this.userMessageCollection.deleteMany({
                message: { $eq: this.id },
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
                { _id: this.id },
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

    get time() {
        return this.id.getTimestamp();
    }

    get subject(): string {
        return "not implemented";
    }
    get content(): string {
        return "not implemented";
    }
}

export default Message;
export { IMessage, IMessageAttachement };
