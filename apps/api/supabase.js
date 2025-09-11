// SupabaseClient.ts
export class SupabaseClient {
    url;
    key;
    constructor(url = 'https://ptfxzushovdqzbtoksxj.supabase.co', key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0Znh6dXNob3ZkcXpidG9rc3hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5ODk5NjIsImV4cCI6MjA3MDU2NTk2Mn0.GyeHzzCeOs-1FMWT5iGRolw-wKksNtg7ad5Uc5247Hk') {
        this.url = url.endsWith('/') ? url.slice(0, -1) : url;
        this.key = key;
    }
    async request(table, options = {}) {
        const fullUrl = new URL(`${this.url}/rest/v1/${table}`);
        if (options.query) {
            for (const [k, v] of Object.entries(options.query)) {
                fullUrl.searchParams.append(k, v);
            }
        }
        const res = await fetch(fullUrl.toString(), {
            method: options.method || 'GET',
            headers: {
                apikey: this.key,
                Authorization: `Bearer ${this.key}`,
                'Content-Type': 'application/json',
                Prefer: 'return=representation',
            },
            body: options.body ? JSON.stringify(options.body) : undefined,
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Supabase error ${res.status}: ${text}`);
        }
        return res.json();
    }
    // CRUD methods
    get(table, query) {
        return this.request(table, { method: 'GET', query });
    }
    insert(table, rows) {
        return this.request(table, { method: 'POST', body: rows });
    }
    update(table, rows, query) {
        return this.request(table, { method: 'PATCH', body: rows, query });
    }
    delete(table, query) {
        return this.request(table, { method: 'DELETE', query });
    }
}
