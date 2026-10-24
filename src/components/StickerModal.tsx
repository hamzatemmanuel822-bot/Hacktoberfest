import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Printer, X, ShieldCheck } from 'lucide-react';
import { StickerToken, Staff, Visitor } from '../types';

interface StickerModalProps {
  token: StickerToken;
  person: Staff | Visitor | null;
  onClose: () => void;
}

export const StickerModal: React.FC<StickerModalProps> = ({ token, person, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    QRCode.toDataURL(token.token, {
      width: 240,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR code generation error:', err));
  }, [token.token]);

  const handlePrint = () => {
    window.print();
  };

  const isStaff = token.assignedToType === 'staff';
  const staffPerson = isStaff ? (person as Staff) : null;
  const visitorPerson = !isStaff ? (person as Visitor) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-cyan-400" />
            <h3 className="text-base font-semibold text-slate-100">
              Printable Attendance Badge Sticker
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* The Badge Card (Designed to look crisp both on-screen and when printed) */}
        <div className="p-4 bg-slate-950 rounded-xl flex justify-center">
          <div
            id="printable-badge"
            className="w-72 bg-white text-slate-950 rounded-xl p-5 border-2 border-dashed border-slate-400 shadow-xl space-y-3 font-sans select-none"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
              <div>
                <div className="text-[10px] font-bold tracking-widest uppercase text-slate-600">
                  SMARTWELCOME AI
                </div>
                <div className="text-xs font-black tracking-tight">FACILITY ACCESS</div>
              </div>
              <div
                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider text-white ${
                  isStaff ? 'bg-blue-600' : 'bg-emerald-600'
                }`}
              >
                {isStaff ? 'Staff Pass' : 'Visitor Pass'}
              </div>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center justify-center py-1">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Attendance QR Code"
                  className="w-36 h-36 border border-slate-300 rounded-lg p-1 bg-white"
                />
              ) : (
                <div className="w-36 h-36 bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                  Generating QR...
                </div>
              )}
              <span className="text-[11px] font-mono font-bold tracking-wider mt-1 text-slate-800">
                {token.token}
              </span>
            </div>

            {/* Attendee Metadata */}
            <div className="space-y-1 text-xs border-t border-slate-300 pt-2 text-slate-800">
              <div className="font-bold text-sm text-slate-950">
                {person ? person.fullName : 'Authorized Attendee'}
              </div>
              {isStaff && staffPerson && (
                <>
                  <div className="text-[11px] text-slate-600">
                    ID: <span className="font-mono font-semibold">{staffPerson.staffNumber}</span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Dept: <span className="font-semibold">{staffPerson.department}</span>
                  </div>
                </>
              )}
              {!isStaff && visitorPerson && (
                <>
                  <div className="text-[11px] text-slate-600">
                    Host: <span className="font-semibold">{visitorPerson.hostPerson}</span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Org: <span className="font-semibold">{visitorPerson.organization}</span>
                  </div>
                </>
              )}
              <div className="text-[10px] text-slate-500 pt-1 flex justify-between">
                <span>Issued: {new Date(token.createdAt).toLocaleDateString()}</span>
                <span>
                  {token.expiresAt
                    ? `Exp: ${new Date(token.expiresAt).toLocaleDateString()}`
                    : 'Perm Staff'}
                </span>
              </div>
            </div>

            <div className="text-[8px] text-center text-slate-500 tracking-tight">
              Peel adhesive backing · Present code to kiosk camera upon entry
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-400">
            Token Status: <strong className="text-emerald-400 uppercase font-mono">{token.status}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Sticker Badge</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
