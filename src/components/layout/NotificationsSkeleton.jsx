export default function NotificationsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto animate-pulse">
      <div className="bg-zm-card rounded-2xl border border-zm-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zm-border">
          <div className="h-5 w-24 rounded bg-zm-hover" />
          <div className="h-3.5 w-28 rounded bg-zm-hover" />
        </div>
        <div>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-3 px-4 py-3">
              <div className="w-12 h-12 rounded-full bg-zm-hover shrink-0" />
              <div className="flex-1 flex flex-col gap-2 py-1">
                <div className="h-3 w-3/4 rounded bg-zm-hover" />
                <div className="h-2.5 w-16 rounded bg-zm-hover" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
