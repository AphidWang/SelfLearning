export class ChatError extends Error {
  constructor(
    message: string,
    public code: string,
    public status?: number
  ) {
    super(message);
    this.name = 'ChatError';
  }
}

export const handleApiError = (error: unknown): ChatError => {
  if (error instanceof ChatError) {
    return error;
  }

  if (error instanceof Error) {
    return new ChatError(
      error.message,
      'UNKNOWN_ERROR'
    );
  }

  return new ChatError(
    '發生未知錯誤',
    'UNKNOWN_ERROR'
  );
};

export const isApiError = (error: unknown): error is ChatError => {
  return error instanceof ChatError;
}; 