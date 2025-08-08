import OnlineCollaborators from "@/components/OnlineCollaborators";
import { useState } from "react";

const IndexPage = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      <aside className={`bg-muted/40 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
        <div className="p-2 flex justify-end">
            <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-2 rounded-md hover:bg-muted">
            {isCollapsed ? '→' : '←'}
            </button>
        </div>
        <OnlineCollaborators isCollapsed={isCollapsed} />
      </aside>
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p>Welcome to your application!</p>
      </main>
    </div>
  );
};

export default IndexPage;