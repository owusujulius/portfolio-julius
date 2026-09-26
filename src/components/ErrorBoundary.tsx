import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled UI error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center px-6">
          <div className="max-w-md rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-600">Something went wrong</p>
            <h1 className="mt-3 text-2xl font-bold text-slate-900">This page could not be loaded.</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">Refresh the page or return home and try again.</p>
            <div className="mt-6 flex justify-center gap-3">
              <button onClick={() => window.location.reload()} className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white">Refresh</button>
              <a href="/" className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700">Home</a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
