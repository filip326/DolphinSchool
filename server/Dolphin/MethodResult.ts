enum DolphinErrorTypes {
    Failed = 0,
    DatabaseError = 1,
    NotFound = 2,
    AlreadyExists = 3,
    NotSupported = 4,
    NotAuthorized = 5,
    NotAuthenticated = 6,
    InvalidArgument = 7,
    InvalidType = 8
}

type MethodResult<T> = [T, null] | [undefined, DolphinErrorTypes];
export default MethodResult;
export { DolphinErrorTypes };
