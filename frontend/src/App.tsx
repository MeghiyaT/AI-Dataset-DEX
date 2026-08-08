import { useState } from 'react';
import './index.css';
import { useMidnight } from './hooks/useMidnight';
import { useIndexer } from './hooks/useIndexer';
import { WalletConnect } from './components/WalletConnect';
import { DatasetExchange } from './components/DatasetExchange';

export type NavSection = 'about' | 'marketplace' | 'register' | 'verifier' | 'network';

function App() {
  const midnightHook = useMidnight();
  const indexer = useIndexer();
  const [activeSection, setActiveSection] = useState<NavSection>('about'); // Default is About section!
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const walletApi =
    midnightHook.walletState.status === 'connected'
      ? midnightHook.walletState.api
      : null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ── Top Navigation Bar (Midnight.network aesthetic) ───────────────── */}
      <header
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(6, 7, 11, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
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
          {/* Brand Logo & Name */}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
            onClick={() => setActiveSection('about')}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'var(--gradient-midnight)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)',
              }}
            >
              🛡️
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em', fontFamily: 'Outfit, sans-serif' }}>
                DataVault <span className="gradient-text">DEX</span>
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '-2px' }}>
                Zero-Knowledge AI Data on Midnight
              </div>
            </div>
          </div>

          {/* Navigation Links: About (Home), Marketplace, Register, Verifier, Network */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            {[
              { id: 'about', label: 'About & Vision' },
              { id: 'marketplace', label: 'Marketplace' },
              { id: 'register', label: 'Register Dataset' },
              { id: 'verifier', label: 'ZK Verifier' },
              { id: 'network', label: 'Network' },
            ].map((link) => (
              <button
                key={link.id}
                onClick={() => setActiveSection(link.id as NavSection)}
                className={`btn btn-ghost btn-sm`}
                style={{
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: activeSection === link.id ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                  color: activeSection === link.id ? '#ffffff' : 'var(--text-secondary)',
                  border: activeSection === link.id ? '1px solid rgba(139, 92, 246, 0.35)' : '1px solid transparent',
                  fontWeight: activeSection === link.id ? 700 : 500,
                }}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right: Network Indicator & Universal Wallet Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
              <span className="pulse-dot" /> Preview
            </span>
            <WalletConnect hook={midnightHook} />
          </div>
        </div>
      </header>

      {/* ── Main Dynamic Application View ─────────────────────────────────── */}
      <main className="container" style={{ padding: '2rem 1.5rem 4rem', flex: 1 }}>
        <DatasetExchange
          walletApi={walletApi}
          activeSection={activeSection}
          onSelectSection={(sec) => setActiveSection(sec)}
          registryState={indexer.state}
          indexerLoading={indexer.loading}
          indexerError={indexer.error}
          contractConfigured={indexer.contractConfigured}
          contractAddress={indexer.contractAddress}
          onRefresh={() => {
            indexer.refresh();
            showToast('✓ Synchronized with Midnight Preview GraphQL Indexer');
          }}
          onAddListing={(listing) => {
            indexer.addOptimisticListing(listing);
            showToast(`✓ Dataset "${listing.datasetName}" registered on Midnight Preview!`);
          }}
          onIncrementVerified={() => {
            indexer.incrementVerifiedCount();
            showToast('✓ Cryptographic integrity proof verified on Midnight Preview!');
          }}
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

      {/* ── Clean Midnight Footer ──────────────────────────────────────────── */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '2rem 1.5rem',
          background: '#040508',
          fontSize: '0.82rem',
          color: 'var(--text-muted)',
        }}
      >
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            DataVault Exchange · Built with <strong>Compact Smart Contracts</strong> on Midnight Network
          </div>
          <div style={{ display: 'flex', gap: '1.25rem' }}>
            <a href="https://midnight.network" target="_blank" rel="noreferrer" style={{ color: 'var(--midnight-violet-light)', textDecoration: 'none' }}>
              Midnight Network ↗
            </a>
            <a href="https://docs.midnight.network" target="_blank" rel="noreferrer" style={{ color: 'var(--midnight-cyan-light)', textDecoration: 'none' }}>
              Compact Docs ↗
            </a>
            <a href="https://midnight-tmnight-preview.nethermind.dev" target="_blank" rel="noreferrer" style={{ color: 'var(--midnight-emerald-light)', textDecoration: 'none' }}>
              Preview Faucet ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
