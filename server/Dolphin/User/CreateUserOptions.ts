import { UserType } from "./UserTypes"

interface CreateUserOptions {

    fullName: string;
    username: string;
    type: UserType;
    password?: string;
    permissions?: number;

}

export default CreateUserOptions
