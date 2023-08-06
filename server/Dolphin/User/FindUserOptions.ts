import { ObjectId } from "mongodb";

interface Options {
    id?: ObjectId;
    username?: string;
    fullName?: string;
}

type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> & U[keyof U];

type FindUserOptions = AtLeastOne<Options>;

export default FindUserOptions;
