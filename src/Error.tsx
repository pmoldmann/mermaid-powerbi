import * as React from "react";
import { useLocalize } from './useLocalize';

const ErrorDisplay: React.FC<{ error: unknown }> = ({ error }) => {
    const title = useLocalize('UI_ErrorTitle', 'Something went wrong.');
    return (
        <>
            <h1>{title}</h1>
            <div>{String(error)}</div>
        </>
    );
};

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
        return <ErrorDisplay error={this.state.error} />;
      }
  
      return this.props.children; 
    }
  }