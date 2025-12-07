'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Clock, User, ExternalLink, Calendar } from 'lucide-react';
import { format, formatDistanceToNow, isPast, isFuture, differenceInMinutes } from 'date-fns';

interface LiveClassCardProps {
    lessonTitle: string;
    meetingUrl: string;
    meetingDate: string; // ISO string
    meetingPlatform?: 'google_meet' | 'zoom' | 'teams' | 'other';
    instructorName?: string;
}

export function LiveClassCard({
    lessonTitle,
    meetingUrl,
    meetingDate,
    meetingPlatform = 'google_meet',
    instructorName
}: LiveClassCardProps) {
    const [timeUntil, setTimeUntil] = useState<string>('');
    const [isLive, setIsLive] = useState(false);
    const [isUpcoming, setIsUpcoming] = useState(false);

    useEffect(() => {
        const updateTime = () => {
            const classDate = new Date(meetingDate);
            const now = new Date();
            const minutesUntil = differenceInMinutes(classDate, now);

            // Class is live if it's within 15 minutes before or 2 hours after scheduled time
            const isCurrentlyLive = minutesUntil >= -120 && minutesUntil <= 15;
            setIsLive(isCurrentlyLive);

            // Class is upcoming if it's in the future
            setIsUpcoming(isFuture(classDate) && !isCurrentlyLive);

            if (isUpcoming) {
                setTimeUntil(formatDistanceToNow(classDate, { addSuffix: true }));
            }
        };

        updateTime();
        const interval = setInterval(updateTime, 30000); // Update every 30 seconds

        return () => clearInterval(interval);
    }, [meetingDate]);

    const getPlatformInfo = () => {
        switch (meetingPlatform) {
            case 'google_meet':
                return { name: 'Google Meet', color: 'bg-blue-500', icon: '📹' };
            case 'zoom':
                return { name: 'Zoom', color: 'bg-blue-600', icon: '💼' };
            case 'teams':
                return { name: 'Microsoft Teams', color: 'bg-purple-600', icon: '👥' };
            default:
                return { name: 'Video Call', color: 'bg-gray-600', icon: '🎥' };
        }
    };

    const platform = getPlatformInfo();
    const classDate = new Date(meetingDate);

    return (
        <Card className="border-2 border-primary/20 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3 sm:pb-4">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                    <div className="flex-1 w-full">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Badge className={`${platform.color} text-white text-xs sm:text-sm`}>
                                {platform.icon} {platform.name}
                            </Badge>
                            {isLive && (
                                <Badge className="bg-red-500 text-white animate-pulse text-xs sm:text-sm">
                                    🔴 LIVE NOW
                                </Badge>
                            )}
                            {isUpcoming && (
                                <Badge variant="outline" className="border-blue-500 text-blue-600 text-xs sm:text-sm">
                                    📅 Upcoming
                                </Badge>
                            )}
                        </div>
                        <CardTitle className="text-xl sm:text-2xl mb-1 sm:mb-2">{lessonTitle}</CardTitle>
                        <CardDescription className="text-sm sm:text-base">
                            Live Class Session
                        </CardDescription>
                    </div>
                    <Video className="hidden sm:block h-12 w-12 text-primary opacity-20" />
                </div>
            </CardHeader>

            <CardContent className="space-y-3 sm:space-y-4">
                {/* Class Info */}
                <div className="space-y-2 sm:space-y-3 p-3 sm:p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium break-words">
                            {format(classDate, 'EEEE, MMMM d, yyyy')}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm flex-wrap">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium">
                            {format(classDate, 'h:mm a')}
                        </span>
                        {isUpcoming && (
                            <span className="text-muted-foreground">
                                (Starts {timeUntil})
                            </span>
                        )}
                    </div>

                    {instructorName && (
                        <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                            <User className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                            <span className="font-medium">{instructorName}</span>
                        </div>
                    )}
                </div>

                {/* Countdown or Live Indicator */}
                {isLive && (
                    <div className="p-3 sm:p-4 bg-red-50 dark:bg-red-950 border-2 border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-center font-semibold text-red-600 dark:text-red-400 text-sm sm:text-base">
                            🎓 Class is live! Join now to participate
                        </p>
                    </div>
                )}

                {isUpcoming && (
                    <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-950 border-2 border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-center font-semibold text-blue-600 dark:text-blue-400 text-sm sm:text-base">
                            ⏰ Class starts {timeUntil}
                        </p>
                    </div>
                )}

                {!isLive && !isUpcoming && (
                    <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-lg">
                        <p className="text-center text-xs sm:text-sm text-muted-foreground">
                            This class has ended
                        </p>
                    </div>
                )}

                {/* Join Button */}
                <Button
                    onClick={() => window.open(meetingUrl, '_blank', 'noopener,noreferrer')}
                    className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold"
                    size="lg"
                    disabled={!isLive && !isUpcoming}
                >
                    <ExternalLink className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="truncate">
                        {isLive ? '🚀 Join Class Now' : isUpcoming ? `🚀 Join on ${platform.name}` : 'Class Ended'}
                    </span>
                </Button>

                {/* Helper Text */}
                <p className="text-xs text-center text-muted-foreground px-2">
                    Clicking the button will open {platform.name} in a new tab
                </p>
            </CardContent>
        </Card>
    );
}
