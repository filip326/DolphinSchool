import User from "../Dolphin/User/User";

export default interface Auth {
    authenticated: boolean;
    user?: User;
}
