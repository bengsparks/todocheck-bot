export type Output = {
  type: string,
  filename: string,
  line: string,
  message: string,
  metadata: {
    issueID: string
  }
}[];

export type ParseResult<T> =
  | { parsed: T; hasError: false; error?: undefined }
  | { parsed?: undefined; hasError: boolean; error: string };

const guard = (o: any): o is Output => !!o // Non-empty output
  && Array.isArray(o)
  && 'type' in o[0]
  && 'filename' in o[0]
  && 'line' in o[0]
  && 'message' in o[0]
  && 'metadata' in o[0]
  && 'issueID' in o[0];

export const parse = (output: string): ParseResult<Output> => {
  const parsed = JSON.parse(output);
  return guard(parsed)
    ? { parsed, hasError: false }
    : { hasError: true, error: "Unable to parse todocheck's output" };
};
