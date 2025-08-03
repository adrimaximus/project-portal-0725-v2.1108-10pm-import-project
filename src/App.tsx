import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import ProjectDetail from './pages/ProjectDetail';
import PortalLayout from './components/PortalLayout';
import SettingsPage from './pages/Settings';

// Dummy components for other pages to make routes work
const DummyPage = ({ title }: { title: string }) => (
  <PortalLayout>
    <h1 className="text-2xl font-bold">{title}</h1>
  </PortalLayout>
);

const Index = () => <DummyPage title="Dashboard" />;
const Request = () => <DummyPage title="Request" />;
const Chat = () => <DummyPage title="Chat" />;
const MoodTracker = () => <DummyPage title="Mood Tracker" />;
const Goals = () => <DummyPage title="Goals" />;
const Billing = () => <DummyPage title="Billing" />;
const Notifications = () => <DummyPage title="Notifications" />;
const Profile = () => <DummyPage title="Profile" />;
const CustomPage = () => <DummyPage title="Custom Page" />;

function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/request" element={<Request />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/mood-tracker" element={<MoodTracker />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/project/:projectId" element={<ProjectDetail />} />
          <Route path="/profile"element={<Profile />} />
          <Route path="/custom" element={<CustomPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;