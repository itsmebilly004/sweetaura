import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ReviewCardProps {
  authorName: string;
  avatarUrl?: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

const ReviewCard = ({ authorName, avatarUrl, rating, comment, createdAt }: ReviewCardProps) => {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={avatarUrl} alt={authorName} />
            <AvatarFallback>{getInitials(authorName)}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-base font-medium">{authorName}</CardTitle>
        </div>
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${i < rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`}
            />
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-2 text-sm">
          {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
        </p>
        <p className="text-foreground">{comment}</p>
      </CardContent>
    </Card>
  );
};

export default ReviewCard;