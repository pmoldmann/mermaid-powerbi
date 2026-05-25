import * as React from "react";

export interface ErrorBoundaryState {
    hasError: boolean;
    error: unknown;
}

export type ErrorBoundaryProps = React.PropsWithChildren;

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
      super(props);
      this.state = { hasError: false, error: null };
    }
  
    static getDerivedStateFromError(error: unknown) {
      // Update state so the next render will show the fallback UI.
      return { hasError: true, error };
    }
  
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      // Intentionally not logged to avoid polluting the browser console in production
      void error;
      void errorInfo;
    }
  
    render() {
      if (this.state.hasError) {
        return (
            <>
                <h1>Something went wrong.</h1>
                <div>
                    {String(this.state.error)}
                </div>
            </>
        );
      }
  
      return this.props.children; 
    }
  }