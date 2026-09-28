# @framework/di

Typed dependency injection without decorators.

```ts
import { Container, createToken } from '@framework/di';

const Http = createToken<HttpClient>('network.HttpClient');
c.bind(Http).toFactory((r) => createHttpClient(...));             // singleton by default
c.bind(Repo).toClass(RestRepo, [Http] as const);                  // deps type-checked vs constructor
c.bind(Session).toFactory(make, { lifetime: 'scoped' });          // per createScope()
c.bindMulti(Plugin).toValue(p); c.getAll(Plugin);                 // extension points
```

React (`@framework/di/react`): `ContainerProvider`, `useInject(token)`, `useOptionalInject`, `useResolver`.

Detects cycles (`A -> B -> A`), disposes owned `Disposable`s, last binding wins (`override`).
