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

  // TODO 2: This issue must stay open!
  const issueRef = '2';
  it(`should get an open issue #${issueRef}`, async () => {
    const issue = await tracker.getIssue(issueRef);
    expect(issue.issueRef).toBe(issueRef);
    expect(issue.isOpen).toBeTruthy();
  });
});
