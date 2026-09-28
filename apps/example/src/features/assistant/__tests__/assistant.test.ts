import { ScriptedAIClient, ToolRegistry, textResponse, toolUseResponse } from '@org/ai';
import { Container } from '@org/di';
import { todoTools } from '../../todos/ai/tools';
import { AddTodo, GetTodos } from '../../todos/domain/usecases';
import { AddTodoToken, GetTodosToken } from '../../todos/tokens';
import { FakeTodoRepository } from '../../todos/__tests__/domain.test';
import { createAssistantStore } from '../presentation/assistantStore';

const tick = () => new Promise((r) => setTimeout(() => r(undefined), 0));

describe('assistant MVI store', () => {
  const setup = (script: ConstructorParameters<typeof ScriptedAIClient>[0], confirm = true) => {
    const repo = new FakeTodoRepository();
    const c = new Container();
    c.bind(GetTodosToken).toValue(new GetTodos(repo));
    c.bind(AddTodoToken).toValue(new AddTodo(repo));
    const client = new ScriptedAIClient(script);
    const store = createAssistantStore({
      client,
      tools: new ToolRegistry().register(...todoTools(c)),
      system: 'test',
      model: 'fast',
      confirm: () => Promise.resolve(confirm),
    });
    return { store, repo, client };
  };

  it('runs the agent loop through real feature use cases', async () => {
    const { store, repo, client } = setup([
      toolUseResponse('c1', 'todos.add', { title: 'Buy milk' }),
      textResponse('Added!'),
    ]);
    const effects: string[] = [];
    store.onEffect((e) => effects.push(e.type));
    store.dispatch({ type: 'inputChanged', text: 'add buy milk' });
    store.dispatch({ type: 'send' });
    expect(store.getState().status).toBe('thinking');
    await tick();
    await tick();
    expect(repo.add).toHaveBeenCalledWith('Buy milk');
    expect(store.getState().bubbles.map((b) => [b.from, b.text])).toEqual([
      ['user', 'add buy milk'],
      ['assistant', 'Added!'],
    ]);
    expect(store.getState().transcript).toHaveLength(4);
    expect(client.requests[0]?.metadata).toEqual({ feature: 'assistant' });
    expect(effects).toEqual(['scrollToEnd', 'scrollToEnd']);
  });

  it('never runs side-effecting tools the user declined', async () => {
    const { store, repo } = setup(
      [toolUseResponse('c1', 'todos.add', { title: 'x' }), textResponse('ok, cancelled')],
      false,
    );
    store.dispatch({ type: 'inputChanged', text: 'add x' });
    store.dispatch({ type: 'send' });
    await tick();
    await tick();
    expect(repo.add).not.toHaveBeenCalled();
  });

  it('ignores empty sends and reports failures', async () => {
    const { store } = setup([]);
    store.dispatch({ type: 'send' });
    expect(store.getState().bubbles).toHaveLength(0);
    store.dispatch({ type: 'inputChanged', text: 'hi' });
    store.dispatch({ type: 'send' });
    await tick();
    expect(store.getState().status).toBe('error');
  });
});
