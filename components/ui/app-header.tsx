import LocationPinIcon from "./location-pin-icon"

export default function AppHeader() {
  return (
    <div className="w-full bg-[#f0e0ff] p-3 mb-4">
      <div className="flex items-center">
        <LocationPinIcon className="h-5 w-5 mr-2 text-black" />
        <span className="font-bold text-black">WANDERLY</span>
      </div>
    </div>
  )
}
