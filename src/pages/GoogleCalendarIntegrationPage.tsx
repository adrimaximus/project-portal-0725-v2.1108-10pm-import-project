import React, { useState, useEffect } from "react";
import PortalLayout from "@/components/PortalLayout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import toast from "react-hot-toast";
import { Session, User } from "@supabase/supabase-js";

const GoogleCalendarIntegrationPage = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [session, setSession] = useState<Session | null>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (_event === 'SIGNED_IN') {
                if (session?.provider_refresh_token && session.user) {
                    updateProfileWithToken(session.user, session.provider_refresh_token);
                }
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        const checkConnection = async () => {
            setIsLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('google_calendar_settings')
                    .eq('id', user.id)
                    .single();

                if (profile && profile.google_calendar_settings?.refresh_token) {
                    setIsConnected(true);
                } else {
                    setIsConnected(false);
                }
            }
            setIsLoading(false);
        };

        if (session) {
            checkConnection();
        } else {
            setIsLoading(false);
        }
    }, [session]);

    const updateProfileWithToken = async (user: User, refreshToken: string) => {
        const { error } = await supabase
            .from('profiles')
            .update({ google_calendar_settings: { refresh_token: refreshToken, connected_at: new Date().toISOString() } })
            .eq('id', user.id);

        if (error) {
            toast.error("Gagal menyimpan koneksi: " + error.message);
        } else {
            toast.success("Berhasil terhubung ke Google Calendar!");
            setIsConnected(true);
        }
    };

    const handleConnect = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                scopes: 'https://www.googleapis.com/auth/calendar',
                redirectTo: window.location.href,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        });

        if (error) {
            toast.error("Gagal terhubung ke Google Calendar: " + error.message);
        }
    };

    const handleDisconnect = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { error } = await supabase
                .from('profiles')
                .update({ google_calendar_settings: null })
                .eq('id', user.id);

            if (error) {
                toast.error("Gagal memutuskan koneksi: " + error.message);
            } else {
                toast.success("Berhasil memutuskan koneksi dari Google Calendar.");
                setIsConnected(false);
            }
        }
    };

    return (
        <PortalLayout>
            <div className="space-y-6">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link to="/settings">Settings</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link to="/settings/integrations">Integrations</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Google Calendar</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <img src="https://quuecudndfztjlxbrvyb.supabase.co/storage/v1/object/public/General/FileGoogle%20Calendar%20icon%20(2020).svg%20-%20Wikimedia%20Commons.png" alt="Google Calendar icon" className="h-8 w-8" />
                            <div>
                                <CardTitle>Google Calendar</CardTitle>
                                <CardDescription>Sinkronkan proyek dan tugas Anda dengan Google Calendar.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <p>Memuat status koneksi...</p>
                        ) : isConnected ? (
                            <div className="space-y-4">
                                <p className="text-green-600 font-semibold">Berhasil terhubung ke Google Calendar.</p>
                                <p className="text-sm text-muted-foreground">Proyek dan tugas Anda sekarang akan disinkronkan.</p>
                                <Button variant="destructive" onClick={handleDisconnect}>Putuskan Koneksi</Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p>Hubungkan akun Google Calendar Anda untuk menyinkronkan acara dan tenggat waktu.</p>
                                <Button onClick={handleConnect}>Hubungkan ke Google Calendar</Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </PortalLayout>
    );
};

export default GoogleCalendarIntegrationPage;