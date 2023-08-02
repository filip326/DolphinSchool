import { Collection, ObjectId, WithId } from "mongodb";
import { UserType } from "./UserTypes";
import MethodResult from "../MethodResult";
import Student from "./Student/Student";
import PermissionManager, { Permissions } from "../Permissions/PermissionManager";
import Parent from "./Parent/Parent";
import { compare, hash } from "bcrypt";
import { ISubject } from "../Course/Subject";

interface IUser {
  type: UserType;
  fullName: string;
  username: string;
  password: string;
  permissions: number;
  nickname?: string;

  // student properties
  parents?: ObjectId[];

  // parent properties
  students?: ObjectId[];

  //teacher properties
  subjects?: ISubject[];
}

class User implements WithId<IUser> {
  _id: ObjectId;
  type: UserType;
  fullName: string;
  username: string;
  password: string;
  permissions: number;

  parents?: ObjectId[];
  students?: ObjectId[];

  nickname?: string;

  subjects?: ISubject[];

  _permissionManager: PermissionManager;

  userCollection: Collection<IUser>;

  constructor(collection: Collection<IUser>, user: WithId<IUser>) {
    this._id = user._id;
    this.type = user.type;
    this.fullName = user.fullName;
    this.password = user.password;
    this.username = user.username;
    this.permissions = user.permissions;

    this.parents = user.parents;
    this.students = user.students;

    this.nickname = user.nickname;

    this.subjects = user.subjects;

    this._permissionManager = new PermissionManager(this.permissions);

    this.userCollection = collection;
  }

  /**
   * check if the user has a permission
   * @param perm Permission
   */
  hasPermission(perm: Permissions): boolean {
    return this._permissionManager.has(perm);
  }

  /**
   * give the user a permission
   * @param perm Permission
   */
  async allowPermission(perm: Permissions): Promise<MethodResult<boolean>> {
    this._permissionManager.allow(perm);
    this.permissions = this._permissionManager.permissions;
    try {
      const updateResult = await this.userCollection.findOneAndUpdate(
        { _id: this._id },
        { $set: { permissions: this.permissions } }
      );
      return [updateResult.ok === 1, null];
    } catch {
      return [undefined, new Error("Database error")];
    }
  }

  /**
   * deny the user a permission
   * @param perm Permission
   */
  async denyPermission(perm: Permissions): Promise<MethodResult<boolean>> {
    this._permissionManager.deny(perm);
    this.permissions = this._permissionManager.permissions;
    try {
      const updateResult = await this.userCollection.findOneAndUpdate(
        { _id: this._id },
        { $set: { permissions: this.permissions } }
      );
      return [updateResult.ok === 1, null];
    } catch {
      return [undefined, new Error("Database error")];
    }
  }

  isStudent(): this is Student {
    return this.type === "student";
  }

  isParent(): this is Parent {
    return this.type === "parent";
  }

  /**
   * set the user's password
   * @param password string
   */
  async setPassword(password: string): Promise<MethodResult<boolean>> {
    let passwordHash: string;
    try {
      passwordHash = await hash(password, 12);
    } catch {
      return [undefined, new Error("Hashing error")];
    }
    this.password = passwordHash;
    try {
      const dbResult = await this.userCollection.findOneAndUpdate(
        {
          _id: this._id
        },
        { $set: { password: this.password } }
      );
      if (dbResult.ok === 1) {
        return [true, null];
      } else {
        return [false, null];
      }
    } catch {
      return [undefined, new Error("Database error")];
    }
  }

  /**
   * Compare a password with the user's password
   * @param password string
   */
  async comparePassword(password: string): Promise<MethodResult<boolean>> {
    try {
      const hashResult = await compare(password, this.password);
      return [hashResult, null];
    } catch {
      return [undefined, new Error("Hashing error")];
    }
  }

  async MFAEnabled(): Promise<MethodResult<false>> {
    // TODO: implement MFA
    return [false, null];
  }

  async checkMFA(/* code: string */): Promise<MethodResult<boolean>> {
    // TODO: implement MFA
    return [false, null];
  }
}

export default User;
export { IUser };
