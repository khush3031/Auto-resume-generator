export function successResponse<T>(data: T, message = 'Success') {
  return { success: true, data, message };
}

export function errorResponse(message = 'An unexpected error occurred', data: any = null) {
  return { success: false, data, message };
}

export function notFoundResponse(message = 'Resource not found') {
  return { success: false, data: null, message };
}

export function unauthorizedResponse(message = 'Unauthorized access') {
  return { success: false, data: null, message };
}
