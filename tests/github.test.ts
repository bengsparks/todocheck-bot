import { initGithubTracker } from '../src/trackers/github';
import { Tracker } from '../src/trackers/tracker';

const token = process.env.GITHUB_TOKEN;

describe('Reopening issues in Github Tracker', () => {
  it('read GITHUB_TOKEN env var', () => {
    expect(token).toBeDefined();
  });

  let tracker: Tracker;
  it('should initialise Github tracker', () => {
    tracker = initGithubTracker({ token: token!! });
  });

  const issueRef = '1';
  it('should get a closed issue #1', async () => {
    const issue = await tracker.getIssue(issueRef);
    expect(issue.issueRef).toBe(issueRef);
    expect(issue.isOpen).toBeTruthy();
  });
});
