/**
 * LayerControlPanel — Toggle map layers
 */

import styles from './LayerControlPanel.module.css';

interface Props {
  onToggleFootprints: () => void;
  onToggleZones: () => void;
  onToggleTerrain: () => void;
}

const LAYERS = [
  { key: 'footprints', label: 'Footprints', icon: '🏗️', color: '#3b82f6' },
  { key: 'zones', label: 'Zones', icon: '🗺️', color: '#ef4444' },
  { key: 'terrain', label: 'Terrain', icon: '⛰️', color: '#10b981' },
  { key: 'changes', label: 'Changes', icon: '🔄', color: '#f59e0b' },
];

export function LayerControlPanel({ onToggleFootprints, onToggleZones, onToggleTerrain }: Props) {
  return (
    <div id="layer-control-panel" className={styles.panel}>
      <div className={styles.title}>Layers</div>
      {LAYERS.map((layer) => (
        <button
          key={layer.key}
          id={`layer-toggle-${layer.key}`}
          className={styles.layerBtn}
          onClick={
            layer.key === 'footprints'
              ? onToggleFootprints
              : layer.key === 'zones'
              ? onToggleZones
              : onToggleTerrain
          }
          title={layer.label}
        >
          <span className={styles.layerIcon}>{layer.icon}</span>
          <span className={styles.layerLabel}>{layer.label}</span>
        </button>
      ))}
    </div>
  );
}
