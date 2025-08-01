import { Bell } from "lucide-react";

const Notifications = () => {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center mb-4">
        <Bell className="h-6 w-6 mr-2" />
        <h1 className="text-2xl font-bold">Notifications</h1>
      </div>
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-600">You have no new notifications.</p>
      </div>
    </div>
  );
};

export default Notifications;