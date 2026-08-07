/**
 * JobProgressPanel — Real-time job progress display
 *
 * Subscribes to the job's WebSocket channel and renders:
 * - Progress bar
 * - Stage-by-stage pipeline steps
 * - Completion/error states
 */

import { useState } from 'react';
import { useJobWebSocket, type JobEvent } from '@shared/hooks/useJobWebSocket';
import styles from './JobProgressPanel.module.css';
import { clsx } from 'clsx';

interface Props {
  jobId: string;
  onClose: () => void;
}

interface PipelineStage {
  key: string;
  label: string;
  status: 'pending' | 'active' | 'done' | 'error';
}

const PIPELINE_STAGES: Array<{ key: string; label: string }> = [
  { key: 'imagery_fetch', label: 'Fetching Sentinel-2 Imagery' },
  { key: 'preprocessing', label: 'Preprocessing Multispectral Bands' },
  { key: 'unet_inference', label: 'U-Net Building Detection' },
  { key: 'sam_refinement', label: 'SAM Boundary Refinement' },
  { key: 'change_detection', label: 'Multi-epoch Change Detection' },
  { key: 'terrain_analysis', label: 'DEM Terrain Analysis' },
  { key: 'compliance_check', label: 'Zoning Compliance Verification' },
  { key: 'report_generation', label: 'AI Report Generation' },
];

export function JobProgressPanel({ jobId, onClose }: Props) {
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const [message, setMessage] = useState('Connecting...');
  const [isComplete, setIsComplete] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const stages: PipelineStage[] = PIPELINE_STAGES.map((s) => ({
    ...s,
    status:
      s.key === currentStage
        ? 'active'
        : progress >= getStageProgress(s.key)
        ? 'done'
        : 'pending',
  }));

  useJobWebSocket({
    jobId,
    onConnected: () => setIsConnected(true),
    onDisconnected: () => setIsConnected(false),
    onEvent: (event: JobEvent) => {
      switch (event.event_type) {
        case 'job.progress':
          setProgress((event.payload.progress as number) ?? 0);
          setMessage((event.payload.message as string) ?? '');
          setCurrentStage((event.payload.stage as string) ?? '');
          break;
        case 'job.completed':
          setProgress(100);
          setIsComplete(true);
          setMessage('Analysis complete!');
          break;
        case 'job.failed':
          setIsError(true);
          setMessage((event.payload.error as string) ?? 'An error occurred.');
          break;
      }
    },
  });

  return (
    <div id="job-progress-panel" className={styles.panel}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={clsx(styles.statusDot, isConnected && styles.connected)} />
          <span className={styles.title}>Analysis Running</span>
        </div>
        <button id="btn-close-progress" className={styles.closeBtn} onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>

      {/* Progress Bar */}
      <div className={styles.progressBar}>
        <div
          className={clsx(
            styles.progressFill,
            isComplete && styles.complete,
            isError && styles.error,
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className={styles.progressLabel}>
        <span>{message}</span>
        <span className={styles.progressPct}>{progress}%</span>
      </div>

      {/* Pipeline Stages */}
      <div className={styles.stages}>
        {stages.map((stage) => (
          <div key={stage.key} className={clsx(styles.stage, styles[stage.status])}>
            <div className={styles.stageIcon}>
              {stage.status === 'done' && '✓'}
              {stage.status === 'active' && <span className="animate-spin">◌</span>}
              {stage.status === 'pending' && '○'}
              {stage.status === 'error' && '✗'}
            </div>
            <span className={styles.stageLabel}>{stage.label}</span>
          </div>
        ))}
      </div>

      {/* Completion Actions */}
      {isComplete && (
        <div className={styles.actions}>
          <a href={`/analysis/${jobId}`} className={styles.viewResultsBtn} id="btn-view-results">
            View Results →
          </a>
        </div>
      )}
    </div>
  );
}

function getStageProgress(stageKey: string): number {
  const idx = PIPELINE_STAGES.findIndex((s) => s.key === stageKey);
  return Math.round(((idx + 1) / PIPELINE_STAGES.length) * 100);
}
