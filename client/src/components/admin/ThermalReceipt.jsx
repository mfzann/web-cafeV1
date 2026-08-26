import React from 'react';
import { formatRupiah, formatDate } from '../../utils/formatters.js';

export default function ThermalReceipt({ order, settings }) {
  if (!order) return null;

  return (
    <div id="thermal-receipt" className="hidden print:block p-4 font-mono text-xs text-black bg-white w-[80mm] mx-auto">
      {/* Cafe Header Header */}
      <div className="text-center pb-2 border-b border-dashed border-black">
        <h2 className="font-bold text-sm uppercase">{settings?.cafe_name || 'CAFEORDER BISTRO'}</h2>
        <p className="text-[10px]">{settings?.cafe_address || 'Jl. Riau No. 45, Bandung'}</p>
        <p className="text-[10px]">Struk Pembayaran / Dapur</p>
      </div>

      {/* Transaction Metadata */}
      <div className="py-2 border-b border-dashed border-black text-[11px] space-y-0.5">
        <div className="flex justify-between">
          <span>No Order:</span>
          <span className="font-bold">{order.id}</span>
        </div>
        <div className="flex justify-between">
          <span>Waktu:</span>
          <span>{formatDate(order.created_at)}</span>
        </div>
        <div className="flex justify-between">
          <span>Tipe:</span>
          <span className="font-bold uppercase">
            {order.order_type === 'dine_in' ? `MEJA ${order.table_number}` : 'TAKEAWAY'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Pemesan:</span>
          <span>{order.customer_name || '-'}</span>
        </div>
      </div>

      {/* Items Breakdown Table */}
      <div className="py-2 border-b border-dashed border-black space-y-1 text-[11px]">
        {order.items?.map((item, idx) => (
          <div key={idx} className="space-y-0.5">
            <div className="flex justify-between font-bold">
              <span>{item.quantity}x {item.item_name}</span>
              <span>{formatRupiah(item.subtotal)}</span>
            </div>
            {item.note && (
              <p className="text-[10px] italic pl-2">* {item.note}</p>
            )}
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="py-2 border-b border-dashed border-black space-y-1 text-[11px]">
        <div className="flex justify-between font-bold text-xs pt-1 border-t border-black">
          <span>TOTAL BAYAR:</span>
          <span>{formatRupiah(order.total_amount)}</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span>Status Bayar:</span>
          <span className="font-bold uppercase">{order.payment_status === 'settlement' ? 'LUNAS' : order.payment_status}</span>
        </div>
        {order.payment_type && (
          <div className="flex justify-between text-[10px]">
            <span>Metode:</span>
            <span>{order.payment_type}</span>
          </div>
        )}
      </div>

      {/* Footer message */}
      <div className="text-center pt-3 text-[10px]">
        <p className="font-bold">Terima kasih atas kunjungan Anda!</p>
        <p>Silakan simpan struk ini sebagai bukti pembayaran.</p>
      </div>
    </div>
  );
}
