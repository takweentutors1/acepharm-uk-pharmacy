import { Button, Card, Badge } from '@acepharm/ui';

export default function DashboardPage() {
  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-border bg-surface sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-xl font-bold tracking-tight text-indigo">AcePharm</span>
            <nav className="hidden sm:flex items-center gap-4 text-sm font-medium text-slate">
              <a href="/dashboard" className="text-indigo">Dashboard</a>
              <a href="/session-builder" className="hover:text-ink">Practise</a>
              <a href="/progress" className="hover:text-ink">Progress</a>
              <a href="/flashcards" className="hover:text-ink">Flashcards</a>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="teal">Year 3 MPharm</Badge>
            <div className="w-8 h-8 rounded-full bg-indigo text-surface flex items-center justify-center font-bold text-xs">
              AP
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Action Card */}
          <Card className="p-6 md:col-span-2 flex flex-col justify-between">
            <div>
              <Badge variant="default" className="mb-3">Recommended Next Step</Badge>
              <h2 className="text-2xl font-bold text-ink">Cardiovascular System: Hypertension & ACE Inhibitors</h2>
              <p className="text-slate text-sm mt-2">
                Based on 8 recent attempts: First-attempt accuracy is 50% with 14 unseen questions available.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-3">
              <Button size="md" variant="primary">Start 10-Question Focus Session</Button>
              <Button size="md" variant="outline">View Subtopic Notes</Button>
            </div>
          </Card>

          {/* Goal & Streak Card */}
          <Card className="p-6 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate">Daily Target</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-ink">12</span>
                <span className="text-slate text-sm">/ 20 questions</span>
              </div>
              <div className="w-full bg-border h-2 rounded-full mt-3 overflow-hidden">
                <div className="bg-indigo h-full w-[60%] rounded-full" />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-sm">
              <span className="text-slate">Meaningful Streak</span>
              <span className="font-bold text-ink">🔥 4 Days</span>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
