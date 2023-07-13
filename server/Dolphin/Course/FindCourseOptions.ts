import { ObjectId } from "mongodb";

interface Options {
    id?: ObjectId;
    name?: string;
}

type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> & U[keyof U];

type FindCourseOptions = AtLeastOne<Options>

export default FindCourseOptions;
