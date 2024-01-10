import { ObjectId } from "mongodb";

interface IOptions {
    id?: ObjectId;
    username?: string;
    fullName?: string;
}

type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> & U[keyof U];

type FindUserOptions = AtLeastOne<IOptions>;

export default FindUserOptions;
