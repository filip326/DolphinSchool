import { Collection, ObjectId, WithId } from "mongodb";
import GlobalCourseManager from "./GlobalCourseManager";
import Dolphin from "../Dolphin";

interface ICourse {
    name: string;
    subject?: ObjectId;
    teacherIds: ObjectId[];
    userIds: ObjectId[];
}

class Course implements WithId<ICourse> {
    _id: ObjectId;
    name: string;
    subject?: ObjectId;
    teacherIds: ObjectId[];
    userIds: ObjectId[];
    collection: Collection<ICourse>;

    constructor(collection: Collection<ICourse>, course: WithId<ICourse>) {
        this.collection = collection;
        this._id = course._id;
        this.name = course.name;
        this.subject = course.subject;
        this.teacherIds = course.teacherIds;
        this.userIds = course.userIds;
    }
}

export default Course;
export { ICourse };
