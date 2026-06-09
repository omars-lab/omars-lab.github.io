import React from 'react';
import Layout from '@theme/Layout';
import BinaryPyramid from '@site/src/components/BinaryPyramid';

// TEMP preview page for the inscribed-PURPOSE logo exploration.
// Remove before any PR. Route: /logo-preview
const box: React.CSSProperties = {
  padding: '2rem',
  margin: '1rem 0',
  border: '1px solid var(--ifm-color-emphasis-300)',
  borderRadius: 8,
};
const label: React.CSSProperties = {fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.75rem'};

export default function LogoPreview(): JSX.Element {
  return (
    <Layout title="Logo preview" description="Inscribed PURPOSE logo preview">
      <main className="container margin-vert--lg">
        <h1>Inscribed PURPOSE logo preview</h1>
        <p>Live (client-side) render. Toggle light/dark in the navbar to test theme.</p>

        <div style={box}>
          <div style={label}>BYTE-CHAINED PURPOSE: Ionic, colUnits 3.0, 5 byte-lanes (hero)</div>
          <BinaryPyramid config={{arrange: 'inscribe', letters: 'PURPOSE', pillar: 'ionic', volute: 'spiral', colUnits: 3.0, shaftZeros: true, shaftLanes: 5}} height={140} />
        </div>

        <div style={box}>
          <div style={label}>Same, 4 byte-lanes (looser weave)</div>
          <BinaryPyramid config={{arrange: 'inscribe', letters: 'PURPOSE', pillar: 'ionic', volute: 'spiral', colUnits: 3.0, shaftZeros: true, shaftLanes: 4}} height={140} />
        </div>

        <div style={box}>
          <div style={label}>Byte-chained, small (approx 64px) legibility check</div>
          <BinaryPyramid config={{arrange: 'inscribe', letters: 'PURPOSE', pillar: 'ionic', volute: 'spiral', colUnits: 3.0, shaftZeros: true, shaftLanes: 5}} height={64} />
        </div>

        <div style={box}>
          <div style={label}>Navbar reduction candidates (approx 32px): single P / BoP / Ionic P</div>
          <span style={{display: 'inline-flex', gap: 24, alignItems: 'flex-end'}}>
            <BinaryPyramid config={{arrange: 'inscribe', letters: 'P', pillar: 'doric'}} height={32} />
            <BinaryPyramid config={{arrange: 'inscribe', letters: 'BOP', pillar: 'doric'}} height={32} />
            <BinaryPyramid config={{arrange: 'inscribe', letters: 'P', pillar: 'ionic', volute: 'spiral'}} height={32} />
          </span>
        </div>
      </main>
    </Layout>
  );
}
