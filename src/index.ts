/* eslint-disable no-console */

import * as util from 'util';

import * as github from './trackers/github';
import { ParseResult, Output, parse } from './todocheck';
import {
  Inputs, Issue, IssueComparator, Tracker,
} from './trackers/tracker';

const exec = util.promisify(require('child_process').exec);

const factory = (): { inputs: Inputs, tracker: Tracker, issueSorter: IssueComparator } => {
  let inputs: Inputs;
  let tracker: Tracker;
  let issueSorter: IssueComparator;

  if (process.env.GITHUB_REPOSITORY) {
    inputs = github.readInputsFromAction();
    tracker = github.initGithubTracker(inputs);
    issueSorter = github.comparator;
  } else {
    throw new Error('Unknown host!');
  }

  return { inputs, tracker, issueSorter };
};

const main = async () => {
  const { inputs, tracker, issueSorter } = factory();

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
  const { stdout } = await exec(`${inputs.todocheck} --format json`);
  const output: ParseResult<Output> = parse(stdout);
  if (!output || output.hasError) {
    throw new Error(output.error);
  }
  const todocheckOutput = output.parsed!!;

  // Filter out issues marked by todocheck as closed
  const closedIssues: Issue[] = todocheckOutput
    .filter((issue, index) => inputs.issueRefs[index] === issue.issueRef)
    .sort((i1, i2) => issueSorter(i1, i2))
    .map((issue, index) => ({
      isOpen: trackerIssues[index].isOpen,
      issueRef: issue.issueRef.toString(),
    }));

  const reopenedIssues = await tracker.reopenIssues(closedIssues);
  const stillClosedIssues = reopenedIssues.filter((issue) => issue.isOpen);
  if (stillClosedIssues) {
    throw new Error(`Referenced issue is still closed! ${trackerIssues}`);
  }
};

main().then(() => {
  console.log('Execution terminated successfully');
}).catch((reason) => {
  console.error(`${reason}`);
});
