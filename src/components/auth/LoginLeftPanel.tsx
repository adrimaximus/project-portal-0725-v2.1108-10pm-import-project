const LoginLeftPanel = () => {
  return (
    <div className="hidden lg:flex flex-col justify-between p-12 text-white bg-black/50 backdrop-blur-md">
      <div>
        <p className="text-sm font-medium tracking-widest uppercase text-white/80">A Wise Quote</p>
        <div className="w-16 h-px bg-white/50 mt-2"></div>
      </div>
      <div className="space-y-4">
        <h2 className="text-5xl font-serif font-bold">Get Everything You Want</h2>
        <p className="text-white/80">
          You can get everything you want if you work hard, trust the process, and stick to the plan.
        </p>
      </div>
    </div>
  );
};

export default LoginLeftPanel;