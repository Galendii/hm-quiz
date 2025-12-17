import { useState } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { MultiplayerProvider } from './context/MultiplayerContext';
import { Lobby } from './components/game/Lobby';
import { HostScreen } from './components/game/HostScreen';
import { PlayerScreen } from './components/game/PlayerScreen';
import './index.css';

const MainView = () => {
  const { isHost } = useGame();
  const [joined, setJoined] = useState(false);

  return (
    <>
      {!joined && <Lobby onJoin={() => setJoined(true)} />}
      {joined && isHost && <HostScreen />}
      {joined && !isHost && <PlayerScreen />}
    </>
  );
};

import { GatekeeperScreen } from './components/game/GatekeeperScreen';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('hm_access_token') === 'GRANTED';
  });

  const handleAccessGranted = () => {
    sessionStorage.setItem('hm_access_token', 'GRANTED');
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return <GatekeeperScreen onAccessGranted={handleAccessGranted} />;
  }

  return (
    <GameProvider>
      <MultiplayerProvider>
        <MainView />
      </MultiplayerProvider>
    </GameProvider>
  );
}

export default App;
