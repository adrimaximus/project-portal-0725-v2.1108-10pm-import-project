import OverdueInvoicesCard from "@/components/dashboard/OverdueInvoicesCard";

const DashboardPage = () => {
  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <OverdueInvoicesCard />
      </div>
    </div>
  );
};

export default DashboardPage;