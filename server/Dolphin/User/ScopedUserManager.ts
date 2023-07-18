// this represents a GlobalUserManager, but is scoped to the domain of a single user
// a user, that is not an admin, can see only other users, that are in the same courses as him or send him messages

import GlobalCourseManager from "../Course/GlobalCourseManager";
import Dolphin from "../Dolphin";
import MethodResult from "../MethodResult";
import { Permissions } from "../Permissions/PermissionManager";
import FindUserOptions from "./FindUserOptions";
import GlobalUserManager from "./GlobalUserManager";
import SearchUserOptions from "./SearchUserOptions";
import User from "./User";

class ScopedUserManager {

    private globalUserManager: GlobalUserManager;
    private user: User;

    constructor(globalUserManager: GlobalUserManager, user: User) {
        this.globalUserManager = globalUserManager;
        this.user = user;
    }

    static async create(user: User) {
        const dolphin = Dolphin.instance ?? await Dolphin.init();
        const globalUserManager = GlobalUserManager.getInstance(dolphin);
        return new ScopedUserManager(globalUserManager, user);
    }

    async findUser(query: FindUserOptions): Promise<MethodResult<User | undefined>> {

        // if user is admin, return result of globalUserManager.findUser
        if (this.user.hasPermission(Permissions.SEE_ALL_USERS)) {
            return this.globalUserManager.findUser(query);
        }

        const [potentialUser, potentialUserFindError] = await this.globalUserManager.findUser(query);

        if (potentialUserFindError || !potentialUser) {
            return [undefined, potentialUserFindError];
        }

        // return, if the user has a same course as the user
        if (await GlobalCourseManager.getInstance(Dolphin.instance!).sameCourse(this.user, potentialUser)) {
            return [potentialUser, null];
        }

        // also return, if there is a message send by the searched user to the user
        const [userMessageManager, userMessageManagerError] = await Dolphin.instance!.getMessenger(this.user);

        if (userMessageManagerError || !userMessageManager) {
            return [undefined, userMessageManagerError];
        }

        const [ message, messageError ] = await userMessageManager.getUserMessageByAuthor(potentialUser._id);
        
        if (messageError || !message) {
            return [undefined, null];
        }
        
        return [potentialUser, null];
        
    }

    async searchUsers(query: SearchUserOptions): Promise<MethodResult<User[]>> {

        if (this.user.hasPermission(Permissions.SEE_ALL_USERS)) {
            return this.globalUserManager.searchUsers(query);
        }
        
        const [potentialUsers, potentialUsersFindError] = await this.globalUserManager.searchUsers(query);
        
        if (potentialUsersFindError || !potentialUsers) {
            return [undefined, potentialUsersFindError];
        }
        const [userMessageManager, userMessageManagerError] = await Dolphin.instance!.getMessenger(this.user);

        if (userMessageManagerError || !userMessageManager) {
            return [undefined, userMessageManagerError];
        }

        // return, if the user has a same course as the user or 
        const sameCourseUsers = await potentialUsers.filter(async (potentialUser) => {
            return await GlobalCourseManager.getInstance(Dolphin.instance!).sameCourse(this.user, potentialUser) || (await userMessageManager.getUserMessageByAuthor(potentialUser._id))[0] != undefined;
        });

        return [sameCourseUsers, null];
    }


}