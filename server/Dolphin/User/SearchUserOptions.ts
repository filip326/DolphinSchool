import { ObjectId } from "mongodb";

interface SearchUserOptions {
    nameQuery?: string
    cources?: string
    class?: string
    parent?: ObjectId
    child?: ObjectId
    max?: number
    skip?: number
}

export default SearchUserOptions;
