import *  as github from "./trackers/github";


const main = async () => {
    const inputs: Inputs = (() => {
        const i = process.env.GITHUB_REPOSITORY ? github.readInputsFromAction() : undefined;
        if (!i) {
            throw new Error("Unknown host!")
        }
        return i;
    })();


    const tracker = ((): Tracker => {
        const t = process.env.GITHUB_REPOSITORY ? github.initGithubTracker(inputs) : undefined;
        if (!t) {
            throw new Error("Unknown host!")
        }
        return t;
    })();

    // TODO: Support closing of multiple issues, e.g. when a Pull Request is merged
    // TODO: and it references multiple relevant issues 

    // For now, simple issue closing is supported
    const issue = await tracker.getIssue(inputs.issueRef);
    if (issue.isOpen) {
        throw new Error(`Accidentally fired on an open issue! ${issue}`)
    }

    // TODO: Execute todocheck here and capture output

    const reopenedIssue = await tracker.reopenIssue(issue);
    if (!reopenedIssue.isOpen) {
        throw new Error(`Referenced issue is still closed! ${issue}`)
    }
}

main().then(() => {
    console.log("Execution terminated successfully")
}).catch((reason) => {
    console.error(`${reason}`)
})