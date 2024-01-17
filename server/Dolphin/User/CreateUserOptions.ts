import { UserType } from "./UserTypes";

interface ICreateUserOptions {
    fullName: string;
    username: string;
    type: UserType;
    password?: string;
    permissions?: number;
}

export default ICreateUserOptions;
