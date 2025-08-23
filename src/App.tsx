import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Scoreboard from "@/pages/Home";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import TeamManagement from "@/pages/TeamManagement";
import MatchManagement from "@/pages/MatchManagement";
import TournamentManagement from "@/pages/TournamentManagement";
import PickleballScoreCalculator from "@/components/PickleballScoreCalculator";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Scoreboard />} />
        <Route path="/scorer/:matchId" element={<PickleballScoreCalculator />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/teams" element={<TeamManagement />} />
        <Route path="/admin/matches" element={<MatchManagement />} />
        <Route path="/admin/tournaments" element={<TournamentManagement />} />
      </Routes>
    </Router>
  );
}
