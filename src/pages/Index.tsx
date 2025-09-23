import PortalLayout from "@/components/PortalLayout";

const Index = () => {
  return (
    <PortalLayout>
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="text-4xl font-bold">Welcome</h1>
        <p className="text-muted-foreground">Select a page from the sidebar to get started.</p>
      </div>
    </PortalLayout>
  );
};

export default Index;