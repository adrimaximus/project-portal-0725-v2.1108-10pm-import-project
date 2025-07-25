import React, { useState, useEffect } from "react";
import PortalLayout from "@/components/PortalLayout";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { services } from "@/data/services";
import { Search, ArrowLeft, LucideIcon, Calendar as CalendarIcon, Paperclip, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CurrencyInput } from "@/components/ui/currency-input";

// Define the type for a service based on the data structure
type Service = {
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
};

// Define the type for a comment
type Comment = {
  text: string;
  file: File | null;
  fileURL?: string;
  sender: string;
  avatar: string;
};

const RequestPage = () => {
  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [budget, setBudget] = useState<number | undefined>();
  
  // State for comments
  const [comments, setComments] = useState<Comment[]>([]);
  const [currentComment, setCurrentComment] = useState("");
  const [commentFile, setCommentFile] = useState<File | null>(null);

  useEffect(() => {
    // Cleanup object URLs on unmount to prevent memory leaks
    return () => {
      comments.forEach(comment => {
        if (comment.fileURL) {
          URL.revokeObjectURL(comment.fileURL);
        }
      });
    };
  }, [comments]);

  const handleServiceSelect = (service: Service) => {
    const isFeatured = service.title === "End to End Services";
    const isAlreadySelected = selectedServices.some(
      (s) => s.title === service.title
    );

    if (isFeatured) {
      setSelectedServices(isAlreadySelected ? [] : [service]);
    } else {
      let newSelectedServices = selectedServices.filter(
        (s) => s.title !== "End to End Services"
      );
      if (isAlreadySelected) {
        newSelectedServices = newSelectedServices.filter(
          (s) => s.title !== service.title
        );
      } else {
        newSelectedServices.push(service);
      }
      setSelectedServices(newSelectedServices);
    }
  };

  const handleSendComment = () => {
    if (currentComment.trim() === "" && !commentFile) return;

    const newComment: Comment = {
      text: currentComment,
      file: commentFile,
      fileURL: commentFile ? URL.createObjectURL(commentFile) : undefined,
      sender: "You", // Dummy sender
      avatar: "https://github.com/shadcn.png", // Dummy avatar
    };

    setComments([...comments, newComment]);
    setCurrentComment("");
    setCommentFile(null);
  };

  const featuredService = services.find(
    (s) => s.title === "End to End Services"
  );
  const otherServices = services.filter(
    (s) => s.title !== "End to End Services"
  );

  const filteredServices = otherServices.filter(
    (service) =>
      service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isSelected = (service: Service) => {
    return selectedServices.some((s) => s.title === service.title);
  };

  const renderContent = () => {
    if (step === 1) {
      return (
        <>
          {/* Step 1: Service Selection */}
          <div className="space-y-4 pb-24">
            <h1 className="text-2xl font-bold tracking-tight">
              Project Support Request
            </h1>
            <p className="text-muted-foreground">
              Select the services you need for your project. You can select
              multiple services, or choose our end-to-end package.
            </p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search support options..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {featuredService && (
              <Card
                className={cn(
                  "w-full hover:bg-muted/50 transition-colors cursor-pointer",
                  isSelected(featuredService) && "ring-2 ring-primary"
                )}
                onClick={() => handleServiceSelect(featuredService)}
              >
                <CardContent className="p-6 flex items-center gap-6">
                  <div
                    className={cn(
                      "p-3 rounded-lg",
                      featuredService.iconColor
                    )}
                  >
                    <featuredService.icon className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg">
                      {featuredService.title}
                    </h2>
                    <p className="text-muted-foreground">
                      {featuredService.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredServices.map((service) => (
                <Card
                  key={service.title}
                  className={cn(
                    "hover:bg-muted/50 transition-colors cursor-pointer h-full",
                    isSelected(service) && "ring-2 ring-primary"
                  )}
                  onClick={() => handleServiceSelect(service)}
                >
                  <CardContent className="p-4 flex items-start gap-4">
                    <div
                      className={cn("p-2 rounded-lg", service.iconColor)}
                    >
                      <service.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{service.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {service.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 py-4 px-4 backdrop-blur-sm md:left-[220px] lg:left-[280px]">
            <div className="flex justify-end">
              <Button
                onClick={() => setStep(2)}
                disabled={selectedServices.length === 0}
              >
                Continue
              </Button>
            </div>
          </div>
        </>
      );
    } else {
      return (
        // Step 2: Project Details
        <div className="space-y-6">
          <Button
            variant="ghost"
            onClick={() => setStep(1)}
            className="pl-0"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Services
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            Tell us about your project
          </h1>

          <Card>
            <CardHeader>
              <CardTitle>Selected Services</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {selectedServices.map((service) => (
                <div
                  key={service.title}
                  className="flex items-center gap-2 bg-muted py-1 px-2 rounded-md"
                >
                  <div
                    className={cn("p-1 rounded-sm", service.iconColor)}
                  >
                    <service.icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">
                    {service.title}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  placeholder="e.g., New Corporate Website"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectDescription">
                  Project Description
                </Label>
                <Textarea
                  id="projectDescription"
                  placeholder="Describe your project goals, target audience, and key features..."
                  rows={5}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectBudget">ETA Budget (IDR)</Label>
                <CurrencyInput
                  id="projectBudget"
                  placeholder="e.g., 50,000,000"
                  value={budget}
                  onChange={setBudget}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? (
                          format(startDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? (
                          format(endDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="briefAttachment">Project Brief</Label>
                <Input id="briefAttachment" type="file" />
                <p className="text-sm text-muted-foreground">
                  Attach any relevant documents for the project brief.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-2">
            <Button>Submit Request</Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Additional Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {comments.map((comment, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 border">
                      <AvatarImage src={comment.avatar} alt={comment.sender} />
                      <AvatarFallback>{comment.sender.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{comment.sender}</p>
                      <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg mt-1">
                        <p className="whitespace-pre-wrap">{comment.text}</p>
                        {comment.file && comment.fileURL && (
                          <a
                            href={comment.fileURL}
                            download={comment.file.name}
                            className="mt-2 block rounded-lg border p-2 transition-colors hover:bg-muted"
                          >
                            {comment.file.type.startsWith("image/") ? (
                              <div className="flex items-center gap-3">
                                <img
                                  src={comment.fileURL}
                                  alt="Image thumbnail"
                                  className="h-12 w-12 rounded-md object-cover"
                                />
                                <div className="text-sm">
                                  <p className="font-medium text-primary">{comment.file.name}</p>
                                  <p className="text-xs text-muted-foreground">Click to download</p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3 text-sm">
                                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-background">
                                  <Paperclip className="h-6 w-6" />
                                </div>
                                <div>
                                  <p className="font-medium text-primary">{comment.file.name}</p>
                                  <p className="text-xs text-muted-foreground">Click to download</p>
                                </div>
                              </div>
                            )}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t">
                <div className="relative">
                  <Label htmlFor="comments" className="sr-only">Add a comment</Label>
                  <Textarea
                    id="comments"
                    placeholder="Type your comment here..."
                    className="resize-none pr-24 min-h-[80px]"
                    value={currentComment}
                    onChange={(e) => setCurrentComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendComment();
                      }
                    }}
                  />
                  <div className="absolute bottom-2 right-2 flex items-center">
                    <Input
                      id="comment-attachment"
                      type="file"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files ? e.target.files[0] : null;
                        setCommentFile(file);
                      }}
                    />
                    <Button asChild variant="ghost" size="icon">
                      <Label htmlFor="comment-attachment" className="cursor-pointer">
                        <Paperclip className="h-5 w-5 text-muted-foreground" />
                        <span className="sr-only">Attach file</span>
                      </Label>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleSendComment} disabled={!currentComment.trim() && !commentFile}>
                      <Send className="h-5 w-5" />
                      <span className="sr-only">Send comment</span>
                    </Button>
                  </div>
                </div>
                {commentFile && (
                  <p className="text-sm text-muted-foreground pt-2">
                    File to attach: {commentFile.name}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

        </div>
      );
    }
  };

  return <PortalLayout>{renderContent()}</PortalLayout>;
};

export default RequestPage;