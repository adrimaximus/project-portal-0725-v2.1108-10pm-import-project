import { Outlet } from "react-router-dom";
import SettingsSidebar from "./SettingsSidebar";
import PortalLayout from "../PortalLayout";

const SettingsLayout = () => {
  return (
    <PortalLayout
      pageHeader={<h1 className="text-2xl font-bold">Settings</h1>}
      noPadding
    >
      <div className="p-4 md:p-6 flex flex-col md:flex-row gap-8">
        <SettingsSidebar />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </PortalLayout>
  );
};

export default SettingsLayout;