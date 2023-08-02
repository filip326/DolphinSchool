import MethodResult from "Dolphin/MethodResult";
import GlobalUserManager from "./GlobalUserManager";
import SearchUserOptions from "./SearchUserOptions";
import User from "./User";

class RestrictedUserManager {
  manager: GlobalUserManager;
  me: User;

  constructor(manager: GlobalUserManager, me: User) {
    this.manager = manager;
    this.me = me;
  }

  async searchUsers(options: SearchUserOptions): Promise<MethodResult<User[]>> {
    // check if class is the same
    return this.manager.searchUsers(options);
  }

  async findUser(options: SearchUserOptions): Promise<MethodResult<User[]>> {
    // check if class is the same
    return this.manager.searchUsers(options);
  }

  async list(options: { amount?: number; skip?: number }): Promise<MethodResult<User[]>> {
    // list students where class same as me
    return this.manager.list(options);
  }
}

export default RestrictedUserManager;
