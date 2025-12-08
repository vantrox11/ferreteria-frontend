import { useMemo } from 'react';

/**
 * Configuración de IGV en Perú
 */
const TASA_IGV = 18.00;
const FACTOR_IGV = 1.18;

/**
 * Item de detalle de orden de compra
 */
export interface OrdenCompraDetalleItem {
  producto_id: number;
  producto_nombre: string;
  cantidad: number;
  costo_unitario: number; // Precio con IGV incluido
}

/**
 * Resultado del cálculo de totales
 */
export interface TotalesOrdenCompra {
  subtotal_base: number;   // Total sin IGV
  impuesto_igv: number;     // Total de IGV
  total: number;            // Total con IGV
  detalles: DetalleCalculado[];
}

/**
 * Detalle de un item con cálculos de IGV
 */
export interface DetalleCalculado {
  producto_id: number;
  producto_nombre: string;
  cantidad: number;
  costo_unitario_total: number;  // Con IGV
  costo_unitario_base: number;   // Sin IGV
  tasa_igv: number;              // Tasa aplicada (18.00)
  igv_linea: number;             // IGV de esta línea
  subtotal_linea: number;        // Subtotal con IGV de la línea
}

/**
 * Hook para calcular totales de orden de compra con desglose de IGV
 * 
 * Fórmulas aplicadas:
 * - costo_unitario_base = costo_unitario_total / 1.18
 * - igv_linea = (costo_unitario_base * 0.18) * cantidad
 * - subtotal_linea = costo_unitario_total * cantidad
 * 
 * @param detalles Array de items de la orden de compra
 * @returns Totales calculados y detalles con desglose de IGV
 */
export function usePurchaseOrderCalculator(
  detalles: OrdenCompraDetalleItem[]
): TotalesOrdenCompra {
  const resultado = useMemo(() => {
    // Calcular desglose por cada item
    const detallesCalculados: DetalleCalculado[] = detalles.map((item) => {
      const costoConIGV = item.costo_unitario;
      const costoBase = costoConIGV / FACTOR_IGV;
      const igvUnitario = costoBase * (TASA_IGV / 100);
      const igvLinea = igvUnitario * item.cantidad;
      const subtotalLinea = costoConIGV * item.cantidad;

      return {
        producto_id: item.producto_id,
        producto_nombre: item.producto_nombre,
        cantidad: item.cantidad,
        costo_unitario_total: Number(costoConIGV.toFixed(4)),
        costo_unitario_base: Number(costoBase.toFixed(4)),
        tasa_igv: TASA_IGV,
        igv_linea: Number(igvLinea.toFixed(2)),
        subtotal_linea: Number(subtotalLinea.toFixed(2)),
      };
    });

    // Sumar totales
    const subtotal_base = detallesCalculados.reduce(
      (acc, d) => acc + d.costo_unitario_base * d.cantidad,
      0
    );
    const impuesto_igv = detallesCalculados.reduce(
      (acc, d) => acc + d.igv_linea,
      0
    );
    const total = detallesCalculados.reduce(
      (acc, d) => acc + d.subtotal_linea,
      0
    );

    return {
      subtotal_base: Number(subtotal_base.toFixed(2)),
      impuesto_igv: Number(impuesto_igv.toFixed(2)),
      total: Number(total.toFixed(2)),
      detalles: detallesCalculados,
    };
  }, [detalles]);

  return resultado;
}

/**
 * Utilidad para formatear montos con el símbolo de moneda
 */
export function formatCurrency(amount: number): string {
  return `S/ ${amount.toFixed(2)}`;
}

/**
 * Utilidad para validar que un monto sea positivo y tenga máximo 2 decimales
 */
export function validateAmount(amount: number): boolean {
  if (amount <= 0) return false;
  const decimals = (amount.toString().split('.')[1] || '').length;
  return decimals <= 4; // Permitir 4 decimales en costos unitarios
}

/**
 * Utilidad para calcular el desglose de un solo item
 * Útil para preview antes de agregar a la orden
 */
export function calcularDesgloseItem(
  costoUnitarioConIGV: number,
  cantidad: number
): {
  costoBase: number;
  igvUnitario: number;
  igvTotal: number;
  subtotal: number;
} {
  const costoBase = costoUnitarioConIGV / FACTOR_IGV;
  const igvUnitario = costoBase * (TASA_IGV / 100);
  const igvTotal = igvUnitario * cantidad;
  const subtotal = costoUnitarioConIGV * cantidad;

  return {
    costoBase: Number(costoBase.toFixed(4)),
    igvUnitario: Number(igvUnitario.toFixed(4)),
    igvTotal: Number(igvTotal.toFixed(2)),
    subtotal: Number(subtotal.toFixed(2)),
  };
}
