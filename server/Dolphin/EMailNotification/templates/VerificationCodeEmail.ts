import User from "../../User/User";
import { surroundHtml, surroundText } from "./HeaderFooter";
import ITemplate from "./ITemplate";

class VerificationCodeEmail implements ITemplate {
    userFullName: string;
    verificationCode: string;
    unsubscribeCode: string;

    constructor(user: User, verificationCode: string, unsubscribeCode: string) {
        this.userFullName = user.fullName;
        this.verificationCode = verificationCode;
        this.unsubscribeCode = unsubscribeCode;
    }

    get subject(): string {
        return "Dein DolphinSchool Verifizierungscode";
    }

    toHtml(): string {
        const content = `Hallo ${this.userFullName},<br>
Dein Verifizierungscode für deine E-Mail-Adresse in DolphinSchool lautet: <b>${this.verificationCode}</b>.<br>
Bitte gib diesen Code in DolphinSchool ein, um deine E-Mail-Adresse zu verifizieren.<br>
Beachte, dass DolphinSchool dir <u>nie</u> eine E-Mail mit der Aufforderung, einen Link anzuklicken, schicken wird. Falls du eine solche E-Mail erhalten hast, melde dich bitte umgehend bei uns. Es handelt sich sehr wahrscheinlich um einen Phishing-Versuch.<br>`;
        return surroundHtml(content, this.unsubscribeCode);
    }

    toText(): string {
        const content = `Hallo ${this.userFullName},
Dein Verifizierungscode für deine E-Mail-Adresse in DolphinSchool lautet: ${this.verificationCode}.
Bitte gib diesen Code in DolphinSchool ein, um deine E-Mail-Adresse zu verifizieren.
Beachte, dass DolphinSchool dir nie eine E-Mail mit der Aufforderung, einen Link anzuklicken, schicken wird. Falls du eine solche E-Mail erhalten hast, melde dich bitte umgehend bei uns. Es handelt sich sehr wahrscheinlich um einen Phishing-Versuch.`;
        return surroundText(content, this.unsubscribeCode);
    }
}

export default VerificationCodeEmail;
