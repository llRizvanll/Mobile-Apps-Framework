# @org/presentation

MVVM view models and MVI stores — React-free, bound with hooks.

```ts
class ProfileViewModel extends ViewModel<ProfileState> {
  constructor(private readonly load: GetProfile) { super(initial); }
  protected override onInit() { return this.refresh(); }
  readonly refresh = () => this.launch(async (signal) => { ... this.setState({ ... }) });
}
const [state, vm] = useViewModel(() => new ProfileViewModel(resolver.get(GetProfileToken)));
```

```ts
const store = createMviStore({ initialState, reduce: (s, intent) => s, effects: async (intent, { dispatch, emit, signal }) => {} });
const [state, dispatch, s] = useMvi(() => store);  useMviEffects(s, (effect) => navigate(...));
```

VMs are ref-counted (StrictMode safe), abort in-flight work on dispose, and route errors to `onError`.
