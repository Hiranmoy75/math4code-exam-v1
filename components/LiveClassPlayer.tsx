'use client';

import React, { useEffect, useRef } from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { Loader2 } from 'lucide-react';

interface LiveClassPlayerProps {
    roomName: string;
    userName: string;
    userEmail: string;
    isTeacher: boolean;
    onMeetingEnd?: () => void;
}

export function LiveClassPlayer({
    roomName,
    userName,
    userEmail,
    isTeacher,
    onMeetingEnd
}: LiveClassPlayerProps) {
    const [isLoading, setIsLoading] = React.useState(true);

    // Generate clean room name
    const cleanRoomName = roomName.replace(/[^a-zA-Z0-9]/g, '_');

    // Teacher configuration - full controls
    const teacherConfig = {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        disableInviteFunctions: false,
        enableWelcomePage: false,
        prejoinPageEnabled: false,
        toolbarButtons: [
            'camera',
            'chat',
            'closedcaptions',
            'desktop',
            'download',
            'embedmeeting',
            'etherpad',
            'feedback',
            'filmstrip',
            'fullscreen',
            'hangup',
            'help',
            'highlight',
            'invite',
            'linktosalesforce',
            'livestreaming',
            'microphone',
            'mute-everyone',
            'mute-video-everyone',
            'participants-pane',
            'profile',
            'raisehand',
            'recording',
            'security',
            'select-background',
            'settings',
            'shareaudio',
            'sharedvideo',
            'shortcuts',
            'stats',
            'tileview',
            'toggle-camera',
            'videoquality',
            'whiteboard'
        ],
    };

    // Student configuration - minimal UI
    const studentConfig = {
        startWithAudioMuted: true,
        startWithVideoMuted: true,
        disableInviteFunctions: true,
        enableWelcomePage: false,
        prejoinPageEnabled: false,
        toolbarButtons: [
            'camera',
            'chat',
            'desktop',
            'fullscreen',
            'hangup',
            'microphone',
            'raisehand',
            'tileview',
            'toggle-camera'
        ],
        disableModeratorIndicator: true,
        disableProfile: true,
        disableRemoteMute: true,
    };

    const config = isTeacher ? teacherConfig : studentConfig;

    const interfaceConfig = {
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        SHOW_BRAND_WATERMARK: false,
        BRAND_WATERMARK_LINK: '',
        SHOW_POWERED_BY: false,
        DISPLAY_WELCOME_PAGE_CONTENT: false,
        DISPLAY_WELCOME_PAGE_TOOLBAR_ADDITIONAL_CONTENT: false,
        APP_NAME: 'Math4Code Live Class',
        NATIVE_APP_NAME: 'Math4Code',
        PROVIDER_NAME: 'Math4Code',
        MOBILE_APP_PROMO: false,
        TOOLBAR_ALWAYS_VISIBLE: false,
        SETTINGS_SECTIONS: isTeacher
            ? ['devices', 'language', 'moderator', 'profile', 'calendar']
            : ['devices', 'language', 'profile'],
    };

    return (
        <div className="w-full h-full min-h-[600px] relative bg-gray-900 rounded-lg overflow-hidden">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
                    <div className="text-center">
                        <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
                        <p className="text-white text-lg">Joining live class...</p>
                        <p className="text-gray-400 text-sm mt-2">Please wait</p>
                    </div>
                </div>
            )}

            <JitsiMeeting
                domain="meet.jit.si"
                roomName={cleanRoomName}
                configOverwrite={config}
                interfaceConfigOverwrite={interfaceConfig}
                userInfo={{
                    displayName: userName,
                    email: userEmail,
                }}
                onApiReady={(externalApi) => {
                    console.log('Jitsi API ready');
                    setIsLoading(false);

                    // Set display name
                    externalApi.executeCommand('displayName', userName);

                    // Set email
                    externalApi.executeCommand('email', userEmail);

                    // Additional teacher commands
                    if (isTeacher) {
                        externalApi.executeCommand('subject', 'Live Class');
                    }
                }}
                onReadyToClose={() => {
                    console.log('Meeting ended');
                    onMeetingEnd?.();
                }}
                getIFrameRef={(iframeRef) => {
                    iframeRef.style.height = '100%';
                    iframeRef.style.width = '100%';
                }}
            />
        </div>
    );
}
