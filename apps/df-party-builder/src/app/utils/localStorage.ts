export const getLocalStorageItem = <T = unknown>(key: string): T | null => {
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : null;
};

export const setLocalStorageItem = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const removeLocalStorageItem = (key: string) => {
  localStorage.removeItem(key);
};
