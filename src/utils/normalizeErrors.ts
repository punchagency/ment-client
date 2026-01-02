export const normalizeErrors = (err: any): Record<string, string[]> => {
  const data = err?.data || err?.response?.data;
  console.log(data);

  if (!data) {
    return { general: ["Something went wrong"] };
  }

  if (data.non_field_errors) {
    return { general: data.non_field_errors };
  }

  if (data.detail) {
    return { general: [data.detail] };
  }

  return Object.fromEntries(
    Object.entries(data).map(([key, val]) => [
      key,
      Array.isArray(val) ? val : [String(val)],
    ])
  );
};
