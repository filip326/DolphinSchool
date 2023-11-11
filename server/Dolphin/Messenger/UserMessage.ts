import Dolphin from "../Dolphin";
import MethodResult, { DolphinErrorTypes } from "../MethodResult";
import User from "../User/User";
import Message, { IMessage } from "./Message";
import { Collection, ObjectId, WithId } from "mongodb";

type Postfaecher = "inbox" | "outbox" | "stared";

interface IUserMessage {
    owner: ObjectId;

    subject: string;
    author: ObjectId;
    message: ObjectId;
    read: boolean;
    stared: boolean;
}

interface MessageFilterOptions {
    subject?: string;
    read?: boolean;
    stared?: boolean;
    newsletter?: boolean;
    limit?: number;
    skip?: number;
}

class UserMessage implements IUserMessage {
    /**
     * lists the messages of a user
     * @param user
     * @returns the user messages
     */
    static async listUsersMessages(
        user: User,
        { limit, skip }: { limit?: number; skip?: number } = {},
        {
            read,
            stared,
            newsletter,
        }: { read?: boolean; stared?: boolean; newsletter?: boolean } = {},
    ): Promise<MethodResult<UserMessage[]>> {
        const dolphin = Dolphin.instance ?? (await Dolphin.init(useRuntimeConfig()));
        const conditions = [];
        if (read !== undefined) conditions.push({ read });
        if (stared !== undefined) conditions.push({ stared });
        if (newsletter !== undefined) conditions.push({ newsletter });
        const dbResult = await dolphin.database
            .collection<IUserMessage>("userMessages")
            .find({
                $and: [{ owner: user._id }, ...conditions],
            })
            .sort({
                _id: -1,
            })
            .limit(limit ?? 15)
            .skip(skip ?? 0);
        return [
            (await dbResult.toArray()).map(
                (userMessage) =>
                    new UserMessage(
                        dolphin.database.collection<IMessage>("messages"),
                        dolphin.database.collection<IUserMessage>("userMessages"),
                        userMessage,
                    ),
            ),
            null,
        ];
    }

    static async getUserMessageByAuthor(
        author: User,
        receiver: User,
    ): Promise<MethodResult<UserMessage>> {
        const dolphin = Dolphin.instance ?? (await Dolphin.init(useRuntimeConfig()));
        const dbResult = await dolphin.database
            .collection<IUserMessage>("userMessages")
            .findOne({
                owner: receiver._id,
                author: author._id,
            });
        if (!dbResult) return [undefined, DolphinErrorTypes.NOT_FOUND];
        return [
            new UserMessage(
                dolphin.database.collection<IMessage>("messages"),
                dolphin.database.collection<IUserMessage>("userMessages"),
                dbResult,
            ),
            null,
        ];
    }

    static async getUserMessageById(id: ObjectId): Promise<MethodResult<UserMessage>> {
        const dolphin = Dolphin.instance ?? (await Dolphin.init(useRuntimeConfig()));
        const dbResult = await dolphin.database
            .collection<IUserMessage>("userMessages")
            .findOne({ _id: id });
        if (!dbResult) return [undefined, DolphinErrorTypes.NOT_FOUND];
        return [
            new UserMessage(
                dolphin.database.collection<IMessage>("messages"),
                dolphin.database.collection<IUserMessage>("userMessages"),
                dbResult,
            ),
            null,
        ];
    }

    static async getMessages(
        user: User,
        filter: MessageFilterOptions,
    ): Promise<MethodResult<IUserMessage[]>> {
        const dolphin = Dolphin.instance ?? (await Dolphin.init(useRuntimeConfig()));

        const userMessageCollection =
            dolphin.database.collection<IUserMessage>("userMessages");
        const messageCollection = dolphin.database.collection<IMessage>("messages");

        if (!user) {
            return [undefined, DolphinErrorTypes.NOT_AUTHENTICATED];
        }

        const dbResult = await userMessageCollection
            .find(
                {
                    owner: user._id,
                    stared: filter.stared,
                    read: filter.read,
                },
                { limit: filter.limit, skip: filter.skip },
            )
            .sort({
                _id: -1,
            })
            .toArray();

        if (!dbResult) {
            return [undefined, DolphinErrorTypes.NOT_FOUND];
        }

        return [
            dbResult.map(
                (msg) => new UserMessage(messageCollection, userMessageCollection, msg),
            ),
            null,
        ];
    }

    static async getUserMessagesByMessageId(
        id: ObjectId,
        owner?: ObjectId,
    ): Promise<MethodResult<UserMessage[]>> {
        const dolphin = Dolphin.instance ?? (await Dolphin.init(useRuntimeConfig()));
        const dbResult = await dolphin.database
            .collection<IUserMessage>("userMessages")
            .find(!owner ? { message: id } : { message: id, owner: owner });
        return [
            (await dbResult.toArray()).map(
                (v) =>
                    new UserMessage(
                        dolphin.database.collection<IMessage>("messages"),
                        dolphin.database.collection<IUserMessage>("userMessages"),
                        v,
                    ),
            ),
            null,
        ];
    }

    /**
     * sends a message to a user
     * @param receiver
     * @param message
     * @param newsletter
     * @return true if the message was sent successfully
     */
    static async sendMessage(
        receiver: ObjectId,
        message: Message,
    ): Promise<MethodResult<boolean>> {
        const dolphin = Dolphin.instance ?? (await Dolphin.init(useRuntimeConfig()));

        const userMessage: IUserMessage = {
            owner: receiver,
            subject: message.subject,
            author: message.sender,
            message: message._id,
            read: false,
            stared: false,
        };

        const dbResult = await dolphin.database
            .collection<IUserMessage>("userMessages")
            .insertOne(userMessage);
        if (!dbResult.acknowledged) {
            return [undefined, DolphinErrorTypes.DATABASE_ERROR];
        }

        return [true, null];
    }

    readonly _id: ObjectId;

    owner: ObjectId;
    author: ObjectId;

    subject: string;
    message: ObjectId;
    read: boolean;
    stared: boolean;

    private readonly messageCollection: Collection<IMessage>;
    private readonly userMessageCollection: Collection<IUserMessage>;

    private constructor(
        messageCollection: Collection<IMessage>,
        userMessageCollection: Collection<IUserMessage>,
        userMessage: WithId<IUserMessage>,
    ) {
        this._id = userMessage._id;
        this.owner = userMessage.owner;
        this.author = userMessage.author;
        this.subject = userMessage.subject;
        this.message = userMessage.message;
        this.read = userMessage.read;
        this.stared = userMessage.stared;
        this.messageCollection = messageCollection;
        this.userMessageCollection = userMessageCollection;
    }

    async getMessage(): Promise<MethodResult<Message>> {
        return Message.getMessageById(this.message);
    }

    async star(stared = true): Promise<MethodResult<boolean>> {
        try {
            const dbResult = await this.userMessageCollection.updateOne(
                {
                    _id: this._id,
                },
                {
                    $set: {
                        stared,
                    },
                },
            );
            if (!dbResult.acknowledged) {
                return [undefined, DolphinErrorTypes.DATABASE_ERROR];
            }
            return [true, null];
        } catch (err) {
            return [undefined, DolphinErrorTypes.FAILED];
        }
    }

    unstar() {
        return this.star(false);
    }

    async markAsRead(read = true): Promise<MethodResult<boolean>> {
        this.read = read;
        try {
            if (this.message && this.messageCollection) {
                const dbResult = await this.messageCollection.updateOne(
                    { _id: this._id },
                    { $set: { read: read } },
                );
                if (!dbResult.acknowledged) {
                    return [undefined, DolphinErrorTypes.DATABASE_ERROR];
                }
            }
            return [true, null];
        } catch (err) {
            return [undefined, DolphinErrorTypes.FAILED];
        }
    }

    async delete(): Promise<MethodResult<boolean>> {
        // get the message id
        const messageId = this.message;

        // delete the user message
        const dbResult = await this.userMessageCollection.deleteOne({
            _id: this._id,
        });

        // if the user message was deleted successfully
        if (dbResult.acknowledged) {
            // delete the message, if it was the last user message referencing it

            const dbResult2 = await this.userMessageCollection.countDocuments({
                message: messageId,
            });
            if (dbResult2 === 0) {
                const dbResult3 = await this.messageCollection.deleteOne({
                    _id: messageId,
                });
                // if the message was deleted successfully
                if (dbResult3.acknowledged) {
                    return [true, null];
                }
            }
            return [true, null];
        }

        return [undefined, DolphinErrorTypes.DATABASE_ERROR];
    }

    get time() {
        return this._id.getTimestamp();
    }
}

export default UserMessage;
export { IUserMessage, Postfaecher };
