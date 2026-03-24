import { useState, useEffect } from 'react';
import ControlRoom from './ControlRoom';
import InitializationScreen from './components/InitializationScreen';

const INIT_SCREEN_KEY = 'warroom_init_shown';

function App() {
  const [showInitScreen, setShowInitScreen] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const hasSeenInit = sessionStorage.getItem(INIT_SCREEN_KEY);
    if (hasSeenInit) {
      setShowInitScreen(false);
      setIsReady(true);
    } else {
      setIsReady(true);
    }
  }, []);

  const handleInitComplete = () => {
    sessionStorage.setItem(INIT_SCREEN_KEY, 'true');
    setShowInitScreen(false);
  };

  if (!isReady) {
    return null;
  }

  if (showInitScreen) {
    return <InitializationScreen onComplete={handleInitComplete} />;
  }

  return <ControlRoom />;
}

export default App;
