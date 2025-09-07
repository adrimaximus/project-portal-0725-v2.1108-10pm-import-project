import { PersonFormDialog } from "@/components/people/PersonFormDialog";

export default function Index() {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Click the button below to add a new person.
        </p>
        <PersonFormDialog onSuccess={() => console.log("Person saved!")} />
      </div>
    </div>
  );
}