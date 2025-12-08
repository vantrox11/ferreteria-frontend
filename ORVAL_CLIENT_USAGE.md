# 🚀 Uso del Cliente API Generado con Orval + React Query

## 📋 Resumen

El cliente API se genera automáticamente desde la especificación OpenAPI del backend usando **Orval** y **TanStack React Query v5**.

## 🔄 Regenerar el Cliente

Cada vez que cambies el backend, regenera el cliente:

```bash
# 1. Regenerar OpenAPI en el backend
cd c:\projectFerreteria\ferreteria-api
npm run generate:openapi

# 2. Regenerar cliente en el frontend
cd c:\projectFerreteria\ferreteria-frontend
npm run generate:api
```

## 📦 Estructura Generada

```
src/api/generated/
├── model/                    # Tipos TypeScript
│   ├── createProducto.ts
│   ├── producto.ts
│   ├── categoria.ts
│   └── ...
├── productos/                # Hooks de productos
│   └── productos.ts
├── categorías/               # Hooks de categorías
│   └── categorías.ts
├── clientes/                 # Hooks de clientes
├── ventas-pos/               # Hooks de ventas
├── pedidos/                  # Hooks de pedidos
├── inventario/               # Hooks de inventario
├── usuarios/                 # Hooks de usuarios
├── autenticación/            # Hooks de auth
└── ...                       # 19 módulos organizados por tags
```

## 🎯 Ejemplos de Uso

### 1. Listar Productos (Query GET)

```tsx
import { useGetApiProductos } from '@/api/generated/productos/productos';

function ProductosPage() {
  // Hook auto-generado con React Query
  const { data, isLoading, error, refetch } = useGetApiProductos({
    page: 1,
    limit: 20,
    // activo: true,  // Opcional
    // categoriaId: 'uuid',  // Opcional
  });

  if (isLoading) return <div>Cargando productos...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <button onClick={() => refetch()}>Refrescar</button>
      {data?.items.map(producto => (
        <div key={producto.id}>{producto.nombre}</div>
      ))}
    </div>
  );
}
```

### 2. Crear Producto (Mutation POST)

```tsx
import { usePostApiProductos } from '@/api/generated/productos/productos';
import type { CreateProducto } from '@/api/generated/model';

function CrearProductoForm() {
  const createMutation = usePostApiProductos();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newProducto: CreateProducto = {
      codigo: 'PROD-001',
      nombre: 'Martillo',
      descripcion: 'Martillo de carpintero',
      precio: 25.50,
      categoriaId: 'categoria-uuid',
      // ... más campos
    };

    try {
      const result = await createMutation.mutateAsync(newProducto);
      console.log('Producto creado:', result);
      // Mostrar notificación de éxito
    } catch (error) {
      console.error('Error al crear producto:', error);
      // Mostrar notificación de error
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Formulario */}
      <button 
        type="submit" 
        disabled={createMutation.isPending}
      >
        {createMutation.isPending ? 'Creando...' : 'Crear Producto'}
      </button>
    </form>
  );
}
```

### 3. Actualizar Producto (Mutation PUT)

```tsx
import { usePutApiProductosId } from '@/api/generated/productos/productos';
import type { UpdateProducto } from '@/api/generated/model';

function EditarProducto({ productoId }: { productoId: string }) {
  const updateMutation = usePutApiProductosId();

  const handleUpdate = async (data: UpdateProducto) => {
    try {
      await updateMutation.mutateAsync({
        id: productoId,
        data,
      });
      // Éxito
    } catch (error) {
      // Error
    }
  };

  return (
    <button onClick={() => handleUpdate({ nombre: 'Nuevo Nombre' })}>
      Actualizar
    </button>
  );
}
```

### 4. Eliminar Producto (Mutation DELETE)

```tsx
import { useDeleteApiProductosId } from '@/api/generated/productos/productos';

function EliminarProducto({ productoId }: { productoId: string }) {
  const deleteMutation = useDeleteApiProductosId();

  const handleDelete = async () => {
    if (!confirm('¿Eliminar producto?')) return;

    try {
      await deleteMutation.mutateAsync({ id: productoId });
      // Éxito
    } catch (error) {
      // Error
    }
  };

  return (
    <button onClick={handleDelete} disabled={deleteMutation.isPending}>
      {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
    </button>
  );
}
```

### 5. Con Invalidación de Queries

```tsx
import { useQueryClient } from '@tanstack/react-query';
import { usePostApiProductos, getGetApiProductosQueryKey } from '@/api/generated/productos/productos';

function CrearProductoConInvalidacion() {
  const queryClient = useQueryClient();
  const createMutation = usePostApiProductos({
    mutation: {
      onSuccess: () => {
        // Invalida y refetch automático de la lista
        queryClient.invalidateQueries({ 
          queryKey: getGetApiProductosQueryKey() 
        });
      },
    },
  });

  // ...
}
```

### 6. Obtener Producto Por ID

```tsx
import { useGetApiProductosId } from '@/api/generated/productos/productos';

function DetalleProducto({ id }: { id: string }) {
  const { data: producto, isLoading } = useGetApiProductosId(id);

  if (isLoading) return <div>Cargando...</div>;
  if (!producto) return <div>Producto no encontrado</div>;

  return (
    <div>
      <h1>{producto.nombre}</h1>
      <p>{producto.descripcion}</p>
      <p>Precio: S/ {producto.precio}</p>
    </div>
  );
}
```

### 7. Ventas POS

```tsx
import { useGetApiVentas, usePostApiVentas } from '@/api/generated/ventas-pos/ventas-pos';
import type { CreateVenta } from '@/api/generated/model';

function VentasPage() {
  const { data: ventas } = useGetApiVentas({ limit: 50 });
  const createVentaMutation = usePostApiVentas();

  const handleNuevaVenta = async (venta: CreateVenta) => {
    await createVentaMutation.mutateAsync(venta);
  };

  // ...
}
```

### 8. Pedidos y Reservas

```tsx
import { 
  useGetApiPedidos, 
  usePostApiPedidos,
  usePutApiPedidosIdEstado 
} from '@/api/generated/pedidos/pedidos';

function PedidosPage() {
  const { data: pedidos } = useGetApiPedidos();
  const createPedido = usePostApiPedidos();
  const updateEstado = usePutApiPedidosIdEstado();

  const confirmarPedido = async (id: string) => {
    await updateEstado.mutateAsync({
      id,
      data: { estado: 'confirmado' }
    });
  };

  // ...
}
```

## 🔧 Hooks Disponibles

Cada módulo incluye hooks para operaciones CRUD:

| Operación | Hook Pattern | Ejemplo |
|-----------|-------------|---------|
| GET (lista) | `useGet{Module}` | `useGetApiProductos()` |
| GET (por ID) | `useGet{Module}Id` | `useGetApiProductosId(id)` |
| POST | `usePost{Module}` | `usePostApiProductos()` |
| PUT | `usePut{Module}Id` | `usePutApiProductosId()` |
| DELETE | `useDelete{Module}Id` | `useDeleteApiProductosId()` |
| PATCH | `usePatch{Module}Id` | `usePatchApiProductosId()` |

## 🔑 Autenticación

El cliente usa `custom-instance.ts` que automáticamente:

1. **Agrega JWT token** desde `localStorage`
2. **Agrega tenant** desde subdomain o storage
3. **Maneja errores 401** (redirección al login)
4. **Intercepta respuestas** con manejo de errores

```typescript
// custom-instance.ts ya configurado con:
// - axios.interceptors.request: JWT + Tenant
// - axios.interceptors.response: Manejo 401/403
// - Base URL desde VITE_API_BASE_ORIGIN
```

## 📊 React Query DevTools

DevTools ya está configurado en `main.tsx`:

```tsx
<ReactQueryDevtools initialIsOpen={false} />
```

- **Presiona el botón flotante** en desarrollo para ver queries activas
- **Inspecciona estado de caché**, refetches, mutations, etc.

## 🎨 Tipos TypeScript

Todos los tipos están generados automáticamente:

```tsx
import type {
  Producto,
  CreateProducto,
  UpdateProducto,
  Categoria,
  Venta,
  Pedido,
  // ... 82 schemas disponibles
} from '@/api/generated/model';
```

## ⚡ Performance

React Query maneja automáticamente:

- **Caché inteligente** (5 minutos staleTime por defecto)
- **Deduplicación** de requests
- **Background refetching**
- **Garbage collection** de queries inactivas
- **Optimistic updates** (configurable)

## 🔄 Invalidación de Queries

```tsx
import { useQueryClient } from '@tanstack/react-query';
import { 
  getGetApiProductosQueryKey,
  getGetApiProductosIdQueryKey 
} from '@/api/generated/productos/productos';

const queryClient = useQueryClient();

// Invalidar lista de productos
queryClient.invalidateQueries({ 
  queryKey: getGetApiProductosQueryKey() 
});

// Invalidar producto específico
queryClient.invalidateQueries({ 
  queryKey: getGetApiProductosIdQueryKey(productoId) 
});

// Invalidar todo
queryClient.invalidateQueries();
```

## 🚨 Manejo de Errores

```tsx
const { data, error, isError } = useGetApiProductos();

if (isError) {
  // error.response?.status => 400, 401, 403, 404, 500
  // error.response?.data => { error, message, timestamp }
  console.error('API Error:', error);
}
```

## 📝 Notas Importantes

1. **Regenera el cliente** cada vez que cambies el backend
2. **Los hooks se auto-importan** desde los módulos generados
3. **Los tipos TypeScript están sincronizados** con Zod schemas del backend
4. **No edites archivos generados** - se sobrescriben al regenerar
5. **Usa `mutateAsync`** en vez de `mutate` si necesitas `await`

## 🎯 Patrón Recomendado

```tsx
import { useGetApiProductos, usePostApiProductos } from '@/api/generated/productos/productos';
import { useQueryClient } from '@tanstack/react-query';
import type { CreateProducto } from '@/api/generated/model';

function ProductosManager() {
  const queryClient = useQueryClient();
  
  // Query para listar
  const { data, isLoading, error } = useGetApiProductos({ limit: 20 });
  
  // Mutation para crear
  const createMutation = usePostApiProductos({
    mutation: {
      onSuccess: () => {
        // Auto-refresh después de crear
        queryClient.invalidateQueries({ queryKey: ['api', 'productos'] });
      },
    },
  });

  const handleCreate = async (producto: CreateProducto) => {
    try {
      await createMutation.mutateAsync(producto);
      // Notificación de éxito
    } catch (err) {
      // Notificación de error
    }
  };

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;

  return (
    <div>
      <ProductForm onSubmit={handleCreate} />
      <ProductList productos={data?.items ?? []} />
    </div>
  );
}
```

## 🔗 Referencias

- [TanStack Query Docs](https://tanstack.com/query/latest/docs/framework/react/overview)
- [Orval Docs](https://orval.dev/)
- Backend OpenAPI: `ferreteria-api/openapi-generated.json`
