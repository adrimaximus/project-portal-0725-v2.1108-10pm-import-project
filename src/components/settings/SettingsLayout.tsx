import { Outlet } from "react-router-dom";
import SettingsSidebar from "./SettingsSidebar";

const SettingsLayout = () => {
  return (
    <div className="p-4 md:p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and workspace settings.
        </p>
      </div>
      <div className="flex flex-col md:flex-row gap-8">
        <SettingsSidebar />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SettingsLayout;