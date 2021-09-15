/* eslint-disable no-console */

import * as util from 'util';

import { exec } from 'child_process';
import { ParseResult, Output, parse } from './lib/todocheck';
import init from './lib/trackers/factory';
import { Issue } from './lib/trackers/tracker';

const pExec = util.promisify(exec);

const main = async () => {
  const todocheckToken = process.env.TODOCHECK_AUTH_TOKEN;
  if (!todocheckToken) {
    throw new Error('Must pass TODOCHECK_AUTH_TOKEN environment variable to avoid rate limiting');
  }

  const { inputs, tracker, issueSorter } = init();

  /* TODO 5: Support closing of multiple issues, e.g. when a Pull Request is
  merged and it references multiple relevant issues */

  // Sort issues for easy associating
  const trackerIssues: Issue[] = (await tracker.getIssues(inputs.issueRefs)).sort(issueSorter);
  const trackerIssueRefs = trackerIssues.map((issue) => issue.issueRef);

  // Check if bot fired upon open issue by accident
  const openIssues = trackerIssues.filter((issue) => issue.isOpen);
  if (openIssues.length > 0) {
    throw new Error(`Accidentally fired on an open issue! ${JSON.stringify(openIssues)}`);
  }

  // Execute todocheck on the codebase
  const { stdout, stderr } = await pExec(`TODOCHECK_AUTH_TOKEN=${todocheckToken} ${inputs.todocheck} --format json`);
  console.debug(`Captured output:\nstderr: ${stdout}\nstderr: ${stderr}`);

  const output: ParseResult<Output> = parse(stdout);
  if (output.hasError) {
    throw new Error(output.error);
  }
  const todocheckOutput = output.parsed!!;

  // Select issues marked by todocheck as closed
  const closedIssues: Issue[] = todocheckOutput
    .filter((issue) => trackerIssueRefs.includes(issue.metadata.issueID))
    .map((issue) => ({ ...issue, issueRef: parseInt(issue.metadata.issueID, 10) }))
    .sort(issueSorter)
    .map((issue, index) => ({
      isOpen: trackerIssues[index].isOpen,
      issueRef: issue.issueRef.toString(),
    }));

  const reopenedIssues = await tracker.reopenIssues(closedIssues);
  const stillClosedIssues = reopenedIssues.filter((issue) => issue.isOpen);
  if (stillClosedIssues.length > 0) {
    throw new Error(`Referenced issue(s) are still closed! ${JSON.stringify(stillClosedIssues)}`);
  }
};

main().then(() => {
  console.log('Execution terminated successfully');
}).catch((reason) => {
  console.error(`${reason}`);
});
