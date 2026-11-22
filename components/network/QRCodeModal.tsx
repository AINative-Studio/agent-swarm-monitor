'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Download, Copy, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { QRCodeData } from '@/types/network';

interface QRCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    qrData: QRCodeData | null;
    isLoading?: boolean;
}

export default function QRCodeModal({ isOpen, onClose, qrData, isLoading }: QRCodeModalProps) {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setCopied(false);
        }
    }, [isOpen]);

    const handleCopyConfig = async () => {
        if (!qrData?.wireguardConfig) return;

        try {
            await navigator.clipboard.writeText(qrData.wireguardConfig);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleDownloadQR = () => {
        if (!qrData) return;

        const svg = document.getElementById('qr-code-svg');
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL('image/png');

            const downloadLink = document.createElement('a');
            downloadLink.download = `wireguard-qr-${qrData.peerId}.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    };

    const expiresIn = qrData
        ? Math.max(0, Math.floor((new Date(qrData.expiresAt).getTime() - Date.now()) / 1000 / 60))
        : 0;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">WireGuard Provisioning</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Scan QR code to configure mobile device</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                    </div>
                ) : qrData ? (
                    <div className="space-y-6">
                        <div className="flex flex-col items-center justify-center p-8 bg-white border-2 border-dashed border-gray-200 rounded-lg">
                            <QRCodeSVG id="qr-code-svg" value={qrData.qrCodeData} size={256} level="H" includeMargin={true} />
                            <div className="mt-4 text-center">
                                <div className="text-xs text-gray-500">Peer ID</div>
                                <div className="text-sm font-mono text-gray-900 mt-0.5">{qrData.peerId}</div>
                            </div>
                        </div>

                        {expiresIn > 0 && (
                            <div className="flex items-center gap-2 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div className="text-sm text-yellow-800">
                                    This QR code expires in <span className="font-semibold">{expiresIn} minutes</span>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700">WireGuard Configuration</label>
                                <Button size="sm" variant="outline" onClick={handleCopyConfig} className="h-7 gap-1.5">
                                    {copied ? (<><CheckCircle className="w-3.5 h-3.5" />Copied</>) : (<><Copy className="w-3.5 h-3.5" />Copy</>)}
                                </Button>
                            </div>
                            <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs font-mono text-gray-800 overflow-x-auto max-h-48 overflow-y-auto">
{qrData.wireguardConfig}
                            </pre>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <Button onClick={handleDownloadQR} className="flex-1 gap-2">
                                <Download className="w-4 h-4" />Download QR Code
                            </Button>
                            <Button onClick={onClose} variant="outline" className="flex-1">Close</Button>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="text-xs font-semibold text-blue-900 mb-2">Mobile Setup Instructions</div>
                            <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                                <li>Install WireGuard app from App Store or Google Play</li>
                                <li>Open the app and tap Add a tunnel</li>
                                <li>Select Create from QR code</li>
                                <li>Scan the QR code displayed above</li>
                                <li>Activate the tunnel to connect to the network</li>
                            </ol>
                        </div>
                    </div>
                ) : (
                    <div className="py-12 text-center text-gray-500">Failed to generate QR code. Please try again.</div>
                )}
            </DialogContent>
        </Dialog>
    );
}
