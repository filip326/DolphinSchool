import { createTransport, SendMailOptions, SentMessageInfo } from "nodemailer";

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
