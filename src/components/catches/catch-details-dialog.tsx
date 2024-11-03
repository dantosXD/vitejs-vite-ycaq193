import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ImageDialog } from '@/components/ui/image-dialog';
import { CatchComments } from './catch-comment';
import { getImageUrl } from '@/lib/appwrite';
import type { Catch, User } from '@/lib/types';
import { Scale, Ruler, MapPin, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { usePreferences } from '@/lib/hooks/use-preferences';

interface CatchDetailsDialogProps {
  catch_: Catch | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupMembers?: User[];
  currentUserId: string;
  onAddComment?: (catchId: string, content: string) => void;
}

export function CatchDetailsDialog({
  catch_,
  open,
  onOpenChange,
  groupMembers,
  currentUserId,
  onAddComment,
}: CatchDetailsDialogProps) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const preferences = usePreferences();

  if (!catch_) return null;

  const formatMeasurement = (value: number, type: 'weight' | 'length') => {
    const { displaySettings } = preferences;
    const isImperial = displaySettings.measurementSystem === 'imperial';

    if (type === 'weight') {
      return isImperial ? `${value} lbs` : `${(value * 0.453592).toFixed(1)} kg`;
    } else {
      return isImperial ? `${value}"` : `${(value * 2.54).toFixed(1)} cm`;
    }
  };

  const formatDate = (date: string) => {
    const { displaySettings } = preferences;
    const dateFormat = displaySettings.dateFormat
      .replace('DD', 'dd')
      .replace('YYYY', 'yyyy');
    return format(new Date(date), dateFormat);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{catch_.species}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-lg">
              <ImageDialog
                image={getImageUrl(catch_.photos[selectedPhotoIndex])}
                alt={`${catch_.species} catch`}
                trigger={
                  <img
                    src={getImageUrl(catch_.photos[selectedPhotoIndex], 400, 400)}
                    alt={`${catch_.species} catch`}
                    className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  />
                }
              />
            </div>
            {catch_.photos.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {catch_.photos.map((photo, index) => (
                  <button
                    key={photo}
                    onClick={() => setSelectedPhotoIndex(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 ${
                      index === selectedPhotoIndex
                        ? 'border-primary'
                        : 'border-transparent'
                    }`}
                  >
                    <img
                      src={getImageUrl(photo, 100, 100)}
                      alt={`${catch_.species} catch thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-6">
            <div className="grid gap-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Scale className="h-4 w-4" />
                <span className="text-foreground font-medium">
                  {formatMeasurement(catch_.weight, 'weight')}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Ruler className="h-4 w-4" />
                <span className="text-foreground font-medium">
                  {formatMeasurement(catch_.length, 'length')}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span className="text-foreground font-medium">
                  {catch_.location.name}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="text-foreground font-medium">
                  {formatDate(catch_.date)}
                </span>
              </div>
            </div>

            {catch_.notes && (
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground">{catch_.notes}</p>
              </div>
            )}

            {groupMembers && onAddComment && (
              <CatchComments
                catchId={catch_.id}
                comments={catch_.comments}
                groupMembers={groupMembers}
                currentUserId={currentUserId}
                onAddComment={onAddComment}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}