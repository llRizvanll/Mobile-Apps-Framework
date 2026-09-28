import { render, type RenderOptions } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { FrameworkProvider } from '@framework/core';
import { createTestApp, type TestApp, type TestAppOptions } from './test-app';

/** Renders UI inside a fully booted test app. Returns RNTL's API plus the app doubles. */
export async function renderWithFramework(
  ui: ReactElement,
  options: TestAppOptions & { render?: RenderOptions } = {},
) {
  const testApp: TestApp = await createTestApp(options);
  const result = await render(
    <FrameworkProvider app={testApp.app}>{ui}</FrameworkProvider>,
    options.render,
  );
  return { ...result, ...testApp };
}
