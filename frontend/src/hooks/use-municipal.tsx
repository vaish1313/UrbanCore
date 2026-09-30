import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MunicipalCase, MunicipalComplaint } from "@/types/urbancore";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

interface CasesResponse {
  cases: MunicipalCase[];
  count: number;
}

interface ComplaintsResponse {
  complaints: MunicipalComplaint[];
  count: number;
}

export function useMunicipalCases(status?: string, year?: number, limit = 50, offset = 0) {
  return useQuery({
    queryKey: ["municipal-cases", status, year, limit, offset],
    queryFn: async (): Promise<CasesResponse> => {
      const params = new URLSearchParams();
      if (status && status !== "All") params.append("status", status);
      if (year) params.append("year", year.toString());
      params.append("limit", limit.toString());
      params.append("offset", offset.toString());

      const response = await fetch(`${API_BASE_URL}/municipal/cases?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch municipal cases");
      return response.json();
    },
  });
}

export function useMunicipalCase(caseId: string | undefined) {
  return useQuery({
    queryKey: ["municipal-case", caseId],
    queryFn: async (): Promise<MunicipalCase> => {
      if (!caseId) throw new Error("No case ID provided");
      const response = await fetch(`${API_BASE_URL}/municipal/cases/${caseId}`);
      if (!response.ok) throw new Error("Failed to fetch case");
      return response.json();
    },
    enabled: !!caseId,
  });
}

export function useUpdateCaseStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ caseId, status }: { caseId: string; status: string }) => {
      const response = await fetch(`${API_BASE_URL}/municipal/cases/${caseId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update case status");
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["municipal-cases"] });
      queryClient.invalidateQueries({ queryKey: ["municipal-case", variables.caseId] });
    },
  });
}

export function useMunicipalComplaints(limit = 50, offset = 0) {
  return useQuery({
    queryKey: ["municipal-complaints", limit, offset],
    queryFn: async (): Promise<ComplaintsResponse> => {
      const params = new URLSearchParams();
      params.append("limit", limit.toString());
      params.append("offset", offset.toString());
      
      const response = await fetch(`${API_BASE_URL}/municipal/complaints?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch complaints");
      return response.json();
    },
  });
}

export function useMunicipalComplaint(complaintId: string | undefined) {
  return useQuery({
    queryKey: ["municipal-complaint", complaintId],
    queryFn: async (): Promise<MunicipalComplaint> => {
      if (!complaintId) throw new Error("No complaint ID provided");
      const response = await fetch(`${API_BASE_URL}/municipal/complaints/${complaintId}`);
      if (!response.ok) throw new Error("Failed to fetch complaint");
      return response.json();
    },
    enabled: !!complaintId,
  });
}

export function useUpdateComplaintStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ complaintId, status }: { complaintId: string; status: string }) => {
      const response = await fetch(`${API_BASE_URL}/municipal/complaints/${complaintId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update complaint status");
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["municipal-complaints"] });
      queryClient.invalidateQueries({ queryKey: ["municipal-complaint", variables.complaintId] });
    },
  });
}
