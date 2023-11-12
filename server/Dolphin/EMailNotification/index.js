// ! this is just a test file to test, if nodemailer works

const { createTransport } = require("nodemailer");

const transporterOptions = {
    host: "smtp.ethereal.email",
    port: 587,
    auth: {
        user: "vivienne.champlin@ethereal.email",
        pass: "e6KfMWqsfSbWx3qkah",
    },
};

const transporter = createTransport(transporterOptions);

const mail = {
    from: "vivienne.champlin@ethereal.email",
    to: "vivienne.champlin@ethereal.email",
    subject: "Hello",
    text: "Hello world?",
    html: "<b>Hello world?</b>",
};

transporter.sendMail(mail).then((info) => {
    console.log(info);
});
