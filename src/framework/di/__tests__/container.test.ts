import { AppError } from '@framework/foundation';
import { Container, createToken, defineServiceModule } from '../index';

interface Logger {
  log(msg: string): void;
}
class Greeter {
  constructor(
    private readonly logger: Logger,
    private readonly name: string,
  ) {}
  greet(): string {
    this.logger.log('greet');
    return `hi ${this.name}`;
  }
}

const LoggerT = createToken<Logger>('Logger');
const NameT = createToken<string>('Name');
const GreeterT = createToken<Greeter>('Greeter');

describe('Container', () => {
  it('resolves typed class bindings with explicit deps', () => {
    const c = new Container();
    c.bind(LoggerT).toValue({ log: jest.fn() });
    c.bind(NameT).toValue('ada');
    c.bind(GreeterT).toClass(Greeter, [LoggerT, NameT] as const);
    expect(c.get(GreeterT).greet()).toBe('hi ada');
    expect(c.get(GreeterT)).toBe(c.get(GreeterT));
  });

  it('honours lifetimes across scopes', () => {
    const Counter = createToken<{ id: number }>('Counter');
    const Scoped = createToken<{ id: number }>('Scoped');
    let n = 0;
    const root = new Container();
    root.bind(Counter).toFactory(() => ({ id: n++ }), { lifetime: 'transient' });
    root.bind(Scoped).toFactory(() => ({ id: n++ }), { lifetime: 'scoped' });
    expect(root.get(Counter)).not.toBe(root.get(Counter));
    const a = root.createScope();
    const b = root.createScope();
    expect(a.get(Scoped)).toBe(a.get(Scoped));
    expect(a.get(Scoped)).not.toBe(b.get(Scoped));
  });

  it('supports multi-bindings inherited through scopes', () => {
    const Plugin = createToken<string>('Plugin');
    const root = new Container();
    root.bindMulti(Plugin).toValue('a');
    const child = root.createScope();
    child.bindMulti(Plugin).toValue('b');
    expect(child.getAll(Plugin)).toEqual(['a', 'b']);
    expect(root.getAll(Plugin)).toEqual(['a']);
  });

  it('detects circular dependencies with a readable path', () => {
    const A = createToken<unknown>('A');
    const B = createToken<unknown>('B');
    const c = new Container();
    c.bind(A).toFactory((r) => r.get(B));
    c.bind(B).toFactory((r) => r.get(A));
    expect(() => c.get(A)).toThrow(/Circular dependency: A -> B -> A/);
  });

  it('throws AppError for missing bindings and supports overrides', () => {
    const c = new Container();
    expect(() => c.get(NameT)).toThrow(AppError);
    c.bind(NameT).toValue('x');
    c.override(NameT).toValue('y');
    expect(c.get(NameT)).toBe('y');
  });

  it('loads modules once and disposes owned instances', async () => {
    const dispose = jest.fn();
    const Res = createToken<{ dispose(): void }>('Res');
    const register = jest.fn((c: Container) => c.bind(Res).toFactory(() => ({ dispose })));
    const mod = defineServiceModule('res', register);
    const c = new Container().load(mod, mod);
    expect(register).toHaveBeenCalledTimes(1);
    c.get(Res);
    await c.dispose();
    expect(dispose).toHaveBeenCalled();
    expect(() => c.get(Res)).toThrow(/disposed/);
  });
});
