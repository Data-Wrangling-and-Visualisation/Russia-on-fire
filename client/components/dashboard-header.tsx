import { Flame } from "lucide-react"

export default function DashboardHeader() {
  return (
    <div className="flex flex-col items-center text-center mb-12 pt-8">
      <div className="flex items-center gap-4 mb-6">
        <Flame className="h-16 w-16 text-red-600 animate-pulse" />
        <h1 className="text-6xl font-extrabold tracking-tighter bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 text-transparent bg-clip-text font-heading">
          RUSSIA ON FIRE
        </h1>
        <Flame className="h-16 w-16 text-red-600 animate-pulse" />
      </div>
      <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl leading-relaxed">
        A comprehensive visualization of wildfire data across Russian regions, revealing patterns of fire incidents,
        affected areas, and environmental impact over time. Explore the data through interactive maps, charts, and
        timelines.
      </p>
      <div className="w-48 h-1.5 bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 rounded-full mt-8"></div>
    </div>
  )
}
