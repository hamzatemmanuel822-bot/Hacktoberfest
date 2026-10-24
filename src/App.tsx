import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { KioskView } from './components/KioskView';
import { StaffView } from './components/StaffView';
import { VisitorsView } from './components/VisitorsView';
import { AttendanceView } from './components/AttendanceView';
import { GemmaView } from './components/GemmaView';
import { HardwareView } from './components/HardwareView';
import { AdminView } from './components/AdminView';
import { TestsView } from './components/TestsView';
import { api } from './services/api';
import { Staff, Visitor, StickerToken, AttendanceRecord, DeviceTwin } from './types';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('kiosk');
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [visitorsList, setVisitorsList] = useState<Visitor[]>([]);
  const [tokensList, setTokensList] = useState<StickerToken[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [deviceTwin, setDeviceTwin] = useState<DeviceTwin | null>(null);
  const [gemmaVariant, setGemmaVariant] = useState<string>('gemma-4-e4b-it');

  useEffect(() => {
    loadAllData();

    // Background polling for device twin and attendance records every 4 seconds
    const interval = setInterval(() => {
      pollHardwareAndAttendance();
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const loadAllData = async () => {
    try {
      const [staff, visitors, tokens, attendance, devData, gemmaStatus] = await Promise.all([
        api.getStaff(),
        api.getVisitors(),
        api.getStickers(),
        api.getAttendance(),
        api.getDeviceStatus(),
        api.getGemmaStatus()
      ]);

      setStaffList(staff);
      setVisitorsList(visitors);
      setTokensList(tokens);
      setAttendanceRecords(attendance);
      if (devData?.twin) setDeviceTwin(devData.twin);
      if (gemmaStatus?.variant) setGemmaVariant(gemmaStatus.variant);
    } catch (err) {
      console.warn('Initial data load warning:', err);
    }
  };

  const pollHardwareAndAttendance = async () => {
    try {
      const [devData, attendance] = await Promise.all([
        api.getDeviceStatus(),
        api.getAttendance()
      ]);
      if (devData?.twin) setDeviceTwin(devData.twin);
      setAttendanceRecords(attendance);
    } catch (err) {
      // quiet poll
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setTab={setCurrentTab}
        deviceTwin={deviceTwin}
        gemmaVariant={gemmaVariant}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-12">
        {currentTab === 'kiosk' && <KioskView />}
        {currentTab === 'staff' && (
          <StaffView
            staffList={staffList}
            tokensList={tokensList}
            onRefresh={loadAllData}
          />
        )}
        {currentTab === 'visitors' && (
          <VisitorsView
            visitorsList={visitorsList}
            tokensList={tokensList}
            onRefresh={loadAllData}
          />
        )}
        {currentTab === 'attendance' && <AttendanceView records={attendanceRecords} />}
        {currentTab === 'gemma' && <GemmaView />}
        {currentTab === 'hardware' && (
          <HardwareView deviceTwin={deviceTwin} onRefresh={pollHardwareAndAttendance} />
        )}
        {currentTab === 'admin' && <AdminView onRefreshAll={loadAllData} />}
        {currentTab === 'tests' && <TestsView />}
      </main>

      {/* Global Minimal Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            SmartWelcome AI · Powered by Google Gemma 4 & Arduino UNO Q (Qualcomm QRB2210 + STM32U585)
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            Hackathon Build · Section 14/15 Verified
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
