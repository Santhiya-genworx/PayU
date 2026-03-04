import  api  from "../../../lib/axios";
import type { InvoiceData } from "../../../types/invoice";
import type { POData } from "../../../types/purchase_order";

export const extractInvoice = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/process/extract/invoice", formData, { withCredentials: true });
  return response.data; 
};

export const extractPurchaseOrder = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/process/extract/purchase-order", formData, { withCredentials: true });
  return response.data; 
};

export const getTotalDocuments = async () => {
  const response = await api.get("/process/total-documents", {withCredentials: true});
  return response.data;
}

export const getApprovedDocuments = async () => {
  const response = await api.get("/process/approved-documents", {withCredentials: true});
  return response.data;
}

export const getReviewedDocuments = async () => {
  const response = await api.get("/process/reviewed-documents", {withCredentials: true});
  return response.data;
}

export const getRejectedDocuments = async () => {
  const response = await api.get("/process/rejected-documents", {withCredentials: true});
  return response.data;
}

export const getRecentActivity = async () => {
  const response = await api.get("/process/recent-activity", {withCredentials:true})
  return response.data;
}

export const submitInvoice = async (data: InvoiceData, file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("data", JSON.stringify(data));

  const response = await api.post("/process/upload/invoice", formData, { withCredentials: true });
  return response.data;
};

export const submitPurchaseOrder = async (data: POData, file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("data", JSON.stringify(data));

  const response = await api.post("/process/upload/purchase-order", formData, { withCredentials: true });
  return response.data;
};