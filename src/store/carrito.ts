import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ItemCarrito = {
  productoId: number;
  nombre: string;
  precio: number;
  cantidad: number;
  stock: number;
};

type CarritoState = {
  carrito: ItemCarrito[];
  agregarItem: (item: Omit<ItemCarrito, 'cantidad'>, cantidad?: number) => void;
  eliminarItem: (productoId: number) => void;
  actualizarCantidad: (productoId: number, cantidad: number) => void;
  vaciarCarrito: () => void;
  total: () => number;
};

export const useCarritoStore = create<CarritoState>()(
  persist(
    (set, get) => ({
      carrito: [],

      agregarItem: (item, cantidad = 1) => {
        const carrito = get().carrito;
        const existe = carrito.find(i => i.productoId === item.productoId);

        if (existe) {
          const nuevaCantidad = Math.min(existe.cantidad + cantidad, item.stock);
          set({
            carrito: carrito.map(i =>
              i.productoId === item.productoId
                ? { ...i, cantidad: nuevaCantidad }
                : i
            ),
          });
        } else {
          set({
            carrito: [...carrito, { ...item, cantidad: Math.min(cantidad, item.stock) }],
          });
        }
      },

      eliminarItem: (productoId) => {
        set({
          carrito: get().carrito.filter(i => i.productoId !== productoId),
        });
      },

      actualizarCantidad: (productoId, cantidad) => {
        set({
          carrito: get().carrito.map(i =>
            i.productoId === productoId
              ? { ...i, cantidad: Math.min(cantidad, i.stock) }
              : i
          ),
        });
      },

      vaciarCarrito: () => {
        set({ carrito: [] });
      },

      total: () => {
        return get().carrito.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
      },
    }),
    {
      name: 'carrito-storage', // clave en localStorage
    }
  )
);
