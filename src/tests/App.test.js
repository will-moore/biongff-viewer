import ViewerIndex from '@app/components/viewer/ViewerIndex';

import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import {
  createMemoryRouter,
  MemoryRouter,
  RouterProvider,
} from 'react-router-dom';
import { test } from 'vitest';

import AllRoutes from '@app/layouts/AllRoutes';

// Wrapper to test individual components
// provides context and basic router to ignore routes
const Wrapper = ({ children }) => {
  const router = createMemoryRouter([{ path: '/', element: children }]);

  // test-specific queryClient
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <AppProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router}>
          <AuthProvider>{children}</AuthProvider>
        </RouterProvider>
      </QueryClientProvider>
    </AppProvider>
  );
};

const RoutingWrapper = ({ initialEntries }) => {
  // test-specific queryClient
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <AppProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>
          <AllRoutes />
        </MemoryRouter>
      </QueryClientProvider>
    </AppProvider>
  );
};

test('Render studies index', () => {
  render(<ViewerIndex />, { wrapper: Wrapper });
  const studiesText = screen.getByText(
    /Displaying [0-9]+ out of [0-9]+ studies/,
  );
  expect(studiesText).toBeInTheDocument();
});
