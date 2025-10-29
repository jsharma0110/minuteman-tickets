'use client'
import React, { useState } from 'react';
import { MessageCircle, ChevronLeft } from 'lucide-react';

export default function TicketListingPage() {
  const [section, setSection] = useState('');
  const [row, setRow] = useState('');
  const [seat, setSeat] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    if (!section || !row || !seat || !price) {
      alert('Please fill in all required fields');
      return;
    }
    alert(`Ticket listed!\nSection: ${section}\nRow: ${row}\nSeat: ${seat}\nPrice: $${price}\nQuantity: ${quantity}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="text-gray-600 hover:text-gray-900">
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">List Your Ticket</h1>
          </div>
          <button className="text-gray-600 hover:text-gray-900">
            <MessageCircle size={24} />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Event Info Card */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          <img 
            src="https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop"
            alt="Basketball game at Mullins Center"
            className="w-full h-48 object-cover"
          />
          <div className="p-4">
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              UMass vs UConn Basketball Game @ Mullins Center
            </h2>
            <p className="text-gray-500">Feb 15, 2026</p>
          </div>
        </div>

        {/* Listing Form */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ticket Details</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Section
                </label>
                <input
                  type="text"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  placeholder="e.g., 101"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder:text-gray-500"/>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Row
                </label>
                <input
                  type="text"
                  value={row}
                  onChange={(e) => setRow(e.target.value)}
                  placeholder="e.g., A"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder:text-gray-500"                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seat
                </label>
                <input
                  type="text"
                  value={seat}
                  onChange={(e) => setSeat(e.target.value)}
                  placeholder="e.g., 12"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder:text-gray-500"                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price per Ticket ($)
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder:text-gray-500"                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="1"
                  max="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder:text-gray-500"                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special conditions or details about the tickets..."
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none text-gray-900 placeholder:text-gray-500"              />
            </div>

            {/* Pricing Summary */}
            {price && quantity && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900 font-medium">
                    ${(parseFloat(price) * parseInt(quantity)).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Platform Fee (5%)</span>
                  <span className="text-gray-600">
                    ${(parseFloat(price) * parseInt(quantity) * 0.05).toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-gray-300 mt-2 pt-2 flex justify-between items-center">
                  <span className="font-semibold text-gray-900">You'll Receive</span>
                  <span className="text-xl font-bold text-green-600">
                    ${(parseFloat(price) * parseInt(quantity) * 0.95).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={handleSubmit}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              List Ticket for Sale
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Listing Guidelines</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Tickets are immediately visible to buyers</li>
            <li>• You'll be notified when someone purchases your ticket</li>
            <li>• Transfer tickets electronically through the platform</li>
            <li>• Payment is released after successful transfer</li>
          </ul>
        </div>
      </div>
    </div>
  );
}