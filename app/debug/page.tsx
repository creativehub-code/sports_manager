import { createClient } from '@/lib/supabase/server';

export default async function DebugPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();



    if (!user) return <pre style={{ color: 'white' }}>Not logged in</pre>;

    return (
        <pre style={{ color: 'white', padding: 20 }}>
            {JSON.stringify({
                email: user.email,
                user_metadata: user.user_metadata,
                app_metadata: user.app_metadata,
                role: user.user_metadata?.role,
            }, null, 2)}
        </pre>
    );
}