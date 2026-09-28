import { Avatar, Button, Tab, TabList, Toolbar, ToolbarButton, Tooltip } from '@fluentui/react-components';
import { CalendarLtrRegular, ChartMultipleRegular, SignOutRegular, WeatherMoonRegular, WeatherSunnyRegular } from '@fluentui/react-icons';
import { Link, Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useThemeMode } from '../theme';

const navigation = [
  { path: '/', label: 'Weekly Plan', icon: <CalendarLtrRegular /> },
  { path: '/goals', label: 'Goals', icon: <ChartMultipleRegular /> },
  { path: '/commitments', label: 'Commitments', icon: <CalendarLtrRegular /> },
];

export function ProtectedShell() {
  const { user, loading, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { mode, setMode } = useThemeMode();

  if (loading) return <main className="auth-loading" aria-label="Loading your planner" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  const themeLabel = mode === 'system' ? 'System theme' : `${mode[0].toUpperCase()}${mode.slice(1)} theme`;
  const nextMode = mode === 'system' ? 'light' : mode === 'light' ? 'dark' : 'system';

  return (
    <div className="app-frame">
      <header className="app-header">
        <Link to="/" className="brand-lockup" aria-label="Schedule Planner home">
          <span className="brand-mark"><CalendarLtrRegular /></span>
          <span>Schedule Planner</span>
        </Link>
        <Toolbar className="header-tools" aria-label="Account and appearance">
          <Tooltip content={`${themeLabel}; choose ${nextMode}`} relationship="label">
            <ToolbarButton
              aria-label={`Theme: ${themeLabel}. Switch to ${nextMode}.`}
              icon={mode === 'dark' ? <WeatherSunnyRegular /> : <WeatherMoonRegular />}
              onClick={() => setMode(nextMode)}
            />
          </Tooltip>
          <Avatar name={user.name} size={32} color="brand" />
          <span className="header-user">{user.name}</span>
          <Tooltip content="Sign out" relationship="label">
            <ToolbarButton aria-label="Sign out" icon={<SignOutRegular />} onClick={() => { void signOut().then(() => navigate('/login')); }} />
          </Tooltip>
        </Toolbar>
      </header>
      <nav className="app-nav" aria-label="Plan pages">
        <TabList selectedValue={location.pathname} size="small">
          {navigation.map((item) => (
            <Tab key={item.path} value={item.path} icon={item.icon} onClick={() => navigate(item.path)}>
              {item.label}
            </Tab>
          ))}
        </TabList>
      </nav>
      <Outlet />
      <footer className="app-footer">
        <span>Schedule Planner</span>
        <span>Built around your time, not over it.</span>
      </footer>
    </div>
  );
}

export function LoginRequiredAction() {
  const navigate = useNavigate();
  return <Button appearance="secondary" onClick={() => navigate('/login')}>Return to sign in</Button>;
}