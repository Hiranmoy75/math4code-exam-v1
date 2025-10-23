"use client";

import React from "react";
import { Sidebar, SidebarBody, SidebarLink } from "../ui/aceternity/sidebar";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

interface SidebarDemoProps {
    open: boolean;
    setOpen: (value: boolean) => void;
}

export function SidebarDemo({ open, setOpen, links, profile }: any) {
    const getProfileImage = (name: string) => {
        if (!name) return "/default-avatar.png";
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(
            name
        )}&background=0D8ABC&color=fff&size=128&rounded=true`;
    };


    return (
        <div className="flex flex-col h-full mx-auto flex w-full max-w-7xl flex-1 flex-col overflow-hidden rounded-md border border-neutral-200 bg-gray-100 md:flex-row dark:border-neutral-700 dark:bg-neutral-800">
            <Sidebar open={open} setOpen={setOpen}>
                <SidebarBody className="flex flex-col justify-between h-full p-4">
                    <div className="flex flex-col flex-1 overflow-y-auto">
                        {open ? <Logo /> : <LogoIcon />}
                        <div className="mt-8 flex flex-col gap-2">
                            {links.map((link: any, idx: any) => (
                                <SidebarLink key={idx} link={link} />
                            ))}
                        </div>
                    </div>

                    <div className="mt-4">
                        <SidebarLink
                            link={{
                                label: profile.full_name,
                                href: "#",
                                icon: (
                                    <Image
                                        src={getProfileImage(profile.full_name)}
                                        alt="Profile"
                                        width={32}
                                        height={32}
                                        className="rounded-full border border-[var(--sidebar-border)]"
                                        unoptimized // important for SVGs
                                    />
                                ),
                            }}
                        />
                    </div>
                </SidebarBody>
            </Sidebar>
        </div>
    );
}

export const Logo = () => (
    <Link href="#" className="relative z-20 flex items-center space-x-2 py-1 text-sm font-medium dark:text-white">
        <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-white" />
        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-medium whitespace-pre">
            math4code
        </motion.span>
    </Link>
);

export const LogoIcon = () => (
    <Link href="#" className="relative z-20 flex items-center space-x-2 py-1 text-sm font-medium dark:text-white">
        <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-white" />
    </Link>
);
