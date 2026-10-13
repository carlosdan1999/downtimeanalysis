import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Smartphone, Download, Check, Copy, ExternalLink, QrCode } from 'lucide-react';

interface AndroidInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidInstallModal: React.FC<AndroidInstallModalProps> = ({
  isOpen,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isInstallable, isInstalled, isAndroid, install } = usePWAInstall();
  const [copied, setCopied] = useState(false);
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  useEffect(() => {
    if (isOpen && canvasRef.current && currentUrl) {
      QRCode.toCanvas(
        canvasRef.current,
        currentUrl,
        {
          width: 180,
          margin: 1.5,
          color: {
            dark: '#1e3a8a',
            light: '#ffffff',
          },
        },
        (error) => {
          if (error) console.error('Error rendering QR code', error);
        }
      );
    }
  }, [isOpen, currentUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full max-h-[92dvh] flex flex-col shadow-2xl overflow-hidden">
        {/* Sticky Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Instalar en Android / En tu Teléfono
              </h3>
              <p className="text-xs text-slate-500">
                Aplicación Web Progresiva (PWA) instalable directamente en tu móvil
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* If device is Android and install prompt is ready */}
          {isInstallable && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <div className="font-bold text-sm text-emerald-900">
                  ¡Tu navegador está listo para instalar!
                </div>
                <div className="text-xs text-emerald-800 mt-0.5">
                  Haz click para agregar DowntimePro a la pantalla de inicio de tu Android.
                </div>
              </div>
              <button
                onClick={install}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Instalar Ahora
              </button>
            </div>
          )}

          {isInstalled && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 font-medium flex items-center gap-2">
              <Check className="w-4 h-4 text-blue-600 shrink-0" />
              <span>La aplicación ya está instalada en este dispositivo en modo nativo.</span>
            </div>
          )}

          {/* QR Code section for scanning from desktop */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-center gap-4">
            <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs shrink-0">
              <canvas ref={canvasRef} className="rounded-lg" />
            </div>

            <div className="space-y-2 text-left">
              <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-blue-600" />
                Escanea con la cámara de tu Android
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Apunta con la cámara de tu teléfono móvil a este código QR para abrir DowntimePro al instante en Chrome o en tu navegador móvil.
              </p>

              <div className="pt-1 flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-lg font-semibold text-[11px] flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ¡Enlace Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      Copiar Enlace
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Step by Step Guide for Android Chrome */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5">
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              Pasos para tener el ícono en tu teléfono Android:
            </h4>

            <ol className="list-decimal list-inside space-y-1.5 text-slate-700 text-xs pl-1">
              <li>
                Abre este enlace en tu teléfono en <strong>Google Chrome</strong>.
              </li>
              <li>
                Toca los <strong>tres puntos (⋮)</strong> en la esquina superior derecha del navegador.
              </li>
              <li>
                Selecciona <strong>"Instalar aplicación"</strong> o <strong>"Agregar a la pantalla principal"</strong>.
              </li>
              <li>
                Toca <strong>Instalar</strong>. ¡Listo! Se creará el ícono en tus aplicaciones y se abrirá a pantalla completa como una app nativa, con acceso sin conexión.
              </li>
            </ol>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-slate-50/90 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 cursor-pointer shadow-xs transition-colors"
          >
            Entendido / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
