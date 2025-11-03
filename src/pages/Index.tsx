import ReactionDemoCard from '@/components/ReactionDemoCard';

export default function Index() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">Selamat Datang!</h1>
        <p className="text-muted-foreground">Ini adalah demonstrasi sistem reaksi emoji.</p>
      </header>
      
      <main className="flex flex-col items-center">
        <ReactionDemoCard />
      </main>
    </div>
  );
}