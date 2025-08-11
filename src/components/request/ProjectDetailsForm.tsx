import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Check, ChevronsUpDown, X, Briefcase } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { User, Service } from "@/types";
import { toast } from "sonner";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";

const ProjectDetailsForm = () => {
  const { control } = useFormContext();
  const [users, setUsers] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [servicesPopoverOpen, setServicesPopoverOpen] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) {
        toast.error("Failed to fetch users");
      } else {
        setUsers(data as User[]);
      }
    };
    const fetchServices = async () => {
      const { data, error } = await supabase.from("services").select("*");
      if (error) {
        toast.error("Failed to fetch services");
      } else {
        setServices(data || []);
      }
    };
    fetchUsers();
    fetchServices();
  }, []);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Project Details</h3>
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Project Name</FormLabel>
            <FormControl>
              <Input placeholder="e.g., New Marketing Campaign" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Provide a brief description of the project"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="services"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center">
              <Briefcase className="mr-2 h-4 w-4" />
              Services
            </FormLabel>
            <Popover open={servicesPopoverOpen} onOpenChange={setServicesPopoverOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-full justify-between h-auto min-h-[40px]",
                      !field.value?.length && "text-muted-foreground"
                    )}
                  >
                    <div className="flex gap-1 flex-wrap">
                      {field.value?.length > 0 ? (
                        services
                          .filter(service => field.value.includes(service.title))
                          .map(service => (
                            <Badge
                              variant="secondary"
                              key={service.title}
                              className="mr-1"
                              onClick={(e) => {
                                e.preventDefault();
                                field.onChange(field.value.filter((v: string) => v !== service.title));
                              }}
                            >
                              {service.title}
                              <X className="ml-1 h-3 w-3" />
                            </Badge>
                          ))
                      ) : (
                        <span className="font-normal">Select services</span>
                      )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Search services..." />
                  <CommandList>
                    <CommandEmpty>No service found.</CommandEmpty>
                    <CommandGroup>
                      {services.map((service) => (
                        <CommandItem
                          value={service.title}
                          key={service.title}
                          onSelect={() => {
                            const currentValue = field.value || [];
                            const newValue = currentValue.includes(service.title)
                              ? currentValue.filter((item: string) => item !== service.title)
                              : [...currentValue, service.title];
                            field.onChange(newValue);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              field.value?.includes(service.title)
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {service.title}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="startDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Start Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="dueDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Due Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={control}
        name="ownerId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Project Owner</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project owner" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default ProjectDetailsForm;