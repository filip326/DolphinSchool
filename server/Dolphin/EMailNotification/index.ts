import { ObjectId, WithId } from "mongodb";
import {
    createTestAccount,
    createTransport,
    SendMailOptions,
    SentMessageInfo,
    Transporter,
} from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import MethodResult, { DolphinErrorTypes } from "../MethodResult";
import Dolphin from "../Dolphin";

const transporterOptions = {
    host: "smtp.ethereal.email",
    port: 587,
    auth: {
        user: "vivienne.champlin@ethereal.email",
        pass: "e6KfMWqsfSbWx3qkah",
    },
};

const transporter = createTransport(transporterOptions);

const mail: SendMailOptions = {
    from: "vivienne.champlin@ethereal.email",
    to: "vivienne.champlin@ethereal.email",
    subject: "Hello",
    text: "Hello world?",
    html: "<b>Hello world?</b>",
};

transporter.sendMail(mail).then((info: SentMessageInfo) => {
    console.log(info);
});

interface IEMailNotification {
    owner: ObjectId; // the owener of the notification subscription
    email: string; // the email address to send the notification to
    verified: boolean; // whether the email address has been verified
    verificationCode: string; // the verification code sent to the email address
    unsubscribeCode: string; // the code to unsubscribe from the notification ://domain/notifications/unsubscribe?code=code
    // used so users can unsubscribe from notifications easily
}

class EmailNotification implements WithId<IEMailNotification> {
    private static runningOnDevAccount: boolean = false;
    private static ready: boolean = false;
    private static tranportOptions?: SMTPTransport.Options;
    private static transporter?: Transporter<SMTPTransport.SentMessageInfo>;

    static async initService() {
        if (
            !process.env.HOST ||
            typeof process.env.HOST !== "string" ||
            !process.env.PORT ||
            typeof process.env.PORT !== "string" ||
            !process.env.USER ||
            typeof process.env.USER !== "string" ||
            isNaN(parseInt(process.env.PORT)) ||
            !process.env.PASS ||
            typeof process.env.PASS !== "string"
        ) {
            // use a test account
            console.warn("Using test account! Do NOT use in production!");
            EmailNotification.runningOnDevAccount = true;
            const testAccount = await createTestAccount();
            EmailNotification.tranportOptions = {
                host: testAccount.smtp.host,
                port: testAccount.smtp.port,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            };
        } else {
            EmailNotification.tranportOptions = {
                host: process.env.HOST,
                port: parseInt(process.env.PORT),
                auth: {
                    user: process.env.USER,
                    pass: process.env.PASS,
                },
            };
        }

        EmailNotification.transporter = createTransport(
            EmailNotification.tranportOptions,
        );
        EmailNotification.ready = true;
    }

    _id: ObjectId;
    owner: ObjectId;
    email: string;
    verified: boolean = false;
    verificationCode: string;
    unsubscribeCode: string = "";

    private constructor(data: WithId<IEMailNotification>) {
        this._id = data._id;
        this.owner = data.owner;
        this.email = data.email;
        this.unsubscribeCode = data.verificationCode;
        this.verified = data.verified;
        this.verificationCode = data.unsubscribeCode;
    }

    static async subscribe(user: ObjectId, email: string) {
        if (!EmailNotification.ready) {
            await EmailNotification.initService();
        }

        // check if the user is already subscribed
        // if so, overwrite the last email
        const [ existing ] = await EmailNotification.getByUser(user);
        if (existing) {

        }
    }

    static async getByUser(owner: ObjectId): Promise<MethodResult<EmailNotification>> {
        if (!EmailNotification.ready) {
            await EmailNotification.initService();
        }
        const dolphin = Dolphin.instance || (await Dolphin.init(useRuntimeConfig()));
        const collection =
            dolphin.database.collection<IEMailNotification>("email_notifications");

        const result = await collection.findOne({ owner });
        if (!result) {
            return [undefined, DolphinErrorTypes.NOT_FOUND];
        }
        return [new EmailNotification(result), null];
    }

    async sendMail(
        mail: SendMailOptions,
        ignoreVerification: boolean = false,
    ): Promise<MethodResult<boolean>> {
        if (!EmailNotification.ready) {
            await EmailNotification.initService();
        }
        if (!EmailNotification.transporter) {
            return [undefined, DolphinErrorTypes.FAILED];
        }
        if (!ignoreVerification && !this.verified) {
            return [undefined, DolphinErrorTypes.FAILED];
        }
        try {
            const result = await EmailNotification.transporter.sendMail(mail);
            return [true, null];
        } catch (err) {
            return [undefined, DolphinErrorTypes.FAILED];
        }
    }

    async changeEmail(email: string) {
        if (!EmailNotification.ready) {
            await EmailNotification.initService();
        }
        if (!EmailNotification.transporter) {
            return [undefined, DolphinErrorTypes.FAILED];
        }

        // check email against regex
        if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            return [undefined, DolphinErrorTypes.INVALID_ARGUMENT];
        }

        // check if the email is already in use
        if (email === this.email) {
            return [undefined, DolphinErrorTypes.ALREADY_EXISTS];
        }

        // now 
    }
}

export default EmailNotification;
export { IEMailNotification };

