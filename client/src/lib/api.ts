import axiosInstance from "../services/api";

export const uploadProductImage = async (file: File) => {
  const formData = new FormData();
  formData.append("image", file);

  const { data } = await axiosInstance.post<{ url: string }>(
    "/upload",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );

  return data.url;
};
