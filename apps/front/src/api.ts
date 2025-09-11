
// window.electronAPI.sendToBackend('345');

// window.electronAPI?.onResponse?.((data) => {
//   console.log("📥 Received from backend:", data.toString('hex'));
// });

export const db = {
  get: async (model: string, selector: unknown) => {
    const action = 'get';
    const params = [model, selector];
    const result = await window.api.db({ action, params });
    return result;
  },
  insert: async (model: string, data: unknown[]) => {
    const action = 'insert';
    const params = [model, data];
    const result = await window.api.db({ action, params });
    return result;
  },
  update: async (model: string, selector: unknown, data: unknown[]) => {
    const action = 'update';
    const params = [model, selector, data];
    const result = await window.api.db({ action, params });
    return result;
  },
  delete: async (model: string, selector: unknown) => {
    const action = 'delete';
    const params = [model, selector];
    const result = await window.api.db({ action, params });
    return result;
  }
}

export async function req(data) {
  const result = await window.api.request(data);
  return result;
}

export async function hdmPrint(data) {
  const result = await window.api.hdm(data);
  return result;
}

export async function receiptPrint(data) {
  const result = await window.api.tPrinter(data);
  return result;
}