import React from 'react';
import { render, RenderOptions } from '@testing-library/react-native';

const customRender = (ui: React.ReactElement, options?: RenderOptions) => render(ui, options);

export * from '@testing-library/react-native';
export { customRender as render };