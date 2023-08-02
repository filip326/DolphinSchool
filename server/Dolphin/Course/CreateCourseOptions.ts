import { ObjectId } from "mongodb";


interface CreateCourseOptions {
    name: string
    teacher: ObjectId
    subject: ObjectId
}

export default CreateCourseOptions;
