enum DolphinErrorTypes {
    FAILED = 0,
    DATABASE_ERROR = 1,
    NOT_FOUND = 2,
    ALREADY_EXISTS = 3,
    NOT_SUPPORTED = 4,
    NOT_ACTIVE = 5,
    NOT_AUTHORIZED = 6,
    NOT_AUTHENTICATED = 7,
    INVALID_ARGUMENT = 8,
    INVALID_TYPE = 9
}

type MethodResult<T> = [T, null] | [undefined, DolphinErrorTypes];
export default MethodResult;
export { DolphinErrorTypes };
