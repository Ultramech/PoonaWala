import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { apiBase } from '../lib/api';

interface SessionSummary {
  session_id: string;
  phone: string | null;
  status: string;
  created_at: string;
  confidence_score: number | null;
  routing: string | null;
}

export function Dashboard() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${apiBase}/api/dashboard/sessions`)
      .then(r => r.json())
      .then(data => {
        setSessions(data);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-white">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-white overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">NBFC Risk Dashboard</h1>
          <Badge variant="outline" className="border-amber-500/30 text-amber-500">
            {sessions.length} Active Sessions
          </Badge>
        </div>

        <div className="grid gap-4">
          {sessions.map(session => (
            <Card key={session.session_id} className="bg-zinc-900 border-zinc-800 cursor-pointer hover:border-amber-500/50 transition-colors"
              onClick={() => navigate(`/dashboard/session/${session.session_id}`)}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-zinc-400">{session.session_id.split('-')[0]}...</span>
                    {session.routing === 'INSTANT' && <Badge className="bg-emerald-500/20 text-emerald-400">INSTANT</Badge>}
                    {session.routing === 'AGENT' && <Badge className="bg-amber-500/20 text-amber-400">AGENT</Badge>}
                    {session.routing === 'REJECT' && <Badge className="bg-rose-500/20 text-rose-400">REJECT</Badge>}
                  </div>
                  <div className="text-sm text-zinc-500">
                    {new Date(session.created_at).toLocaleString()} • {session.phone || 'No phone'}
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  {session.confidence_score !== null && (
                    <div className="text-right">
                      <div className="text-sm text-zinc-400">Confidence</div>
                      <div className="font-medium text-amber-500">
                        {(session.confidence_score * 100).toFixed(1)}%
                      </div>
                    </div>
                  )}
                  <ArrowRight className="h-5 w-5 text-zinc-600" />
                </div>
              </CardContent>
            </Card>
          ))}
          
          {sessions.length === 0 && (
            <div className="text-center p-12 text-zinc-500">
              No sessions found in the database.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
