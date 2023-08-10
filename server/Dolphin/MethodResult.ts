enum DolphinErrorTypes {
    Failed = 0,
    NotFound = 1,
    InvalidParameter = 2,
    AlreadyExists = 3,
    DatabaseConnectionFailed = 4,
    DatabaseQueryFailed = 5
}

type DolphinError = [DolphinErrorTypes, string?];

type MethodResult<T> = [T, null] | [undefined, Error];
export default MethodResult;
export { DolphinError, DolphinErrorTypes };
