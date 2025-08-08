import GoogleCalendarIntegration from "@/components/GoogleCalendarIntegration";

const SettingsPage = () => {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <div className="grid gap-6 max-w-2xl">
        <GoogleCalendarIntegration />
        {/* Other settings cards can go here */}
      </div>
    </div>
  );
};

export default SettingsPage;