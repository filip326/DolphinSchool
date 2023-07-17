import MethodResult from "../MethodResult";
import Message, { IMessage } from "./Message";
import { Collection, ObjectId, WithId } from "mongodb";


interface IUserMessage {

    owner: ObjectId;

    subject: string;
    author: ObjectId;
    message: ObjectId;
    read: boolean;
    stared: boolean;
    newsletter: boolean;

}

class UserMessage implements IUserMessage {

    owner: ObjectId;
    author: ObjectId;

    subject: string;
    message: ObjectId;
    read: boolean;
    stared: boolean;
    newsletter: boolean;
    
    private readonly messageCollection: Collection<IMessage>;
    private readonly userMessageCollection: Collection<IUserMessage>;

    constructor(messageCollection: Collection<IMessage>, userMessageCollection: Collection<IUserMessage>, userMessage: WithId<IUserMessage>) {
        this.owner = userMessage.owner;
        this.author = userMessage.author;
        this.subject = userMessage.subject;
        this.message = userMessage.message;
        this.read = userMessage.read;
        this.stared = userMessage.stared;
        this.newsletter = userMessage.newsletter;
        this.messageCollection = messageCollection;
        this.userMessageCollection = userMessageCollection;
    }

    async getMessage(): Promise<MethodResult<Message>> {
        const dbResult = await this.messageCollection.findOne({ _id: this.message });
        if (!dbResult) {
            return [ undefined, new Error("Message not found") ];
        }
        return [ new Message(this.messageCollection, this.userMessageCollection, dbResult), null ];
    }

    async star(stared = true): Promise<MethodResult<boolean>> {
        this.stared = stared;
        try {
            const dbResult = await this.messageCollection.updateOne({ _id: this.message }, { $set: { stared } });
            if (!dbResult.acknowledged) {
                return [ undefined, new Error("DB error") ];
            }
            return [ true, null ];
        } catch (err) {
            return [ undefined, new Error(JSON.stringify(err)) ];
        }
    }

    unstar() {
        return this.star(false);
    }

    async markAsRead(read = true): Promise<MethodResult<boolean>> {
        this.read = read;
        try {
            if (this.message && this.messageCollection) {
                const dbResult = await this.messageCollection.updateOne({ _id: this.message }, { $set: { read } });
                if (!dbResult.acknowledged) {
                    return [ undefined, new Error("DB error") ];
                }
            }
            return [ true, null ];
        } catch (err) {
            return [ undefined, new Error("DB error") ];
        }
    }

}

export default UserMessage;
export { IUserMessage };
