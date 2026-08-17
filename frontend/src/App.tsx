import { useState } from 'react';
import { TOAST_DURATION_MS } from './config';
import './index.css';
import { useMidnight } from './hooks/useMidnight';
import { useIndexer } from './hooks/useIndexer';
import { useUserProfile } from './hooks/useUserProfile';
import { WalletConnect } from './components/WalletConnect';
import { DatasetExchange } from './components/DatasetExchange';
import { AppLogo } from './components/AppLogo';
import { AvatarIcon } from './components/AvatarIcon';
import {
  ShieldCheck,
  Compass,
  LayoutGrid,
  PlusCircle,
  CheckCircle2,
  ExternalLink,
  BookOpen,
  Menu,
  X
} from 'lucide-react';

export type NavSection = 'about' | 'marketplace' | 'register' | 'verifier' | 'profile';

function App() {
  const midnightHook = useMidnight();
  const indexer = useIndexer();
  const [activeSection, setActiveSection] = useState<NavSection>('about');
  const [toast, setToast] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), TOAST_DURATION_MS);
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
    setMobileMenuOpen(false);
  };

  // When wallet disconnects, leave the profile page gracefully.
  const handleDisconnect = () => {
    if (activeSection === 'profile') setActiveSection('about');
    midnightHook.disconnect();
  };

  const isConnected = midnightHook.walletState.status === 'connected';

  const navLinks: { id: NavSection; label: string; icon: React.ReactNode }[] = [
    { id: 'about', label: 'Overview', icon: <Compass size={15} /> },
    { id: 'marketplace', label: 'Marketplace', icon: <LayoutGrid size={15} /> },
    { id: 'register', label: 'Share Data', icon: <PlusCircle size={15} /> },
    { id: 'verifier', label: 'Verify Data', icon: <CheckCircle2 size={15} /> },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ── Top Navigation Bar ─────────────────────────────────────────── */}
      <header
        style={{
          borderBottom: '1px solid var(--border-glass)',
          background: 'rgba(6, 25, 44, 0.92)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 4px 24px rgba(4, 18, 32, 0.6)',
        }}
      >
        <div
          className="header-container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1.25rem',
            gap: '1rem',
          }}
        >
          {/* Main App Logo & Brand Identity */}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', flexShrink: 0 }}
            onClick={() => handleSelectSection('about')}
          >
            <AppLogo size={32} />
            <div>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: '1.15rem',
                  letterSpacing: '-0.02em',
                  fontFamily: 'Outfit, sans-serif',
                  color: 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <span>DataVault</span>
                <span
                  style={{
                    background: 'linear-gradient(135deg, #FAF0CA 0%, #F5E4A8 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: 900,
                  }}
                >
                  AI
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="header-nav-desktop">
            {navLinks.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleSelectSection(link.id)}
                  className="btn btn-ghost btn-sm"
                  style={{
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.84rem',
                    borderRadius: 'var(--radius-sm)',
                    background: isActive ? 'rgba(250, 240, 202, 0.15)' : 'transparent',
                    color: isActive ? '#FAF0CA' : 'var(--text-muted)',
                    border: isActive ? '1px solid rgba(250, 240, 202, 0.35)' : '1px solid transparent',
                    fontWeight: isActive ? 700 : 500,
                    backdropFilter: isActive ? 'blur(8px)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span style={{ opacity: isActive ? 1 : 0.75 }}>{link.icon}</span>
                  <span>{link.label}</span>
                </button>
              );
            })}

            {/* Profile button — visible when wallet is connected */}
            {isConnected && (
              <button
                onClick={() => handleSelectSection('profile')}
                className="btn btn-ghost btn-sm"
                style={{
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.84rem',
                  borderRadius: 'var(--radius-sm)',
                  background: activeSection === 'profile' ? 'rgba(250, 240, 202, 0.18)' : 'rgba(13, 59, 102, 0.45)',
                  color: activeSection === 'profile' ? '#FAF0CA' : 'var(--text-muted)',
                  border: activeSection === 'profile' ? '1px solid rgba(250, 240, 202, 0.4)' : '1px solid rgba(250, 240, 202, 0.15)',
                  fontWeight: activeSection === 'profile' ? 700 : 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  whiteSpace: 'nowrap',
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: 'rgba(250, 240, 202, 0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FAF0CA',
                  }}
                >
                  <AvatarIcon id={profileHook.profile.avatarId} size={11} />
                </div>
                <span>Profile</span>
              </button>
            )}
          </nav>

          {/* Right: Wallet & Mobile Menu Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0 }}>
            {/* Wallet Connect trigger */}
            <WalletConnect hook={{ ...midnightHook, disconnect: handleDisconnect }} />

            {/* Mobile Hamburger / X Toggle */}
            <button
              type="button"
              className="btn btn-secondary btn-sm header-nav-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              style={{ padding: '0.45rem 0.55rem', borderRadius: 'var(--radius-sm)' }}
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="header-mobile-drawer">
            {navLinks.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleSelectSection(link.id)}
                  className="btn btn-ghost"
                  style={{
                    justifyContent: 'flex-start',
                    padding: '0.65rem 1rem',
                    fontSize: '0.9rem',
                    borderRadius: 'var(--radius-sm)',
                    background: isActive ? 'rgba(250, 240, 202, 0.14)' : 'transparent',
                    color: isActive ? '#FAF0CA' : 'var(--text-muted)',
                    border: isActive ? '1px solid rgba(250, 240, 202, 0.3)' : '1px solid transparent',
                    fontWeight: isActive ? 700 : 500,
                  }}
                >
                  <span style={{ opacity: isActive ? 1 : 0.75 }}>{link.icon}</span>
                  <span>{link.label}</span>
                </button>
              );
            })}

            {isConnected && (
              <button
                onClick={() => handleSelectSection('profile')}
                className="btn btn-ghost"
                style={{
                  justifyContent: 'flex-start',
                  padding: '0.65rem 1rem',
                  fontSize: '0.9rem',
                  borderRadius: 'var(--radius-sm)',
                  background: activeSection === 'profile' ? 'rgba(250, 240, 202, 0.18)' : 'rgba(13, 59, 102, 0.45)',
                  color: activeSection === 'profile' ? '#FAF0CA' : 'var(--text-muted)',
                  border: activeSection === 'profile' ? '1px solid rgba(250, 240, 202, 0.4)' : '1px solid rgba(250, 240, 202, 0.15)',
                  fontWeight: activeSection === 'profile' ? 700 : 500,
                }}
              >
                <AvatarIcon id={profileHook.profile.avatarId} size={16} />
                <span>Profile</span>
              </button>
            )}
          </div>
        )}
      </header>

      {/* ── Main Application Section ───────────────────────────────────────── */}
      <main className="container" style={{ padding: '2.5rem 1.5rem 4rem', flex: 1 }}>
        <DatasetExchange
          walletApi={walletApi}
          walletState={midnightHook.walletState}
          onConnect={async (type) => {
            await midnightHook.connect(type);
          }}
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
            showToast('Datasets updated');
          }}
          onAddListing={(listing) => {
            indexer.addOptimisticListing(listing);
            showToast(`Dataset "${listing.datasetName}" published successfully!`);
          }}
          onToggleArchive={(datasetId) => {
            const ok = indexer.toggleArchiveListing(datasetId, walletAddress);
            if (ok) {
              showToast('Dataset status updated');
            } else {
              showToast('Unauthorized: Only the publishing wallet can archive this dataset');
            }
          }}
          onRemoveListing={(datasetId) => {
            const ok = indexer.removeListing(datasetId, walletAddress);
            if (ok) {
              showToast('Dataset removed from marketplace');
            } else {
              showToast('Unauthorized: Only the publishing wallet can remove this dataset');
            }
          }}
          onIncrementVerified={() => {
            indexer.incrementVerifiedCount();
            showToast('Dataset verified successfully!');
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
            background: 'rgba(10, 43, 74, 0.95)',
            border: '1px solid rgba(250, 240, 202, 0.4)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.85rem 1.25rem',
            color: '#FAF0CA',
            fontSize: '0.86rem',
            boxShadow: '0 12px 36px rgba(4, 18, 32, 0.8), 0 0 16px rgba(13, 59, 102, 0.6)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            backdropFilter: 'blur(16px)',
          }}
        >
          <ShieldCheck size={18} color="#34d399" />
          <span>{toast}</span>
        </div>
      )}

      {/* ── Footer (Glassmorphic) ──────────────────────────────────────────── */}
      <footer
        style={{
          borderTop: '1px solid var(--border-glass)',
          padding: '2rem 1.5rem',
          background: 'rgba(6, 25, 44, 0.92)',
          fontSize: '0.82rem',
          color: 'var(--text-subtle)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AppLogo size={22} />
            <span>
              DataVault AI · Safe & Private AI Dataset Exchange
            </span>
          </div>
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
            <a
              href="https://midnight.network"
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <span>Midnight Network</span>
              <ExternalLink size={12} />
            </a>
            <a
              href="https://docs.midnight.network"
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <span>Documentation</span>
              <BookOpen size={12} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
