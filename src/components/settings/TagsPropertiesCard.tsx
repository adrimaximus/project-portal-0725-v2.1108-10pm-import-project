import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Tag } from "lucide-react";

const TagsPropertiesCard = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/settings/tags-properties');
  };

  return (
    <Card onClick={handleClick} className="cursor-pointer hover:bg-muted/50 transition-colors h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Tag className="h-4 w-4" />
          Tag Properties
        </CardTitle>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Customize the data fields for your tags.
        </p>
      </CardContent>
    </Card>
  );
};

export default TagsPropertiesCard;