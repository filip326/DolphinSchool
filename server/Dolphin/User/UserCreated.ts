import { IUser } from "./User";

interface UserCreated extends IUser {
    clearPassword: string;
}

export default UserCreated;
