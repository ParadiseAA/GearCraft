import axiosInstance from "../services/api";

export const uploadProductImage = async (file: File) => {
  const formData = new FormData();
  formData.append("image", file);

  const { data } = await axiosInstance.post<{ url: string }>(
    "/upload",
    formData,
  );

  return data.url;
};
