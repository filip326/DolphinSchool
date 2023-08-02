import User, { IUser } from "../User";
import Parent from "../Parent/Parent";
import { Collection, WithId, ObjectId } from "mongodb";
import MethodResult from "../../MethodResult";

interface IStudent extends IUser {
  parents: ObjectId[];
}

class Student extends User implements IStudent {
  parents: ObjectId[];

  constructor(collection: Collection<IUser>, user: WithId<IStudent>) {
    super(collection, user);
    this.parents = user.parents;
  }

  getParents(index: number): Promise<MethodResult<Parent>>;
  getParents(): Promise<MethodResult<Parent[]>>;

  async getParents(index?: number): Promise<MethodResult<Parent | Parent[]>> {
    if (index && index % 1 === 0 && index < this.parents.length && index >= 0) {
      const dbResult = await this.userCollection.findOne({ _id: this.parents[index] });
      if (!dbResult) {
        return [undefined, new Error("User not found")];
      }
      const parent = new User(this.userCollection, dbResult);
      if (parent.isParent()) {
        return [parent, null];
      }
      return [undefined, new Error("Parent is not a parent")];
    }

    const dbResult = await this.userCollection
      .find({ $or: this.parents.map((id) => ({ _id: id })) })
      .toArray();
    if (!dbResult || dbResult.length === 0) {
      return [undefined, new Error("Users not found")];
    }
    const parents = dbResult.map((id) => new User(this.userCollection, id)) as Parent[];
    for (const parent of parents) {
      if (!parent.isStudent()) {
        return [undefined, new Error("Parent is not a parent")];
      }
    }
    return [parents, null];
  }
}

export default Student;
export { IStudent };
