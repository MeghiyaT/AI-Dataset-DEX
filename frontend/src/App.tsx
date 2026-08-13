import { useState } from 'react';
import './index.css';
import { useMidnight } from './hooks/useMidnight';
import { useIndexer } from './hooks/useIndexer';
import { useUserProfile } from './hooks/useUserProfile';
import { WalletConnect } from './components/WalletConnect';
import { DatasetExchange } from './components/DatasetExchange';

export type NavSection = 'about' | 'marketplace' | 'register' | 'verifier' | 'profile';

function App() {
  const midnightHook = useMidnight();
  const indexer = useIndexer();
  const [activeSection, setActiveSection] = useState<NavSection>('about');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const walletApi =
    midnightHook.walletState.status === 'connected'
      ? midnightHook.walletState.api
      : null;

  const walletAddress =
    midnightHook.walletState.status === 'connected'
      ? midnightHook.walletState.address
      : null;

  const profileHook = useUserProfile(walletAddress);

  // If the wallet disconnects while on the profile page, redirect to home.
  const handleSelectSection = (sec: NavSection) => {
    if (sec === 'profile' && !walletAddress) return;
    setActiveSection(sec);
  };

  // When wallet disconnects, leave the profile page gracefully.
  const handleDisconnect = () => {
    if (activeSection === 'profile') setActiveSection('about');
    midnightHook.disconnect();
  };

  const isConnected = midnightHook.walletState.status === 'connected';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ── Top Navigation Bar ─────────────────────────────────────────────── */}
      <header
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(6, 7, 11, 0.95)',
          backdropFilter: 'blur(20px)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1.5rem',
            gap: '1rem',
          }}
        >
          {/* Logo & Brand */}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
            onClick={() => setActiveSection('about')}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'var(--gradient-main)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                boxShadow: '0 0 16px rgba(139, 92, 246, 0.4)',
              }}
            >
              🛡️
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em', fontFamily: 'Outfit, sans-serif' }}>
                DataVault <span className="text-gradient">AI</span>
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '-2px' }}>
                Private AI Dataset Sharing on Midnight
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            {[
              { id: 'about', label: 'About & How It Works' },
              { id: 'marketplace', label: 'Explore Datasets' },
              { id: 'register', label: 'Register a Dataset' },
              { id: 'verifier', label: 'Verify Authenticity' },
            ].map((link) => (
              <button
                key={link.id}
                onClick={() => handleSelectSection(link.id as NavSection)}
                className="btn btn-ghost btn-sm"
                style={{
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: activeSection === link.id ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                  color: activeSection === link.id ? '#ffffff' : 'var(--text-muted)',
                  border: activeSection === link.id ? '1px solid rgba(139, 92, 246, 0.35)' : '1px solid transparent',
                  fontWeight: activeSection === link.id ? 700 : 500,
                }}
              >
                {link.label}
              </button>
            ))}

            {/* Profile button — only visible when a wallet is connected */}
            {isConnected && (
              <button
                onClick={() => handleSelectSection('profile')}
                className="btn btn-ghost btn-sm"
                style={{
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: activeSection === 'profile' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                  color: activeSection === 'profile' ? '#ffffff' : 'var(--text-muted)',
                  border: activeSection === 'profile' ? '1px solid rgba(139, 92, 246, 0.35)' : '1px solid transparent',
                  fontWeight: activeSection === 'profile' ? 700 : 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <span>{profileHook.profile.avatarEmoji}</span>
                <span>My Profile</span>
              </button>
            )}
          </nav>

          {/* Right: Network Badge & Wallet */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span
              className={`badge ${midnightHook.walletState.status === 'connected' && midnightHook.walletState.network === 'preview' ? 'badge-cyan' : 'badge-purple'}`}
              style={{ fontSize: '0.7rem' }}
            >
              <span className="pulse-dot" />{' '}
              {midnightHook.walletState.status === 'connected'
                ? midnightHook.walletState.network.charAt(0).toUpperCase() + midnightHook.walletState.network.slice(1)
                : midnightHook.targetNetwork
                ? midnightHook.targetNetwork.charAt(0).toUpperCase() + midnightHook.targetNetwork.slice(1)
                : 'Preprod'}
            </span>
            {/* Pass custom disconnect handler to gracefully exit profile page */}
            <WalletConnect hook={{ ...midnightHook, disconnect: handleDisconnect }} />
          </div>
        </div>
      </header>

      {/* ── Main Application Section ───────────────────────────────────────── */}
      <main className="container" style={{ padding: '2.5rem 1.5rem 4rem', flex: 1 }}>
        <DatasetExchange
          walletApi={walletApi}
          walletState={midnightHook.walletState}
          onConnect={midnightHook.connect}
          activeSection={activeSection}
          onSelectSection={handleSelectSection}
          registryState={indexer.state}
          indexerLoading={indexer.loading}
          indexerError={indexer.error}
          contractAddress={indexer.contractAddress}
          walletAddress={walletAddress}
          profileHook={profileHook}
          onRefresh={() => {
            indexer.refresh();
            showToast('✓ Synchronized with Midnight blockchain');
          }}
          onAddListing={(listing) => {
            indexer.addOptimisticListing(listing);
            showToast(`✓ Dataset "${listing.datasetName}" registered successfully!`);
          }}
          onToggleArchive={(datasetId) => {
            indexer.toggleArchiveListing(datasetId);
            showToast('✓ Dataset archive status updated');
          }}
          onRemoveListing={(datasetId) => {
            indexer.removeListing(datasetId);
            showToast('✓ Dataset removed from marketplace');
          }}
          onIncrementVerified={() => {
            indexer.incrementVerifiedCount();
            showToast('✓ Authenticity proof verified and recorded on blockchain!');
          }}
          laceIcon={midnightHook.laceIcon}
          oneAmIcon={midnightHook.oneAmIcon}
        />
      </main>

      {/* ── Toast Notification ────────────────────────────────────────────── */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            background: 'rgba(14, 17, 28, 0.95)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.85rem 1.25rem',
            color: '#fff',
            fontSize: '0.86rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
          }}
        >
          <span>🛡️</span>
          <span>{toast}</span>
        </div>
      )}

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '2rem 1.5rem',
          background: '#040508',
          fontSize: '0.82rem',
          color: 'var(--text-subtle)',
        }}
      >
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            DataVault · Privacy-Preserving AI Dataset Sharing on <strong>Midnight Network</strong>
          </div>
          <div style={{ display: 'flex', gap: '1.25rem' }}>
            <a href="https://midnight.network" target="_blank" rel="noreferrer" style={{ color: 'var(--primary-light)', textDecoration: 'none' }}>
              Midnight Website ↗
            </a>
            <a href="https://docs.midnight.network" target="_blank" rel="noreferrer" style={{ color: 'var(--cyan-light)', textDecoration: 'none' }}>
              Documentation ↗
            </a>
            <a href="https://midnight-tmnight-preprod.nethermind.dev/" target="_blank" rel="noreferrer" style={{ color: 'var(--emerald-light)', textDecoration: 'none' }}>
              Preprod Faucet (tNIGHT) ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
