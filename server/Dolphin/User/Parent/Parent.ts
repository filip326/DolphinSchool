import User, { IUser } from "../User";
import Student from "../Student/Student";
import { ObjectId, Collection, WithId } from "mongodb";
import MethodResult from "../../MethodResult";

interface IParent extends IUser {
  students: ObjectId[];
}

class Parent extends User implements Parent {
  students: ObjectId[];

  constructor(collection: Collection<IUser>, user: WithId<IParent>) {
    super(collection, user);
    this.students = user.students;
  }

  getStudents(index: number): Promise<MethodResult<Student>>;
  getStudents(): Promise<MethodResult<Student[]>>;

  async getStudents(index?: number): Promise<MethodResult<Student | Student[]>> {
    if (index && index % 1 === 0 && index < this.students.length && index >= 0) {
      const dbResult = await this.userCollection.findOne({ _id: this.students[index] });
      if (!dbResult) {
        return [undefined, new Error("User not found")];
      }
      const student = new User(this.userCollection, dbResult);
      if (student.isStudent()) {
        return [student, null];
      }
      return [undefined, new Error("Student is not a student")];
    }

    const dbResult = await this.userCollection
      .find({ $or: this.students.map((id) => ({ _id: id })) })
      .toArray();
    if (!dbResult || dbResult.length === 0) {
      return [undefined, new Error("Users not found")];
    }
    const students = dbResult.map((id) => new User(this.userCollection, id)) as Student[];
    for (const student of students) {
      if (!student.isStudent()) {
        return [undefined, new Error("Student is not a student")];
      }
    }
    return [students, null];
  }
}

export default Parent;
export { IParent };
