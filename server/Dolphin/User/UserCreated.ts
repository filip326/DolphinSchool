import { IUser } from "./User";

interface IUserCreated extends IUser {
    clearPassword: string;
}

export default IUserCreated;
