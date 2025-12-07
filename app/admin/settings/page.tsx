'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Video, Key, Database } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
    const settingsCategories = [
        {
            title: 'Bunny.net Video Hosting',
            description: 'Configure your Bunny.net credentials for video uploads and live streaming',
            icon: Video,
            href: '/admin/settings/bunny',
            color: 'text-orange-600',
            bgColor: 'bg-orange-100 dark:bg-orange-900/20'
        },
        {
            title: 'API Keys',
            description: 'Manage API keys and integrations',
            icon: Key,
            href: '/admin/settings/api',
            color: 'text-blue-600',
            bgColor: 'bg-blue-100 dark:bg-blue-900/20',
            disabled: true
        },
        {
            title: 'Database',
            description: 'Database configuration and backups',
            icon: Database,
            href: '/admin/settings/database',
            color: 'text-green-600',
            bgColor: 'bg-green-100 dark:bg-green-900/20',
            disabled: true
        }
    ];

    return (
        <div className="p-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Settings</h1>
                    <p className="text-muted-foreground">
                        Manage your application settings and integrations
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {settingsCategories.map((category) => (
                        <Card
                            key={category.href}
                            className={`hover:shadow-lg transition-shadow ${category.disabled ? 'opacity-50' : ''}`}
                        >
                            <CardHeader>
                                <div className={`w-12 h-12 rounded-lg ${category.bgColor} flex items-center justify-center mb-4`}>
                                    <category.icon className={`h-6 w-6 ${category.color}`} />
                                </div>
                                <CardTitle className="text-xl">{category.title}</CardTitle>
                                <CardDescription>{category.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {category.disabled ? (
                                    <Button variant="outline" disabled className="w-full">
                                        Coming Soon
                                    </Button>
                                ) : (
                                    <Link href={category.href}>
                                        <Button className="w-full">
                                            Configure
                                        </Button>
                                    </Link>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
