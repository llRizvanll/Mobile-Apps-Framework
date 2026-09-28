import { fireEvent, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { featureFlags } from '@config/featureFlags';
import { FeatureFlagsToken } from '@framework/core';
import { createTestBrand, renderWithFramework, type MockTransport } from '@framework/testing';
import { act } from '@testing-library/react-native';
import { todosModule } from '../module';
import { TodoListScreen } from '../presentation/TodoListScreen';

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

const api = (http: MockTransport) =>
  http
    .on('GET', '/todos', {
      data: {
        items: [{ id: 1, title: 'Existing task', completed: false, created_at: '2026-01-01' }],
      },
    })
    .on('POST', '/todos', (req) => ({
      status: 201,
      data: {
        id: 2,
        title: (req.body as { title: string }).title,
        completed: false,
        created_at: '2026-01-02',
      },
    }))
    .on('PATCH', '/todos/1', {
      data: { id: 1, title: 'Existing task', completed: true, created_at: '2026-01-01' },
    });

const renderScreen = () =>
  renderWithFramework(
    <SafeAreaProvider initialMetrics={metrics}>
      <TodoListScreen />
    </SafeAreaProvider>,
    {
      brand: createTestBrand({ config: { features: { todos: true } } }),
      modules: [todosModule],
      mockHttp: api,
      flags: { definitions: featureFlags },
    },
  );

describe('TodoListScreen (integration: UI → VM → use case → repo → HTTP)', () => {
  it('loads todos and shows the plural-aware remaining count', async () => {
    await renderScreen();
    expect(await screen.findByText('Existing task')).toBeTruthy();
    expect(screen.getByText('1 task left')).toBeTruthy();
  });

  it('adds a todo, sends brand headers and tracks analytics', async () => {
    const { http, analytics } = await renderScreen();
    await screen.findByText('Existing task');
    await fireEvent.changeText(screen.getByTestId('todos.input'), 'Write the docs');
    await fireEvent.press(screen.getByTestId('todos.add'));
    expect(await screen.findByText('Write the docs')).toBeTruthy();
    expect(screen.getByText('2 tasks left')).toBeTruthy();
    expect(http.last()?.headers['X-Brand']).toBe('test-brand');
    expect(analytics.events).toContainEqual(
      expect.objectContaining({ type: 'track', name: 'todo_added' }),
    );
  });

  it('shows a translated validation error without calling the API', async () => {
    const { http } = await renderScreen();
    await screen.findByText('Existing task');
    await fireEvent.press(screen.getByTestId('todos.add'));
    expect(await screen.findByText('Please enter a title.')).toBeTruthy();
    expect(http.requests.filter((r) => r.method === 'POST')).toHaveLength(0);
  });

  it('toggles completion', async () => {
    await renderScreen();
    await fireEvent.press(await screen.findByTestId('todos.item.1'));
    expect(await screen.findByText('All done 🎉')).toBeTruthy();
  });

  it('hides completed tasks live when the todos.showCompleted runtime flag turns off', async () => {
    const { app } = await renderScreen();
    await fireEvent.press(await screen.findByTestId('todos.item.1'));
    expect(await screen.findByText('Existing task')).toBeTruthy();
    await act(() => app.container.get(FeatureFlagsToken).setOverride('todos.showCompleted', false));
    expect(screen.queryByText('Existing task')).toBeNull();
  });
});
