'use client';

import { useState, useEffect } from 'react';
import type { AlertThresholds, AlertThresholdUpdate } from '@/types/monitoring';

interface AlertThresholdEditorProps {
    thresholds: AlertThresholds;
    onSave: (data: AlertThresholdUpdate) => void;
    isSaving: boolean;
}

export default function AlertThresholdEditor({
    thresholds,
    onSave,
    isSaving,
}: AlertThresholdEditorProps) {
    const [bufferUtilization, setBufferUtilization] = useState(thresholds.bufferUtilization);
    const [crashCount, setCrashCount] = useState(thresholds.crashCount);
    const [revocationRate, setRevocationRate] = useState(thresholds.revocationRate);
    const [ipPoolUtilization, setIpPoolUtilization] = useState(thresholds.ipPoolUtilization);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setBufferUtilization(thresholds.bufferUtilization);
        setCrashCount(thresholds.crashCount);
        setRevocationRate(thresholds.revocationRate);
        setIpPoolUtilization(thresholds.ipPoolUtilization);
    }, [thresholds]);

    function handleSave() {
        onSave({
            bufferUtilization,
            crashCount,
            revocationRate,
            ipPoolUtilization,
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    }

    const fields = [
        {
            label: 'Buffer Utilization (%)',
            value: bufferUtilization,
            onChange: (v: number) => setBufferUtilization(v),
            min: 0,
            max: 100,
            step: 1,
        },
        {
            label: 'Crash Count',
            value: crashCount,
            onChange: (v: number) => setCrashCount(v),
            min: 0,
            max: 100,
            step: 1,
        },
        {
            label: 'Revocation Rate (%)',
            value: revocationRate,
            onChange: (v: number) => setRevocationRate(v),
            min: 0,
            max: 100,
            step: 1,
        },
        {
            label: 'IP Pool Utilization (%)',
            value: ipPoolUtilization,
            onChange: (v: number) => setIpPoolUtilization(v),
            min: 0,
            max: 100,
            step: 1,
        },
    ];

    return (
        <div className="rounded-lg border border-[#E8E6E1] bg-white p-5 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Alert Thresholds</h3>
                {thresholds.updatedAt && (
                    <span className="text-xs text-gray-400">
                        Last updated: {new Date(thresholds.updatedAt).toLocaleString()}
                    </span>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {fields.map((field) => (
                    <div key={field.label} className="space-y-1">
                        <label className="block text-xs font-medium text-gray-600">
                            {field.label}
                        </label>
                        <input
                            type="number"
                            value={field.value}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            min={field.min}
                            max={field.max}
                            step={field.step}
                            className="w-full rounded-md border border-[#E8E6E1] bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                ))}
            </div>

            <div className="flex items-center gap-3">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSaving ? 'Saving...' : 'Save Thresholds'}
                </button>
                {saved && (
                    <span className="text-sm text-green-600 font-medium">Saved</span>
                )}
            </div>
        </div>
    );
}
