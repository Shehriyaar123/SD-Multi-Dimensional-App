/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";
import DimensionSelection from "./components/DimensionSelection";
import StudyDashboard from "./dimensions/study-platform/Dashboard";
import CodingDashboard from "./dimensions/coding-arena/Dashboard";
import NetworkDashboard from "./dimensions/professional-network/Dashboard";
import CareerDashboard from "./dimensions/career-launchpad/Dashboard";
import LibraryDashboard from "./dimensions/knowledge-library/Dashboard";
import { RoleProvider } from "./contexts/RoleContext";
import { SettingsProvider } from "./contexts/SettingsContext";

export default function App() {
  return (
    <SettingsProvider>
      <RoleProvider>
        <Router>
          <main className="bg-bg min-h-screen transition-colors duration-300">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/select-dimension" element={<DimensionSelection />} />
              <Route path="/study" element={<StudyDashboard />} />
              <Route path="/coding" element={<CodingDashboard />} />
              <Route path="/coding/admin" element={<CodingDashboard initialView="admin" />} />
              <Route path="/network" element={<NetworkDashboard />} />
              <Route path="/career" element={<CareerDashboard />} />
              <Route path="/library" element={<LibraryDashboard />} />
              <Route path="/coding/admin/create" element={<CodingDashboard initialView="admin-create" />} />
              <Route path="/coding/admin/edit/:id" element={<CodingDashboard initialView="admin-edit" />} />
            </Routes>
          </main>
        </Router>
      </RoleProvider>
    </SettingsProvider>
  );
}
