import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PortalLayout from "@/components/PortalLayout";
import { useProjects } from "@/context/ProjectContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const NewRequestPage = () => {
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const { addProject } = useProjects();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;
    addProject({ name: projectName, description });
    navigate("/");
  };

  return (
    <PortalLayout>
      <div className="flex justify-center items-start py-8">
        <Card className="w-full max-w-2xl">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Permintaan Proyek Baru</CardTitle>
              <CardDescription>Isi detail di bawah ini untuk mengirimkan proyek baru untuk ditinjau.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="project-name">Nama Proyek</Label>
                <Input 
                  id="project-name" 
                  placeholder="cth. Peluncuran Produk Baru" 
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea 
                  id="description" 
                  placeholder="Jelaskan tujuan dan sasaran proyek..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="ml-auto">Kirim Permintaan</Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default NewRequestPage;