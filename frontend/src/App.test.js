import { render, screen } from '@testing-library/react';
import Landing from './pages/Landing';

jest.mock('./supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null } }))
    }
  }
}));

jest.mock(
  'react-router-dom',
  () => ({
    useNavigate: () => jest.fn()
  }),
  { virtual: true }
);

jest.mock('framer-motion', () => {
  const React = require('react');
  const cleanProps = (props) => {
    const { initial, animate, transition, whileHover, whileTap, ...rest } = props;
    return rest;
  };
  const create = Tag => React.forwardRef(({ children, ...props }, ref) =>
    React.createElement(Tag, { ...cleanProps(props), ref }, children)
  );
  return {
    motion: {
      div: create('div'),
      span: create('span'),
      h1: create('h1'),
      h2: create('h2'),
      p: create('p'),
      button: create('button'),
      a: create('a')
    },
    useInView: () => true
  };
});

test('answers what can you do with key capabilities', async () => {
  render(<Landing />);

  expect(
    await screen.findByRole('heading', { name: /what can you do/i })
  ).toBeInTheDocument();
  expect(
    screen.getByText(/extract every commitment/i)
  ).toBeInTheDocument();
  expect(
    screen.getByText(/assign owners and deadlines automatically/i)
  ).toBeInTheDocument();
  expect(
    screen.getByText(/automatic nudges keep tasks moving/i)
  ).toBeInTheDocument();
});
