import React from "react";

export function createErrorBoundary(component, errorHandler) {
    return class extends React.Component {
        state = {
            error: undefined,
        };

        static getDerivedStateFromError(error) {
            return { error };
        }

        componentDidCatch(error, info) {
            if (errorHandler) {
                errorHandler(error, info);
            }
        }

        render() {
            return component(this.props, this.state.error);
        }
    };
}
