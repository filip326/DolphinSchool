import { Collection, WithId } from "mongodb";
import User, { IUser } from "../User";

interface ITeacher extends IUser {
}

class Teacher extends User implements ITeacher{
    constructor(collection: Collection<IUser>, user: WithId<ITeacher>) {
        super(collection, user);
    }
}

export default Teacher;
export { ITeacher };
