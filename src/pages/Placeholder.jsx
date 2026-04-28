import BottomNav from '../components/BottomNav'

export function Usage() {
  return (
    <div className="min-h-screen bg-app-bg pb-24">
      <div className="bg-surface border-b border-black/8 px-4 pt-3 pb-4">
        <h1 className="text-lg font-medium text-tx">Usage</h1>
        <p className="text-xs text-tx-2 mt-0.5">Energy · Water · Waste</p>
      </div>
      <div className="px-4 pt-8 text-center text-tx-3 text-sm">
        Coming soon
      </div>
      <BottomNav />
    </div>
  )
}

export function Reports() {
  return (
    <div className="min-h-screen bg-app-bg pb-24">
      <div className="bg-surface border-b border-black/8 px-4 pt-3 pb-4">
        <h1 className="text-lg font-medium text-tx">Reports</h1>
        <p className="text-xs text-tx-2 mt-0.5">Daily · Weekly · Benchmarks</p>
      </div>
      <div className="px-4 pt-8 text-center text-tx-3 text-sm">
        Coming soon
      </div>
      <BottomNav />
    </div>
  )
}

export function Settings() {
  return (
    <div className="min-h-screen bg-app-bg pb-24">
      <div className="bg-surface border-b border-black/8 px-4 pt-3 pb-4">
        <h1 className="text-lg font-medium text-tx">Settings</h1>
      </div>
      <div className="px-4 pt-8 text-center text-tx-3 text-sm">
        Coming soon
      </div>
      <BottomNav />
    </div>
  )
}
