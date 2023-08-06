function genPassword(length: number): string {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxy";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+";

    const all = letters + numbers + symbols;

    let password = "";
    for (let i = 0; i < length; i++) {
        password += all.charAt(Math.floor(Math.random() * all.length));
    }
    return password;
}

export default genPassword;
