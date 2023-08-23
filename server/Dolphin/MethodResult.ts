enum DolphinErrorTypes {
    Failed = 0,
    DatabaseError = 1,
    DolphinNotReady = 2,
    NotFound = 3,
    AlreadyExists = 4,
    NotSupported = 5,
    NotAuthorized = 6,
    NotAuthenticated = 7,
    InvalidArgument = 8,
    InvalidType = 9
}

type MethodResult<T> = [T, null] | [undefined, DolphinErrorTypes];
export default MethodResult;
export { DolphinErrorTypes };
