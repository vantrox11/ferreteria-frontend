/**
 * Utilidades para manejo de errores de API tipados
 * 
 * El backend utiliza AppError con estructura estandarizada:
 * - message: string (mensaje principal)
 * - errors?: { field: string; message: string }[] (errores de validación)
 * 
 * Orval genera tipos ErrorResponse para cada endpoint.
 */

import type { AxiosError } from 'axios';
import type { ErrorResponse } from '@/api/generated/model';

/**
 * Tipo union de todos los posibles errores HTTP del backend
 * Incluye propiedades adicionales que el backend puede enviar para casos especiales
 */
export type ApiErrorPayload = ErrorResponse & {
    errors?: Array<{ field?: string; message: string }>;
    /** Campo adicional usado para indicar acciones requeridas (ej: APERTURA_SESION) */
    requiere_accion?: string;
    /** Campo adicional para errores de negocio específicos */
    error?: string;
    /** Index signature para propiedades adicionales desconocidas */
    [key: string]: unknown;
};

/**
 * Tipo para errores de API con Axios
 */
export type ApiError = AxiosError<ApiErrorPayload>;

/**
 * Type guard para verificar si un error es de tipo ApiError
 */
export function isApiError(error: unknown): error is ApiError {
    return (
        typeof error === 'object' &&
        error !== null &&
        'isAxiosError' in error &&
        (error as ApiError).isAxiosError === true
    );
}

/**
 * Extrae el mensaje de error principal de cualquier tipo de error
 * Soporta: ApiError, Error estándar, strings, y objetos desconocidos
 */
export function getErrorMessage(error: unknown, fallback = 'Ha ocurrido un error'): string {
    // Error de API con estructura conocida
    if (isApiError(error)) {
        const data = error.response?.data;
        if (data?.message) {
            return data.message;
        }
        // Fallback al mensaje HTTP estándar
        if (error.response?.statusText) {
            return error.response.statusText;
        }
    }

    // Error estándar de JavaScript
    if (error instanceof Error) {
        return error.message;
    }

    // String directo
    if (typeof error === 'string') {
        return error;
    }

    // Objeto con propiedad message
    if (typeof error === 'object' && error !== null && 'message' in error) {
        return String((error as { message: unknown }).message);
    }

    return fallback;
}

/**
 * Extrae errores de validación del error de API
 * Retorna un Map de campo -> mensajes de error
 */
export function getValidationErrors(error: unknown): Map<string, string[]> {
    const fieldErrors = new Map<string, string[]>();

    if (!isApiError(error)) {
        return fieldErrors;
    }

    const errors = error.response?.data?.errors;
    if (!Array.isArray(errors)) {
        return fieldErrors;
    }

    for (const err of errors) {
        const field = err.field || '_general';
        const messages = fieldErrors.get(field) || [];
        messages.push(err.message);
        fieldErrors.set(field, messages);
    }

    return fieldErrors;
}

/**
 * Formatea errores de validación como string para mostrar en toast
 */
export function formatValidationErrors(error: unknown): string | null {
    const fieldErrors = getValidationErrors(error);

    if (fieldErrors.size === 0) {
        return null;
    }

    const messages: string[] = [];
    fieldErrors.forEach((errors, field) => {
        if (field === '_general') {
            messages.push(...errors);
        } else {
            messages.push(...errors.map(e => `${field}: ${e}`));
        }
    });

    return messages.join('. ');
}

/**
 * Obtiene el código de estado HTTP del error
 */
export function getErrorStatus(error: unknown): number | null {
    if (isApiError(error)) {
        return error.response?.status ?? null;
    }
    return null;
}

/**
 * Verifica si el error es de un tipo HTTP específico
 */
export function isHttpError(error: unknown, status: number): boolean {
    return getErrorStatus(error) === status;
}

/**
 * Helpers específicos para códigos de error comunes
 */
export const isNotFoundError = (error: unknown) => isHttpError(error, 404);
export const isUnauthorizedError = (error: unknown) => isHttpError(error, 401);
export const isForbiddenError = (error: unknown) => isHttpError(error, 403);
export const isConflictError = (error: unknown) => isHttpError(error, 409);
export const isValidationError = (error: unknown) => isHttpError(error, 400);
export const isServerError = (error: unknown) => {
    const status = getErrorStatus(error);
    return status !== null && status >= 500;
};
