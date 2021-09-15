import { parse } from '../src/lib/todocheck';

describe("parsing todocheck's JSON output", () => {
  it('all optional keys are present', () => {
    const input = JSON.stringify([
      {
        type: "Issue doesn't exist",
        filename: 'testing/scenarios/annotated_todos/main.go',
        line: 7,
        message: '// TODO J456: This is an invalid todo, annotated with a non-existent issue',
        metadata: {
          issueID: 'J456',
        },
      },
    ]);
    const output = parse(input);

    expect(output.hasError).toBeFalsy();
    expect(output.error).toBeUndefined();
    expect(output.parsed).toBeDefined();
  });

  it('optional keys missing', () => {
    const input = JSON.stringify([
      {
        type: 'Malformed todo',
        filename: 'matchers/php/todomatcher.go',
        line: 61,
        message: 'TODO should match pattern - TODO {task_id}:',
        metadata: {
        },
      },
    ]);
    const output = parse(input);

    expect(output.hasError).toBeFalsy();
    expect(output.error).toBeUndefined();
    expect(output.parsed).toBeDefined();
  });

  it('missing mandatory field', () => {
    const input = JSON.stringify([
      {
        type: 'Malformed todo',
        filename: 'matchers/php/todomatcher.go',
        line: 61,
        message: 'TODO should match pattern - TODO {task_id}',
      },
    ]);
    const output = parse(input);

    expect(output.hasError).toBeTruthy();
    expect(output.error).toBeDefined();
    expect(output.parsed).toBeUndefined();
  });
});
