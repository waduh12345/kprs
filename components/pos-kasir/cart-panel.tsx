// app/(admin)/kasir/CartPanel.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Minus, Plus, Trash2 } from "lucide-react";
import type { CartItem } from "@/hooks/use-cart";

export default function CartPanel(props: {
  cartItems: CartItem[];
  onRemove: (productId: number) => void;
  onUpdateQty: (productId: number, qty: number) => void;
  total: number;
}) {
  const { cartItems, onRemove, onUpdateQty, total } = props;

  return (
    <Card className="shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-blue-600" />
            Keranjang Belanja
          </h2>
          <Badge variant="secondary" className="text-sm">
            {cartItems.length} item
          </Badge>
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Keranjang kosong</p>
            <p className="text-sm text-gray-400 mt-1">
              Pilih produk untuk memulai transaksi
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[70vh] overflow-y-auto">
            {cartItems.map((item) => (
              <div
                key={item.product_id}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">
                      {item.name}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Rp {item.price.toLocaleString("id-ID")} per item
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() =>
                          onUpdateQty(item.product_id, item.quantity - 1)
                        }
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() =>
                          onUpdateQty(item.product_id, item.quantity + 1)
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-bold text-green-600">
                      Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 mt-1"
                      onClick={() => onRemove(item.product_id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {cartItems.length > 0 && (
          <div className="border-t pt-4 mt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-bold text-gray-900">Total:</span>
              <span className="text-2xl font-bold text-green-600">
                Rp {total.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}