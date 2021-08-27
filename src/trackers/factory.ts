import { Inputs, IssueComparator, Tracker } from './tracker';
import * as github from './github';

const init = (): { inputs: Inputs, tracker: Tracker, issueSorter: IssueComparator } => {
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

export default init;
