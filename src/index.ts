/* eslint-disable no-console */

import * as util from 'util';

import * as github from './trackers/github';
import { ParseResult, Output, parse } from './todocheck';
import { Inputs, Tracker } from './trackers/tracker';

const exec = util.promisify(require('child_process').exec);

const inferInputsAndTracker = (): readonly [Inputs, Tracker] => {
  let i: Inputs;
  let t: Tracker;

  if (process.env.GITHUB_REPOSITORY) {
    i = github.readInputsFromAction();
    t = github.initGithubTracker(i);
  } else {
    throw new Error('Unknown host!');
  }

  return [i, t] as const;
};

const main = async () => {
  const [inputs, tracker] = inferInputsAndTracker();

  // TODO: Support closing of multiple issues, e.g. when a Pull Request is merged
  // TODO: and it references multiple relevant issues

  // For now, simple issue closing is supported
  const issue = await tracker.getIssue(inputs.issueRef);
  if (issue.isOpen) {
    throw new Error(`Accidentally fired on an open issue! ${issue}`);
  }

  // TODO: Execute todocheck here and capture output
  const { stdout } = await exec(`${inputs.todocheck} --format json`);
  const output: ParseResult<Output> = parse(stdout);

  if (!output || output.hasError) {
    throw new Error(output.error);
  }

  const reopenedIssue = await tracker.reopenIssue(issue);
  if (!reopenedIssue.isOpen) {
    throw new Error(`Referenced issue is still closed! ${issue}`);
  }
};

main().then(() => {
  console.log('Execution terminated successfully');
}).catch((reason) => {
  console.error(`${reason}`);
});
