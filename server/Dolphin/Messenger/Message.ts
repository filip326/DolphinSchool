import MethodResult from "../MethodResult";
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
    id: ObjectId;
    sender: ObjectId;
    anonymous: boolean;
    attachments?: IMessageAttachement[];
    subject: string;
    content: string;
    receivers: ObjectId[];
    edited?: number;
    private readonly messageCollection: Collection<IMessage>;
    private readonly userMessageCollection: Collection<IUserMessage>;

    private constructor(
        messageCollection: Collection<IMessage>,
        userMessageCollection: Collection<IUserMessage>,
        message: WithId<IMessage>
    ) {
        this.id = message._id;
        this.sender = message.sender;
        this.attachments = message.attachments;
        this.subject = message.subject;
        this.content = message.content;
        this.anonymous = message.anonymous;
        this.receivers = message.receivers;
        this.messageCollection = messageCollection;
        this.userMessageCollection = userMessageCollection;
        this.edited = message.edited;
    }

    static async getMessageById(id: ObjectId): Promise<MethodResult<Message>> {
        const dolphin = Dolphin.instance;
        if (!dolphin || ! dolphin.database) {
             return [ undefined, Error("Dolphin is not initialized.")]
        }
        const db = dolphin.database;
        const collection = db.collection<IMessage>("messages");
        const message = await collection.findOne({ _id: id });
        if (!message)
            return [ undefined, Error("Message not found.")];
        return [ new Message(collection, db.collection<IUserMessage>("userMessages"), message), null ];
    }

    async deleteForAll(): Promise<MethodResult<boolean>> {
        try {
            const deleteResult = await this.messageCollection.deleteOne({
                _id: this.id
            });
            const deleteAllResult = await this.userMessageCollection.deleteMany({
                message: { $eq: this.id }
            });
            return [deleteAllResult.acknowledged && deleteResult.acknowledged, null];
        } catch {
            return [undefined, new Error("DB error")];
        }
    }

    async updateContent(newContent: string): Promise<MethodResult<boolean>> {
        this.edited = Date.now();
        this.content = newContent;

        try {
            const updateResult = await this.messageCollection.updateOne(
                { _id: this.id },
                {
                    $set: {
                        content: newContent,
                        edited: this.edited
                    }
                }
            );
            return [updateResult.acknowledged, null];
        } catch {
            return [undefined, new Error("DB error")];
        }
    }

    get time() {
        return this.id.getTimestamp();
    }
}

export default Message;
export { IMessage, IMessageAttachement };
