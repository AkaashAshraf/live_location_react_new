export default function DriverTrip() {
  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-50 p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        🛣️ Driver Trip
      </h2>
      <div className="w-full max-w-3xl h-[500px] bg-gray-200 rounded-xl shadow-inner flex items-center justify-center">
        {/* Google Map or Trip data will go here */}
        <p className="text-gray-500">Google Map - Driver Trip</p>
      </div>
    </div>
  );
}
