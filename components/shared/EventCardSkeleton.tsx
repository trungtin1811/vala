export function EventCardSkeleton() {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm flex flex-col gap-4 animate-pulse">
      <div className="flex justify-between gap-3">
        <div className="h-5 bg-[#E5E7EB] rounded w-2/3" />
        <div className="h-5 bg-[#E5E7EB] rounded-full w-20 shrink-0" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="h-4 bg-[#E5E7EB] rounded w-3/4" />
        <div className="h-4 bg-[#E5E7EB] rounded w-1/2" />
        <div className="h-4 bg-[#E5E7EB] rounded w-1/3" />
      </div>
      <div className="flex gap-2">
        <div className="h-6 bg-[#E5E7EB] rounded-full w-24" />
        <div className="h-6 bg-[#E5E7EB] rounded-full w-24" />
      </div>
    </div>
  )
}
