import Editor from "@/components/Editor";
import PortalLayout from "@/components/PortalLayout";

export default function TestEditorPage() {
  return (
    <PortalLayout>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Uji Editor.js</h2>
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <Editor onChange={(data) => console.log("Tersimpan:", data)} />
        </div>
      </div>
    </PortalLayout>
  );
}