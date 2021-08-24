import { initGithubTracker } from "../src/trackers/github";

const token = process.env.GITHUB_TOKEN;

describe("Reopening issues in Github Tracker", () => {
    it("read GITHUB_TOKEN env var", () => {
        expect(token).toBeDefined();
    });

    it("should initialise Github tracker", () => {
        const tracker = initGithubTracker({ token: token!! });
    })
})