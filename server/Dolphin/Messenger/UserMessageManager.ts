import { Collection, ObjectId, WithId } from "mongodb";
import UserMessage, { IUserMessage } from "./UserMessage";
import MethodResult from "../MethodResult";
import Message, { IMessage, IMessageAttachement } from "./Message";

interface IUserMessageManager {
    userId: ObjectId;
}

interface MessageFilterOptions {
    read?: boolean;
    stared?: boolean;
    newsletter?: boolean;
    limit?: number;
    skip?: number;
}

class UserMessageManager implements IUserMessageManager {

    id: ObjectId;
    userId: ObjectId;

    private readonly userMessageCollection: Collection<IUserMessage>;
    private readonly messageCollection: Collection<IMessage>;

    constructor(messageCollection: Collection<IMessage>, userMessageCollection: Collection<IUserMessage>, messageManager: WithId<IUserMessageManager>) {
        this.id = messageManager._id;
        this.userId = messageManager.userId;
        this.messageCollection = messageCollection;
        this.userMessageCollection = userMessageCollection;
    }

    async getUserMessage(messageId: ObjectId): Promise<MethodResult<UserMessage>> {
        const dbResult = await this.userMessageCollection.findOne({ _id: messageId });
        if (!dbResult) {
            return [undefined, new Error("Message not found")];
        }
        return [new UserMessage(this.messageCollection, this.userMessageCollection, dbResult), null];
    }

    async getMessages(filter: MessageFilterOptions): Promise<MethodResult<IUserMessage[]>> {

        if (!this.userId) {
            return [undefined, new Error("User not logged in")];
        }

        const dbResult = await this.userMessageCollection.find({
            owner: this.userId,
            stared: filter.stared,
            read: filter.read,
            newsletter: filter.newsletter
        }, { limit: filter.limit, skip: filter.skip }).toArray();

        if (!dbResult) {
            return [undefined, new Error("No messages found")];
        }

        return [dbResult, null];
    }

    async deleteMessage(messageId: ObjectId, forAll: boolean): Promise<MethodResult<boolean>> {
        // get the message
        const userMessageResult = await this.getUserMessage(messageId);
        if (userMessageResult[1]) {
            return userMessageResult;
        }
        if (!userMessageResult[0]) {
            return [undefined, new Error("Message not found")];
        }
        const userMessage = userMessageResult[0];

        const messageResult = await userMessage.getMessage();
        if (messageResult[1]) {
            return messageResult;
        }
        if (!messageResult[0]) {
            return [undefined, new Error("Message not found")];
        }
        const message = messageResult[0];

        if (message.sender.equals(this.userId) && forAll) {
            return message.deleteForAll();
        }

        const dbResult = await this.userMessageCollection.deleteOne({ owner: this.userId, message: messageId });

        if (!dbResult.acknowledged) {
            return [undefined, new Error("DB error")];
        }

        // check if there still is a UserMessage pointing to this message
        const dbResult2 = await this.userMessageCollection.findOne({ message: messageId });

        // if so, delete also the message itself
        if (!dbResult2) {
            const dbResult3 = await this.messageCollection.deleteOne({ _id: messageId });
            if (!dbResult3.acknowledged) {
                return [undefined, new Error("DB error")];
            }
        }

        return [true, null];
    }

    /**
     * Use to send a message, where the owner of this instance is the sender
     */
    async sendMessage(message: SendMessageOptions): Promise<MethodResult<IMessage>> {

        const dbResult = await this.messageCollection.insertOne({
            sender: this.userId,
            receivers: message.receivers,
            content: message.content,
            anonymous: message.anonymous ?? false,
            attachments: message.attachments
        });

        if (!dbResult.acknowledged) {
            return [undefined, new Error("DB error")];
        }

        const messageId = dbResult.insertedId;

        const dbResult2 = await this.userMessageCollection.insertMany(message.receivers.map(receiver => ({
            owner: receiver,
            author: this.userId,
            message: messageId,
            read: false,
            stared: false,
            newsletter: message.newsletter ?? false
        })));

        if (!dbResult2.acknowledged) {
            return [undefined, new Error("DB error")];
        }

        return [new Message(this.messageCollection, this.userMessageCollection, {
            _id: messageId,
            sender: this.userId,
            receivers: message.receivers,
            content: message.content,
            anonymous: message.anonymous ?? false,
            attachments: message.attachments
        }), null];

    }
}

interface SendMessageOptions {

    receivers: ObjectId[];
    content: string;
    anonymous?: boolean;

    attachments?: IMessageAttachement[];

    newsletter?: boolean;

}

export default UserMessageManager;
export { IUserMessageManager };
