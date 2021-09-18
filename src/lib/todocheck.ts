import { exec } from 'child_process';
import { promisify } from 'util';

const pexec = promisify(exec);

/**
 * Todocheck's relevant JSON output format
 *
 * Note the usage of the word relevant; these attributes encompass all
 * mandatory outputs and enforces the presence of the `issueID` attribute.
 * Other todo errors, such as finding malformed todos, are therefore dropped.
 */
export type Output = {
  type: string,
  filename: string,
  line: number,
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
  && 'metadata' in o[0];

/**
 * Parses
 * @param output
 * @returns
 */
export const parse = (output: string): ParseResult<Output> => {
  const parsed = JSON.parse(output);

  return guard(parsed)
    ? { parsed: parsed.filter((o) => o.metadata.issueID !== undefined), hasError: false }
    : { hasError: true, error: "Unable to parse todocheck's output" };
};

const captureCodeAndStdout = (e: any): e is { code: number, stdout: string } => e
  && e.code && typeof e.code === 'number'
  && e.stdout && typeof e.stdout === 'string';

export const captureTodocheckOutput = async (
  todocheckAuthToken: string, todocheckPath: string,
): Promise<string> => {
  try {
    const { stdout } = await pexec(`${todocheckPath} --format json`, {
      env: { ...process.env, TODOCHECK_AUTH_TOKEN: todocheckAuthToken },
    });
    return stdout;
  } catch (e) {
    if (captureCodeAndStdout(e)) {
      if (e.code >= 0 && e.code <= 2) {
        return e.stdout;
      }
    }

    throw new Error(`Error occurred: ${e}`);
  }
};
