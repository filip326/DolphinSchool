import { ObjectId, WithId } from "mongodb";
import MethodResult, { DolphinErrorTypes } from "../MethodResult";
import Dolphin from "../Dolphin";

/**
 * The permissions for a wiki space.
 * Each permission includes all permissions below it; e.g. EDIT_PAGES includes CREATE_PAGES and READ.
 */
enum WikiSpacePermissions {
    NONE = 0, // no permissions
    READ = 1, // can see the space and its pages; if comments are enabled, can also read and write comments
    CREATE_PAGES = 2, // can create new pages and edit or delete its own pages
    EDIT_PAGES = 3, // can edit other owners' pages
    DELETE_PAGES = 4, // can delete other owners' pages
    ADD_READERS = 5, // can add readers to the space
    ADD_EDITORS = 6, // can add editors to the space
    ADMIN = 7, // every permission
    OWNER = 8, // can do everything, including deleting the space. His permissions cannot be changes, unless he gives ownership to someone else
}

interface IWikiSpace {
    name: string; // the name of the space. May contain spaces, letters (upper and lower case), numbers, but no special characters
    url: string;
    // the name of the space (spaces replaced with dashes, all lower case) + the suffix of the space name, a random string of 6 characters,
    // used to identify the space in the URL a wiki space named "test",
    // its url would be /wiki/test-51a2b3, to avoid conflicts with other spaces named "test",
    // if the name changes, the url stays the same
    description?: string;

    tags?: string[]; // tags for the space added by admins or the system itself. e.g. "DOCS" for system documentation or "CLASS" for spaces created for single classes

    permissions: {
        [key: string]: WikiSpacePermissions;
    };
}

type CreateSpaceOptions = {
    name: string;
    description?: string;
    owner: ObjectId;
};

class WikiSpace implements WithId<IWikiSpace> {
    static async create(wikiSpace: CreateSpaceOptions): Promise<MethodResult<WikiSpace>> {
        const dolphin = Dolphin.instance ?? (await Dolphin.init(useRuntimeConfig()));
        const collection = dolphin.database.collection<IWikiSpace>("wiki.spaces");

        wikiSpace.name = wikiSpace.name.trim().replace(/[^A-Za-z0-9 ]/g, "");

        if (wikiSpace.name.length < 7 || wikiSpace.name.length > 32) {
            return [undefined, DolphinErrorTypes.INVALID_ARGUMENT];
        }

        let url: string = "";
        let exists: boolean = false;
        let tries: number = 0;
        do {
            tries++;
            url = `${wikiSpace.name
                .toLowerCase() // replace spaces with dashes, remove special characters, and limit the length to 20 characters
                .replace(/ /g, "-")
                .replace(/[^A-Za-z0-9-]/g, "")
                .substring(0, 20)}-${randomString(6)}`; // add a random string of 6 characters to avoid conflicts
            const existsCheck = collection.findOne({ url });
            if (existsCheck !== undefined) {
                exists = true;
            } else {
                exists = false;
            }
        } while (exists && tries < 10);
        if (exists) {
            return [undefined, DolphinErrorTypes.FAILED];
        }

        const space: IWikiSpace = {
            name: wikiSpace.name,
            description: wikiSpace.description,
            url,
            permissions: {
                [wikiSpace.owner.toHexString()]: WikiSpacePermissions.OWNER,
            },
        };

        const result = await collection.insertOne(space);
        if (!result.acknowledged) {
            return [undefined, DolphinErrorTypes.FAILED];
        }
        return [new WikiSpace({ ...space, _id: result.insertedId }), null];
    }

    /**
     * finds a wiki space by its url, without checking permissions
     * @param url the url of the space
     * @returns the wiki space if it exists, otherwise an error
     */
    static find(url: string): Promise<MethodResult<WikiSpace>>;

    /**
     * finds a wiki space by its url, checking if the user has at least read permissions
     * @param url the url of the space
     * @param usersAndClasses the users id and the ids of all classes the user is in. Access is granted if at least one of the ids has read permissions or higher
     * @returns the wiki space if it exists and the user has at least read permissions, otherwise an error
     */
    static find(
        url: string,
        usersAndClasses: ObjectId[],
    ): Promise<MethodResult<WikiSpace>>;

    static async find(
        url: string,
        usersAndClasses?: ObjectId[],
    ): Promise<MethodResult<WikiSpace>> {
        const dolphin = Dolphin.instance ?? (await Dolphin.init(useRuntimeConfig()));
        const collection = dolphin.database.collection<IWikiSpace>("wiki.spaces");

        const space = await collection.findOne({ url });
        if (!space) {
            return [undefined, DolphinErrorTypes.NOT_FOUND];
        }
        if (usersAndClasses) {
            const hasPermission = usersAndClasses.some(
                (id) => space.permissions[id.toHexString()] >= WikiSpacePermissions.READ,
            );
            if (!hasPermission) {
                return [undefined, DolphinErrorTypes.NOT_AUTHORIZED];
            }
        }
        return [new WikiSpace(space), null];
    }

    static async getById(id: ObjectId): Promise<MethodResult<WikiSpace>> {
        const dolphin = Dolphin.instance ?? (await Dolphin.init(useRuntimeConfig()));
        const collection = dolphin.database.collection<IWikiSpace>("wiki.spaces");

        const space = await collection.findOne({ _id: id });
        if (!space) {
            return [undefined, DolphinErrorTypes.NOT_FOUND];
        }
        return [new WikiSpace(space), null];
    }

    /**
     * Lists all wiki spaces
     */
    static list(): Promise<MethodResult<WikiSpace[]>>;

    /**
     * Lists all wiki spaces that the user has access to
     * Each space is returned, where at least one of the ids in usersAndClasses has permissions to read the space or higher
     * @param usersAndClasses the users id and the ids of all classes the user is in
     */
    static list(usersAndClasses: ObjectId[]): Promise<MethodResult<WikiSpace[]>>;

    static async list(usersAndClasses?: ObjectId[]): Promise<MethodResult<WikiSpace[]>> {
        const dolphin = Dolphin.instance ?? (await Dolphin.init(useRuntimeConfig()));
        const collection = dolphin.database.collection<IWikiSpace>("wiki.spaces");

        if (!usersAndClasses) {
            const spaces = await collection.find({}).toArray();
            return [spaces.map((space) => new WikiSpace(space)), null];
        }

        const spaces = await collection
            .find({
                $or: usersAndClasses.map((id) => ({
                    [`permissions.${id.toHexString()}`]: {
                        $gte: WikiSpacePermissions.READ,
                    },
                })),
            })
            .toArray();

        return [spaces.map((space) => new WikiSpace(space)), null];
    }

    _id: ObjectId;
    name: string;
    description?: string;
    tags?: string[];
    permissions: {
        [key: string]: WikiSpacePermissions;
    };
    url: string;

    private constructor(wikiSpace: WithId<IWikiSpace>) {
        this._id = wikiSpace._id;
        this.name = wikiSpace.name;
        this.description = wikiSpace.description;
        this.tags = wikiSpace.tags;
        this.permissions = wikiSpace.permissions;
        this.url = wikiSpace.url;
    }
}

function randomString(length: number): string {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

export default WikiSpace;
