"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

type CommunityModalOptions = {
    courseId?: string;
    isAdmin?: boolean;
};

type CommunityModalContextType = {
    isOpen: boolean;
    openCommunity: (options?: CommunityModalOptions) => void;
    closeCommunity: () => void;
    options: CommunityModalOptions;
};

const CommunityModalContext = createContext<CommunityModalContextType | undefined>(undefined);

export function CommunityModalProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<CommunityModalOptions>({});

    const openCommunity = (opts: CommunityModalOptions = {}) => {
        setOptions(opts);
        setIsOpen(true);
    };

    const closeCommunity = () => {
        setIsOpen(false);
        // Reset options after a delay to avoid UI storage clearing while closing animation runs
        setTimeout(() => setOptions({}), 300);
    };

    return (
        <CommunityModalContext.Provider value={{ isOpen, openCommunity, closeCommunity, options }}>
            {children}
        </CommunityModalContext.Provider>
    );
}

export function useCommunityModal() {
    const context = useContext(CommunityModalContext);
    if (!context) {
        throw new Error('useCommunityModal must be used within CommunityModalProvider');
    }
    return context;
}
