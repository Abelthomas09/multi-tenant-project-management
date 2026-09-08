export const errorText = (error) =>
  error?.errors?.map((item) => item.message).join(' ') || error?.message || 'Something went wrong.'
