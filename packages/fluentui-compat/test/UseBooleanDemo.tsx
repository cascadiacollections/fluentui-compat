import React from 'react';
import { useBoolean } from '../../src/useBoolean';

/**
 * Example component demonstrating the optimized useBoolean hook
 */
export function UseBooleanDemo() {
  const [isVisible, { setTrue: show, setFalse: hide, toggle }] = useBoolean(false);
  const [isEnabled, enableActions] = useBoolean(true);
  const [isDarkMode, darkModeActions] = useBoolean(false);

  return (
    <div>
      <h2>useBoolean Hook Demo</h2>
      
      <div>
        <h3>Visibility Control</h3>
        <p>Content is: {isVisible ? 'visible' : 'hidden'}</p>
        <button onClick={show}>Show</button>
        <button onClick={hide}>Hide</button>
        <button onClick={toggle}>Toggle</button>
        {isVisible && <div style={{ background: 'lightblue', padding: '10px' }}>This content is visible!</div>}
      </div>

      <div>
        <h3>Feature Toggles</h3>
        <label>
          <input 
            type="checkbox" 
            checked={isEnabled} 
            onChange={enableActions.toggle}
          />
          Feature Enabled
        </label>
        <br />
        <label>
          <input 
            type="checkbox" 
            checked={isDarkMode} 
            onChange={darkModeActions.toggle}
          />
          Dark Mode
        </label>
      </div>

      <div>
        <h3>Current State</h3>
        <pre>
          {JSON.stringify({
            isVisible,
            isEnabled,
            isDarkMode
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
}