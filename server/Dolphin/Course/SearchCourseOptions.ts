interface Options {
  nameQuery?: string;
  skip?: number;
  max?: number;
}

type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> & U[keyof U];

type SearchCourseOptions = AtLeastOne<Options>;

export default SearchCourseOptions;
