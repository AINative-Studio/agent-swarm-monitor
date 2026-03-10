'use client';

import { useState } from 'react';
import { X, Download, Loader2, CheckCircle2, AlertCircle, Terminal } from 'lucide-react';

interface SkillInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  skillName: string;
  onSuccess?: () => void;
}

export default function SkillInstallModal({
  isOpen,
  onClose,
  skillName,
  onSuccess,
}: SkillInstallModalProps) {
  const [isInstalling, setIsInstalling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const handleInstall = async () => {
    setIsInstalling(true);
    setError(null);
    setLogs([`Installing ${skillName}...`]);

    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/skills/${skillName}/install`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Installation failed');
      }

      const result = await response.json();

      if (result.success) {
        setLogs(prev => [...prev, ...result.logs, '✓ Installation complete!']);
        setSuccess(true);
        setTimeout(() => {
          onSuccess?.();
          handleClose();
        }, 2000);
      } else {
        throw new Error(result.message || 'Installation failed');
      }
    } catch (err) {
      console.error('Failed to install skill:', err);
      const errorMsg = err instanceof Error ? err.message : 'Installation failed';
      setError(errorMsg);
      setLogs(prev => [...prev, `✗ Error: ${errorMsg}`]);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setSuccess(false);
    setLogs([]);
    setIsInstalling(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!isInstalling ? handleClose : undefined}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Install {skillName}
            </h2>
          </div>
          {!isInstalling && (
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {success ? (
          // Success state
          <div className="flex flex-col items-center justify-center py-8">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Installation Complete
            </h3>
            <p className="text-sm text-gray-500 text-center">
              {skillName} has been successfully installed and is now ready to use.
            </p>
          </div>
        ) : (
          <>
            {/* Description */}
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                This will install the CLI tool required for <strong>{skillName}</strong>.
                The installation may take 5-10 seconds.
              </p>
            </div>

            {/* Installation logs */}
            {logs.length > 0 && (
              <div className="mb-4 p-3 bg-gray-900 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Terminal className="h-4 w-4 text-green-400" />
                  <span className="text-xs font-medium text-green-400">Installation Log</span>
                </div>
                <div className="font-mono text-xs text-gray-300 space-y-1 max-h-40 overflow-y-auto">
                  {logs.map((log, i) => (
                    <div key={i}>{log}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {error && !isInstalling && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800">{error}</div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isInstalling}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInstall}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={isInstalling || success}
              >
                {isInstalling ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Installing...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Install Now
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
