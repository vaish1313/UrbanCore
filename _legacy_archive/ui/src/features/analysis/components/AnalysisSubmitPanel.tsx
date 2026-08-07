/**
 * AnalysisSubmitPanel — AOI selection and job submission
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsApi } from '@shared/api/client';
import styles from './AnalysisSubmitPanel.module.css';

interface Props {
  onClose: () => void;
  onJobCreated: (jobId: string) => void;
}

const EPOCH_OPTIONS = [
  '2020-Q1', '2020-Q3',
  '2021-Q1', '2021-Q3',
  '2022-Q1', '2022-Q3',
  '2023-Q1', '2023-Q3',
  '2024-Q1', '2024-Q3',
  '2025-Q1',
];

// Demo AOI — Bangalore Central Business District
const DEMO_AOI = {
  type: 'Polygon' as const,
  coordinates: [[
    [77.5700, 12.9700],
    [77.6000, 12.9700],
    [77.6000, 12.9900],
    [77.5700, 12.9900],
    [77.5700, 12.9700],
  ]],
};

export function AnalysisSubmitPanel({ onClose, onJobCreated }: Props) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [selectedEpochs, setSelectedEpochs] = useState<string[]>(['2022-Q1', '2024-Q1']);

  const { mutate, isPending, error } = useMutation({
    mutationFn: () =>
      jobsApi.create({
        name,
        aoi: DEMO_AOI,
        epochs: selectedEpochs,
        description: 'Urban change analysis',
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      onJobCreated(res.data.job.id);
    },
  });

  const toggleEpoch = (epoch: string) => {
    setSelectedEpochs((prev) =>
      prev.includes(epoch) ? prev.filter((e) => e !== epoch) : [...prev, epoch].slice(-5),
    );
  };

  return (
    <div id="analysis-submit-panel" className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.title}>New Analysis</h3>
        <button id="btn-close-submit" className={styles.closeBtn} onClick={onClose}>×</button>
      </div>

      <div className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="analysis-name" className={styles.label}>Analysis Name</label>
          <input
            id="analysis-name"
            type="text"
            className={styles.input}
            placeholder="e.g. Bangalore CBD 2022-2024"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>
            Select Epochs <span className={styles.hint}>(up to 5)</span>
          </label>
          <div className={styles.epochGrid}>
            {EPOCH_OPTIONS.map((epoch) => (
              <button
                key={epoch}
                id={`epoch-${epoch}`}
                className={`${styles.epochBtn} ${selectedEpochs.includes(epoch) ? styles.selected : ''}`}
                onClick={() => toggleEpoch(epoch)}
              >
                {epoch}
              </button>
            ))}
          </div>
          <p className={styles.hint}>{selectedEpochs.length} selected</p>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Area of Interest</label>
          <div className={styles.aoiInfo}>
            <span>📍 Bangalore CBD (demo AOI)</span>
            <span className={styles.aoiArea}>~9 km²</span>
          </div>
          <p className={styles.hint}>AOI drawing tool coming soon. Using demo area.</p>
        </div>

        {error && (
          <div className={styles.errorMsg}>
            Failed to submit. Please try again.
          </div>
        )}

        <button
          id="btn-submit-analysis"
          className={styles.submitBtn}
          disabled={!name || selectedEpochs.length < 1 || isPending}
          onClick={() => mutate()}
        >
          {isPending ? 'Submitting...' : '🚀 Start Analysis'}
        </button>
      </div>
    </div>
  );
}
