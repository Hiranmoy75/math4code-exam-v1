import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

// --- TYPES ---
export type Message = {
    id?: string;
    role: 'user' | 'ai';
    content: string;
    created_at?: string;
};

export type ChatSession = {
    id: string;
    title: string;
    created_at: string;
};

// --- CLIENT ---
const supabase = createClient();

// --- KEYS ---
export const chatKeys = {
    all: ['chat'] as const,
    sessions: () => [...chatKeys.all, 'sessions'] as const,
    messages: (sessionId: string | null) => [...chatKeys.all, 'messages', sessionId] as const,
};

export const useChatHistory = (userId: string | null) => {
    return useQuery({
        queryKey: [...chatKeys.sessions(), userId],
        queryFn: async () => {
            if (!userId) return [];
            const { data, error } = await supabase
                .from('chat_sessions')
                .select('*')
                .eq('user_id', userId) // Filter sessions by user ID
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as ChatSession[];
        },
        enabled: !!userId, // Only fetch if userId exists
    });
};

// 2. Fetch Messages for a Session
export const useChatMessages = (sessionId: string | null) => {
    return useQuery({
        queryKey: chatKeys.messages(sessionId),
        queryFn: async () => {
            if (!sessionId) return [];
            const { data, error } = await supabase
                .from('chat_messages')
                .select('*')
                .eq('session_id', sessionId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            return data.map((msg: any) => ({
                id: msg.id,
                role: msg.role as 'user' | 'ai',
                content: msg.content,
                created_at: msg.created_at
            })) as Message[];
        },
        enabled: !!sessionId,
        staleTime: 1000 * 60 * 5,
    });
};

// 3. Create a New Session (Modified to include userId)
export const useCreateSession = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ firstMessage, userId }: { firstMessage: string, userId: string }) => {
            const title = firstMessage.length > 40 ? firstMessage.substring(0, 40) + "..." : firstMessage;
            const { data, error } = await supabase
                .from('chat_sessions')
                .insert([{ title, user_id: userId }]) // Save with user ID
                .select()
                .single();

            if (error) throw error;
            return data as ChatSession;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: chatKeys.sessions() });
        },
    });
};

// 4. Save a Message
export const useSaveMessage = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ sessionId, role, content }: { sessionId: string; role: 'user' | 'ai'; content: string }) => {
            const { data, error } = await supabase
                .from('chat_messages')
                .insert([{ session_id: sessionId, role, content }])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: chatKeys.messages(variables.sessionId) });
        },
    });
};


