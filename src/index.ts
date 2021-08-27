/* eslint-disable no-console */

import * as util from 'util';

import { exec } from 'child_process';
import { ParseResult, Output, parse } from './todocheck';
import init from './trackers/factory';
import { Issue } from './trackers/tracker';

const pExec = util.promisify(exec);

const main = async () => {
  const { inputs, tracker, issueSorter } = init();

  // TODO: Support closing of multiple issues, e.g. when a Pull Request is merged
  // TODO: and it references multiple relevant issues

  // Sort issues for easy associating
  const trackerIssues: Issue[] = (await tracker.getIssues(inputs.issueRefs)).sort(issueSorter);

  // Check if bot fired upon open issue by accident
  const openIssues = trackerIssues.filter((issue) => issue.isOpen);
  if (openIssues) {
    throw new Error(`Accidentally fired on an open issue! ${trackerIssues}`);
  }

  // Execute todocheck on the codebase
  const { stdout } = await pExec(`${inputs.todocheck} --format json`);
  const output: ParseResult<Output> = parse(stdout);
  if (output.hasError) {
    throw new Error(output.error);
  }
  const todocheckOutput = output.parsed!!;

  // Select issues marked by todocheck as closed
  const closedIssues: Issue[] = todocheckOutput
    .filter((issue, index) => inputs.issueRefs[index] === issue.issueRef)
    .map((issue) => ({ ...issue, issueRef: parseInt(issue.issueRef, 10) }))
    .sort(issueSorter)
    .map((issue, index) => ({
      isOpen: trackerIssues[index].isOpen,
      issueRef: issue.issueRef.toString(),
    }));

  const reopenedIssues = await tracker.reopenIssues(closedIssues);
  const stillClosedIssues = reopenedIssues.filter((issue) => issue.isOpen);
  if (stillClosedIssues) {
    throw new Error(`Referenced issue is still closed! ${stillClosedIssues}`);
  }
};

main().then(() => {
  console.log('Execution terminated successfully');
}).catch((reason) => {
  console.error(`${reason}`);
});
