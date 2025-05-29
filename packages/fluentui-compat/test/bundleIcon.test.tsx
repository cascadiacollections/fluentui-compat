import React, { useState } from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { FluentIcon } from '@fluentui/react-icons';
import { bundleIcon } from '../src';

// Mock FluentIcon components with render tracking
let filledRenderCount = 0;
let regularRenderCount = 0;

const MockFilledIcon: FluentIcon = jest.fn((props) => {
  filledRenderCount++;
  return React.createElement('svg', { 
    ...props, 
    'data-testid': 'filled-icon',
    'data-render-count': filledRenderCount
  });
});

const MockRegularIcon: FluentIcon = jest.fn((props) => {
  regularRenderCount++;
  return React.createElement('svg', { 
    ...props, 
    'data-testid': 'regular-icon',
    'data-render-count': regularRenderCount
  });
});

// Reset counters before each test
beforeEach(() => {
  filledRenderCount = 0;
  regularRenderCount = 0;
  jest.clearAllMocks();
});

// Create a bundled icon
const TestIcon = bundleIcon(MockFilledIcon, MockRegularIcon);

describe('bundleIcon', () => {
  test('should create a component with correct displayName', () => {
    expect(TestIcon.displayName).toBe('CompoundIcon');
  });

  test('should be a function component', () => {
    expect(typeof TestIcon).toBe('object');
    expect(TestIcon.$$typeof).toBe(Symbol.for('react.memo'));
  });

  test('should render filled icon when filled=true', () => {
    render(<TestIcon filled={true} />);
    expect(screen.getByTestId('filled-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('regular-icon')).not.toBeInTheDocument();
  });

  test('should render regular icon when filled=false', () => {
    render(<TestIcon filled={false} />);
    expect(screen.getByTestId('regular-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('filled-icon')).not.toBeInTheDocument();
  });

  test('should render regular icon when filled is undefined', () => {
    render(<TestIcon />);
    expect(screen.getByTestId('regular-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('filled-icon')).not.toBeInTheDocument();
  });
});

describe('bundleIcon re-render prevention', () => {
  test('should prevent unnecessary re-renders when props remain the same', () => {
    const TestComponent = () => {
      const [, forceUpdate] = useState({});
      
      return (
        <div>
          <TestIcon filled={true} className="test-class" />
          <button 
            data-testid="force-update"
            onClick={() => forceUpdate({})}
          >
            Force Update
          </button>
        </div>
      );
    };

    render(<TestComponent />);
    
    // Initial render should happen
    expect(MockFilledIcon).toHaveBeenCalledTimes(1);
    expect(filledRenderCount).toBe(1);
    
    // Force parent re-render but props stay the same
    fireEvent.click(screen.getByTestId('force-update'));
    
    // Icon should NOT re-render due to React.memo
    expect(MockFilledIcon).toHaveBeenCalledTimes(1);
    expect(filledRenderCount).toBe(1);
  });

  test('should re-render when filled prop changes', () => {
    const TestComponent = () => {
      const [filled, setFilled] = useState(false);
      
      return (
        <div>
          <TestIcon filled={filled} />
          <button 
            data-testid="toggle-filled"
            onClick={() => setFilled(!filled)}
          >
            Toggle Filled
          </button>
        </div>
      );
    };

    render(<TestComponent />);
    
    // Initial render with regular icon
    expect(MockRegularIcon).toHaveBeenCalledTimes(1);
    expect(regularRenderCount).toBe(1);
    
    // Toggle to filled
    fireEvent.click(screen.getByTestId('toggle-filled'));
    
    // Should now render filled icon
    expect(MockFilledIcon).toHaveBeenCalledTimes(1);
    expect(filledRenderCount).toBe(1);
    
    // Toggle back to regular
    fireEvent.click(screen.getByTestId('toggle-filled'));
    
    // Should render regular icon again
    expect(MockRegularIcon).toHaveBeenCalledTimes(2);
    expect(regularRenderCount).toBe(2);
  });

  test('should re-render when other props change', () => {
    const TestComponent = () => {
      const [className, setClassName] = useState('initial-class');
      
      return (
        <div>
          <TestIcon filled={true} className={className} />
          <button 
            data-testid="change-class"
            onClick={() => setClassName('changed-class')}
          >
            Change Class
          </button>
        </div>
      );
    };

    render(<TestComponent />);
    
    // Initial render
    expect(MockFilledIcon).toHaveBeenCalledTimes(1);
    expect(filledRenderCount).toBe(1);
    
    // Change className prop
    fireEvent.click(screen.getByTestId('change-class'));
    
    // Should re-render due to prop change
    expect(MockFilledIcon).toHaveBeenCalledTimes(2);
    expect(filledRenderCount).toBe(2);
  });

  test('should prevent re-renders when unrelated parent state changes', () => {
    const TestComponent = () => {
      const [unrelatedState, setUnrelatedState] = useState(0);
      
      return (
        <div>
          <TestIcon filled={true} className="constant-class" />
          <div data-testid="unrelated-state">{unrelatedState}</div>
          <button 
            data-testid="change-unrelated"
            onClick={() => setUnrelatedState(unrelatedState + 1)}
          >
            Change Unrelated State
          </button>
        </div>
      );
    };

    render(<TestComponent />);
    
    // Initial render
    expect(MockFilledIcon).toHaveBeenCalledTimes(1);
    expect(filledRenderCount).toBe(1);
    
    // Change unrelated state multiple times
    fireEvent.click(screen.getByTestId('change-unrelated'));
    fireEvent.click(screen.getByTestId('change-unrelated'));
    fireEvent.click(screen.getByTestId('change-unrelated'));
    
    // Icon should NOT re-render despite parent re-renders
    expect(MockFilledIcon).toHaveBeenCalledTimes(1);
    expect(filledRenderCount).toBe(1);
    
    // Verify the parent component actually re-rendered
    expect(screen.getByTestId('unrelated-state')).toHaveTextContent('3');
  });

  test('should apply correct CSS classes', () => {
    const { rerender } = render(<TestIcon filled={true} className="custom-class" />);
    
    const filledIcon = screen.getByTestId('filled-icon');
    expect(filledIcon).toHaveClass('fui-Icon--filled');
    expect(filledIcon).toHaveClass('custom-class');
    
    rerender(<TestIcon filled={false} className="custom-class" />);
    
    const regularIcon = screen.getByTestId('regular-icon');
    expect(regularIcon).toHaveClass('fui-Icon--regular');
    expect(regularIcon).toHaveClass('custom-class');
  });

  test('should maintain memo optimization with multiple instances', () => {
    const TestComponent = () => {
      const [triggerUpdate, setTriggerUpdate] = useState(0);
      
      return (
        <div>
          <TestIcon filled={true} className="icon-1" />
          <TestIcon filled={false} className="icon-2" />
          <div data-testid="trigger-count">{triggerUpdate}</div>
          <button 
            data-testid="trigger-update"
            onClick={() => setTriggerUpdate(triggerUpdate + 1)}
          >
            Trigger Update
          </button>
        </div>
      );
    };

    render(<TestComponent />);
    
    // Initial renders
    expect(MockFilledIcon).toHaveBeenCalledTimes(1);
    expect(MockRegularIcon).toHaveBeenCalledTimes(1);
    expect(filledRenderCount).toBe(1);
    expect(regularRenderCount).toBe(1);
    
    // Trigger parent update
    fireEvent.click(screen.getByTestId('trigger-update'));
    
    // Neither icon should re-render
    expect(MockFilledIcon).toHaveBeenCalledTimes(1);
    expect(MockRegularIcon).toHaveBeenCalledTimes(1);
    expect(filledRenderCount).toBe(1);
    expect(regularRenderCount).toBe(1);
    
    // Verify parent actually updated
    expect(screen.getByTestId('trigger-count')).toHaveTextContent('1');
  });
});

// Export for potential manual testing
export { TestIcon, MockFilledIcon, MockRegularIcon };