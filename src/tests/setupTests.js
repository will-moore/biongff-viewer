import { vi } from 'vitest';

if (typeof window.URL.createObjectURL === 'undefined') {
  window.URL.createObjectURL = function () {
    return 'mocked-url';
  };
}

vi.mock('vitessce', () => ({
  Vitessce: () => <div>Mocked Vitessce Component</div>,
}));
