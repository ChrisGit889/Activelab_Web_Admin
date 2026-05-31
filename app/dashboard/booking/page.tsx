"use client";

import { useEffect, useState } from "react";
import { FiClock, FiMapPin, FiUser, FiCalendar } from "react-icons/fi";

interface Booking {
  id?: number;
  created_at: string;
  service: string;
  mentor_name: string;
  date: string;
  time: string;
  location: string;
}

export default function BookingPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = localStorage.getItem("token"); 
        const response = await fetch("http://localhost:5000/api/booking", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}` 
          },
        });

        const result = await response.json();
        if (result.success) {
          setBookings(result.data);
        }
      } catch (error) {
        console.error("Gagal memuat pesanan:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Daftar Transaksi</h1>
        <p className="text-gray-500 mt-2 text-sm">Pantau semua jadwal booking dari member ActiveLab di sini.</p>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 text-center">
          <p className="text-gray-500 font-medium">Belum ada pesanan yang masuk dari aplikasi.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal Dibuat</th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Layanan</th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mentor</th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Jadwal</th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Lokasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map((booking, index) => (
                  <tr key={booking.id || index} className="hover:bg-blue-50/50 transition-colors">
                    
                    <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-600">
                      {new Date(booking.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </td>
                    
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className="text-sm font-bold text-gray-900">{booking.service}</span>
                    </td>
                    
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-600 gap-2">
                        <FiUser className="text-gray-400" />
                        <span>{booking.mentor_name}</span>
                      </div>
                    </td>
                    
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center text-sm font-medium text-gray-800 gap-2">
                          <FiCalendar className="text-blue-500" />
                          <span>{booking.date}</span>
                        </div>
                        <div className="flex items-center text-xs text-gray-500 gap-2">
                          <FiClock className="text-blue-400" />
                          <span>{booking.time}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-600 gap-2">
                        <FiMapPin className="text-red-400" />
                        <span>{booking.location}</span>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}