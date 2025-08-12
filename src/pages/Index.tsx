import PortalLayout from "@/components/PortalLayout";

const IndexPage = () => {
  return (
    <PortalLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p>Selamat datang di portal Anda.</p>
      </div>
    </PortalLayout>
  );
};

export default IndexPage;