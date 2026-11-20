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
    refetchInterval: 10000, // Lightweight 10s auto-refresh for real-time monitoring
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
      if (!response.ok) {
        let errMessage = "Failed to update complaint status";
        try {
          const errData = await response.json();
          if (errData?.detail) {
            errMessage = typeof errData.detail === "string" ? errData.detail : JSON.stringify(errData.detail);
          }
        } catch {
          // fallback
        }
        throw new Error(errMessage);
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      const updatedStatus = data.status || variables.status;
      
      // Update all complaints lists in cache
      queryClient.setQueriesData({ queryKey: ["municipal-complaints"] }, (old: any) => {
        if (!old || !Array.isArray(old.complaints)) return old;
        return {
          ...old,
          complaints: old.complaints.map((c: MunicipalComplaint) =>
            c.id === variables.complaintId || c.reference_number === variables.complaintId
              ? { ...c, ...(data.complaint || {}), status: updatedStatus }
              : c
          ),
        };
      });

      // Update single complaint cache
      queryClient.setQueriesData({ queryKey: ["municipal-complaint", variables.complaintId] }, (old: any) => {
        if (!old) return old;
        return { ...old, ...(data.complaint || {}), status: updatedStatus };
      });

      queryClient.invalidateQueries({ queryKey: ["municipal-complaints"] });
      queryClient.invalidateQueries({ queryKey: ["municipal-complaint", variables.complaintId] });
    },
  });
}

export function useSubmitComplaint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      citizen_name: string;
      description: string;
      location_name: string;
      latitude: number;
      longitude: number;
      title?: string;
      evidence_reference?: string;
    }) => {
      const response = await fetch(`${API_BASE_URL}/complaints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errMessage = "Failed to submit complaint";
        try {
          const errData = await response.json();
          if (errData?.detail) {
            errMessage = typeof errData.detail === "string" ? errData.detail : JSON.stringify(errData.detail);
          }
        } catch {
          // fallback to statusText or generic message
        }
        throw new Error(errMessage);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["municipal-complaints"] });
    },
  });
}
