import User from "../../User/User";
import ITemplate from "./ITemplate";

class VerificationCodeEmail implements ITemplate {
    usersFullName: string;
    verificationCode: string;
    unsubscribeCode: string;

    constructor(user: User, verificationCode: string, unsubscribeCode: string) {
        this.usersFullName = user.fullName;
        this.verificationCode = verificationCode;
        this.unsubscribeCode = unsubscribeCode;
    }

    get subject(): string {
        return "Dein DolphinSchool Verifizierungscode";
    }

    toHtml(): string {
        return "";
    }

    toText(): string {
        return "";
    }
}

export default VerificationCodeEmail;
