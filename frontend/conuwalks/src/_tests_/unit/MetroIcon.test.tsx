import React from 'react';
import { render } from '@testing-library/react-native';
import { MetroIcon } from '../../components/MetroIcon';

describe('MetroIcon', () => {
  it('renders with default props', () => {
    const { toJSON } = render(<MetroIcon />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders with custom width, height, and color', () => {
    const { toJSON } = render(
      <MetroIcon width={50} height={40} color="#ff0000" />
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('accepts string values for width and height', () => {
    const { toJSON } = render(
      <MetroIcon width="100%" height="100%" color="#00ff00" />
    );
    expect(toJSON()).toMatchSnapshot();
  });
});