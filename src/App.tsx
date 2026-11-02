import { useEffect } from 'react';
import { startRuntime } from './core/runtime';
import { useOffice } from './core/store';
import { Office } from './scene/Office';
import { TopBar } from './ui/TopBar';
import { SidePanel } from './ui/SidePanel';
import { Board } from './ui/Board';
import { ApprovalModal } from './ui/ApprovalModal';
import { ShareStudio } from './ui/ShareStudio';
import { Toasts } from './ui/Toasts';
import { Profile } from './ui/Profile';
import { ClipModal } from './ui/ClipModal';
import { PetCard } from './ui/PetCard';
import { DressingRoom } from './ui/DressingRoom';

export default function App() {
  const focus = useOffice((s) => s.settings.focus);

  useEffect(() => {
    startRuntime();
  }, []);

  return (
    <div className={`app ${focus ? 'focus' : ''}`}>
      <TopBar />
      <main className="main">
        <div className="scene-col">
          <Office />
          <p className="hint">Click the whiteboard, an agent, or your desk. Try “Make drama” to stir things up.</p>
          <Profile />
          <PetCard />
        </div>
        <SidePanel />
      </main>
      <Toasts />
      <Board />
      <ApprovalModal />
      <ShareStudio />
      <ClipModal />
      <DressingRoom />
    </div>
  );
}
