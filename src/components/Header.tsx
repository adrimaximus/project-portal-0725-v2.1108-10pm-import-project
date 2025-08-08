import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Settings } from "lucide-react";

const Header = () => {
  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <Link to="/" className="text-2xl font-bold">
          ProjectHub
        </Link>
        <nav>
          <Button variant="ghost" asChild>
            <Link to="/settings">
              <Settings className="h-5 w-5" />
              <span className="sr-only">Settings</span>
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
};

export default Header;