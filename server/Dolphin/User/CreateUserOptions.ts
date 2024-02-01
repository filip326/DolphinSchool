import { UserType } from "./UserTypes";

interface CreateUserOptions {
    fullName: string;
    username: string;
    type: UserType;
    password?: string;
    permissions?: number;
    gebDate: string;
}

export default CreateUserOptions;
