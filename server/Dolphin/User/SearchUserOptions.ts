import { ObjectId } from "mongodb";

interface ISearchUserOptions {
    nameQuery?: string;
    cources?: string;
    class?: string;
    parent?: ObjectId;
    child?: ObjectId;
    max?: number;
    skip?: number;
}

export default ISearchUserOptions;
