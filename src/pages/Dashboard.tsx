import PortalLayout from "@/components/PortalLayout";

const Dashboard = () => {
  return (
    <PortalLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Selamat datang di portal klien Anda.</p>
      </div>
    </PortalLayout>
  );
};

export default Dashboard;