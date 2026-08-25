export default function ForumRoomSkeleton() {
  return (
    <div className="bg-zm-card rounded-2xl border border-zm-border overflow-hidden flex flex-col h-[calc(100vh-17rem)] lg:h-[calc(100vh-13rem)] animate-pulse">
      <div className="flex items-center gap-3 px-4 h-16 border-b border-zm-border shrink-0">
        <div className="w-10 h-10 rounded-full bg-zm-hover shrink-0" />
        <div className="flex flex-col gap-2">
          <div className="h-3 w-40 rounded bg-zm-hover" />
          <div className="h-2.5 w-24 rounded bg-zm-hover" />
        </div>
      </div>
      <div className="flex-1 p-4 flex flex-col gap-3 bg-zm-bg/40">
        <div className="h-10 w-2/5 rounded-2xl bg-zm-hover self-start" />
        <div className="h-10 w-1/3 rounded-2xl bg-zm-hover self-end" />
        <div className="h-10 w-1/2 rounded-2xl bg-zm-hover self-start" />
        <div className="h-10 w-1/3 rounded-2xl bg-zm-hover self-start" />
      </div>
      <div className="p-3 border-t border-zm-border shrink-0">
        <div className="h-10 rounded-full bg-zm-hover" />
      </div>
    </div>
  );
}
