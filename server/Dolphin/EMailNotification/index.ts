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
import { randomBytes } from "crypto";
import VerificationCodeEmail from "./templates/VerificationCodeEmail";
import User from "../User/User";

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
    // used so users can unsubscribe from notifications

    verificationAttempts: number; // the number of times the user has tried to verify the email address
    // after 3 attempts, the code is reset and a new one is generated
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
            console.info("Test account credentials: ");
            console.table([{ user: testAccount.user, pass: testAccount.pass }]);
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
    verificationAttempts: number = 0;

    private constructor(data: WithId<IEMailNotification>) {
        this._id = data._id;
        this.owner = data.owner;
        this.email = data.email;
        this.verified = data.verified;
        this.unsubscribeCode = data.unsubscribeCode;
        this.verificationCode = data.verificationCode;
        this.verificationAttempts = data.verificationAttempts;
    }

    static async subscribe(
        user: ObjectId,
        email: string,
    ): Promise<MethodResult<EmailNotification>> {
        if (!EmailNotification.ready) {
            await EmailNotification.initService();
        }

        // check if the user is already subscribed
        // if so, overwrite the last email
        const [existing] = await EmailNotification.getByUser(user);
        if (existing) {
            return existing.changeEmail(email);
        }

        // check email against regex
        if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            return [undefined, DolphinErrorTypes.INVALID_ARGUMENT];
        }

        // generate verification code
        const verificationCode = EmailNotification.generateVerificationCode(6);
        const unsubscribeCode = EmailNotification.generateVerificationCode(25);
        const dolphin = Dolphin.instance || (await Dolphin.init(useRuntimeConfig()));
        const collection =
            dolphin.database.collection<IEMailNotification>("email_notifications");
        const result = await collection.insertOne({
            owner: user,
            email,
            verified: false,
            verificationCode,
            unsubscribeCode,
            verificationAttempts: 0,
        });
        if (!result.insertedId) {
            return [undefined, DolphinErrorTypes.FAILED];
        }

        const [userObj, err] = await User.getUserById(user);
        if (err) {
            return [undefined, err];
        }
        const verificationCodeEmail = new VerificationCodeEmail(
            userObj,
            verificationCode,
            unsubscribeCode,
        );

        const emailNotificationService = new EmailNotification({
            _id: result.insertedId,
            owner: user,
            email,
            verified: false,
            verificationCode,
            unsubscribeCode,
            verificationAttempts: 0,
        });

        emailNotificationService.sendMail(
            {
                subject: "Verifiziere deine E-Mail Adresse",
                text: verificationCodeEmail.toText(),
                html: verificationCodeEmail.toHtml(),
            },
            true,
        );

        return [emailNotificationService, null];
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

    static async unsubscribe(code: string): Promise<MethodResult<boolean>> {
        const dolphin = Dolphin.instance || (await Dolphin.init(useRuntimeConfig()));
        const collection =
            dolphin.database.collection<IEMailNotification>("email_notifications");

        const result = await collection.deleteOne({ unsubscribeCode: code });
        if (result.deletedCount === 0) {
            return [undefined, DolphinErrorTypes.NOT_FOUND];
        }
        return [true, null];
    }

    async sendMail(
        mail: Omit<SendMailOptions, "to">,
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
            console.log("Sending mail to " + this.email);
            console.log(mail);
            const data = await EmailNotification.transporter.sendMail({
                text: mail.text,
                html: mail.html,
                subject: mail.subject,
                to: this.email,
            });
            console.log("send mail", data.response);
            console.log(data);
            return [true, null];
        } catch (err) {
            console.log("Failed to send mail to " + this.email);
            return [undefined, DolphinErrorTypes.FAILED];
        }
    }

    async changeEmail(email: string): Promise<MethodResult<EmailNotification>> {
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

        // now we can change the email
        // it is important to change the verification status to false
        // also, we need to generate a new verification code
        const verificationCode = EmailNotification.generateVerificationCode(6);
        const unsubscribeCode = EmailNotification.generateVerificationCode(25);
        const dolphin = Dolphin.instance || (await Dolphin.init(useRuntimeConfig()));
        const collection =
            dolphin.database.collection<IEMailNotification>("email_notifications");
        const result = await collection.findOneAndUpdate(
            { _id: this._id },
            {
                $set: {
                    email,
                    verified: false,
                    verificationCode,
                    unsubscribeCode,
                },
            },
        );
        if (!result.value) {
            return [undefined, DolphinErrorTypes.FAILED];
        }
        this.email = email;
        this.verified = false;
        this.verificationCode = verificationCode;
        this.unsubscribeCode = unsubscribeCode;

        const [userObj, err] = await User.getUserById(this.owner);
        if (err) {
            return [undefined, err];
        }
        const verificationCodeEmail = new VerificationCodeEmail(
            userObj,
            verificationCode,
            unsubscribeCode,
        );

        this.sendMail(
            {
                subject: "Verifiziere deine E-Mail Adresse",
                text: verificationCodeEmail.toText(),
                html: verificationCodeEmail.toHtml(),
            },
            true,
        );

        return [this, null];
    }

    async verifiy(code: string): Promise<MethodResult<boolean>> {
        const dolphin = Dolphin.instance || (await Dolphin.init(useRuntimeConfig()));
        const collection =
            dolphin.database.collection<IEMailNotification>("email_notifications");
        if (code === this.verificationCode) {
            // code is correct
            const result = await collection.findOneAndUpdate(
                { _id: this._id },
                {
                    $set: {
                        verified: true,
                    },
                },
            );
            if (!result.value) {
                return [undefined, DolphinErrorTypes.FAILED];
            }
            this.verified = true;
            return [true, null];
        }
        // code is incorrect
        // increment the number of verification attempts
        const result = await collection.findOneAndUpdate(
            { _id: this._id },
            {
                $inc: {
                    verificationAttempts: 1,
                },
            },
        );
        if (!result.value) {
            return [undefined, DolphinErrorTypes.FAILED];
        }
        this.verificationAttempts++;
        if (this.verificationAttempts >= 3) {
            // reset the verification code
            const verificationCode = EmailNotification.generateVerificationCode(6);
            const result = await collection.findOneAndUpdate(
                { _id: this._id },
                {
                    $set: {
                        verificationCode,
                        verificationAttempts: 0,
                    },
                },
            );
            if (!result.value) {
                return [undefined, DolphinErrorTypes.FAILED];
            }
            this.verificationCode = verificationCode;
            this.verificationAttempts = 0;
            // TODO: send new verification email
            const [userObj, err] = await User.getUserById(this.owner);
            if (err) {
                return [undefined, err];
            }
            const verificationCodeEmail = new VerificationCodeEmail(
                userObj,
                verificationCode,
                this.unsubscribeCode,
            );

            this.sendMail(
                {
                    subject: "Verifiziere deine E-Mail Adresse",
                    text: verificationCodeEmail.toText(),
                    html: verificationCodeEmail.toHtml(),
                },
                true,
            );
        }

        return [false, null];
    }

    async unsubscribe(): Promise<MethodResult<boolean>> {
        const dolphin = Dolphin.instance || (await Dolphin.init(useRuntimeConfig()));
        const collection =
            dolphin.database.collection<IEMailNotification>("email_notifications");
        // TODO: send email to confirm unsubscribe
        const result = await collection.deleteOne({ _id: this._id });
        if (result.deletedCount === 0) {
            return [undefined, DolphinErrorTypes.NOT_FOUND];
        }
        return [true, null];
    }

    private static generateVerificationCode(length: number = 6): string {
        // cryptographically secure random string
        // code should be 6 characters long and be hexadecimal
        // one hexadecimal character is 4 bits
        // 6 * 4 = 24 bits
        // 24 bits / 8 bits = 3 bytes
        const lengthInBits = length * 4;
        const lengthInBytes = lengthInBits / 8;
        const randomCodeBytes = randomBytes(Math.ceil(lengthInBytes));
        // convert to decimal string
        const randomCodeString = randomCodeBytes.toString("hex").toUpperCase();
        return randomCodeString;
    }
}

EmailNotification.initService();

export default EmailNotification;
export { IEMailNotification };
