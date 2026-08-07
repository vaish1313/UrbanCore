"""
Use Case: Generate Role-Based Analysis Report

Generates an AI-powered narrative report from analysis results.
The report structure and depth differ per user role:

- citizen:   Simple summary, public-facing language, no technical data
- owner:     Suitability assessment, investment risks, compliance overview
- builder:   Full construction feasibility, technical terrain data, violation details
- municipal: All data + regulatory recommendations + historical trends

RAG is used to ground LLM responses in actual urban policy documents.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from uuid import UUID

from app.domain.entities import Report, ReportSection

logger = logging.getLogger(__name__)


# Role-specific section definitions
ROLE_SECTIONS = {
    "citizen": ["executive_summary", "key_findings", "public_recommendations"],
    "owner": ["executive_summary", "suitability_assessment", "compliance_overview", "investment_risks", "recommendations"],
    "builder": [
        "executive_summary",
        "terrain_analysis",
        "suitability_assessment",
        "compliance_violations",
        "construction_feasibility",
        "regulatory_requirements",
        "technical_recommendations",
    ],
    "municipal": [
        "executive_summary",
        "terrain_analysis",
        "footprint_summary",
        "change_detection",
        "compliance_violations",
        "regulatory_analysis",
        "urban_growth_assessment",
        "enforcement_recommendations",
        "historical_comparison",
    ],
}


@dataclass
class GenerateReportInput:
    job_id: UUID
    user_id: UUID
    user_role: str


@dataclass
class GenerateReportOutput:
    report: Report
    token_cost: int


class GenerateReportUseCase:
    """
    Orchestrates RAG retrieval + LLM generation to produce role-aware reports.
    """

    def __init__(
        self,
        analysis_data_loader: "IAnalysisDataLoader",  # Loads job results from PostGIS
        policy_retriever: "IPolicyRetriever",          # pgvector similarity search
        llm_client: "ILLMClient",                      # LLM adapter (Ollama/OpenAI)
        report_repo: "IReportRepository",
        storage: "IObjectStorage",
    ) -> None:
        self._data_loader = analysis_data_loader
        self._policy_retriever = policy_retriever
        self._llm = llm_client
        self._report_repo = report_repo
        self._storage = storage

    async def execute(self, input_: GenerateReportInput) -> GenerateReportOutput:
        logger.info(
            f"Generating {input_.user_role} report",
            extra={"job_id": str(input_.job_id)},
        )

        # Load all analysis results for this job
        job_data = await self._data_loader.load(input_.job_id)

        # Determine sections for this role
        section_keys = ROLE_SECTIONS.get(input_.user_role, ROLE_SECTIONS["citizen"])

        sections: list[ReportSection] = []
        total_tokens = 0

        for idx, section_key in enumerate(section_keys):
            # Retrieve relevant policy chunks for this section
            query = self._build_rag_query(section_key, job_data)
            policy_chunks = await self._policy_retriever.retrieve(
                query=query,
                jurisdiction=job_data.get("jurisdiction"),
                top_k=3,
            )

            # Build prompt with context
            prompt = self._build_section_prompt(
                section_key=section_key,
                role=input_.user_role,
                job_data=job_data,
                policy_chunks=policy_chunks,
            )

            # Call LLM
            response = await self._llm.complete(prompt)
            total_tokens += response.token_count

            sections.append(
                ReportSection(
                    section_id=section_key,
                    title=self._section_title(section_key),
                    content=response.text,
                    data=self._extract_section_data(section_key, job_data),
                    order=idx,
                )
            )

        report = Report(
            job_id=input_.job_id,
            user_id=input_.user_id,
            user_role=input_.user_role,
            sections=sections,
            token_cost=total_tokens,
            model_used=self._llm.model_name,
        )

        saved_report = await self._report_repo.save(report)

        logger.info(
            f"Report generated: {len(sections)} sections, {total_tokens} tokens",
            extra={"job_id": str(input_.job_id)},
        )

        return GenerateReportOutput(report=saved_report, token_cost=total_tokens)

    def _build_rag_query(self, section_key: str, job_data: dict) -> str:
        """Build a context-aware query for policy retrieval."""
        queries = {
            "compliance_violations": "building regulations protected zones construction prohibitions",
            "terrain_analysis": "construction on slopes terrain requirements building codes",
            "suitability_assessment": "land suitability assessment criteria construction",
            "regulatory_requirements": "construction permit requirements zoning regulations",
            "enforcement_recommendations": "municipal enforcement illegal construction penalties",
        }
        return queries.get(section_key, f"urban planning regulations {section_key}")

    def _build_section_prompt(
        self,
        section_key: str,
        role: str,
        job_data: dict,
        policy_chunks: list[str],
    ) -> str:
        policy_context = "\n\n".join(policy_chunks) if policy_chunks else "No specific policies retrieved."
        return (
            f"You are an expert urban planning analyst preparing a report for a {role}.\n\n"
            f"Section: {self._section_title(section_key)}\n\n"
            f"Analysis Data:\n{self._format_job_data(job_data, section_key)}\n\n"
            f"Relevant Urban Policies and Regulations:\n{policy_context}\n\n"
            f"Write a clear, accurate {section_key.replace('_', ' ')} section for the {role}. "
            f"Use plain language appropriate for the audience. "
            f"If there are violations, be specific about locations and severity."
        )

    def _section_title(self, section_key: str) -> str:
        return section_key.replace("_", " ").title()

    def _format_job_data(self, job_data: dict, section_key: str) -> str:
        # Return only relevant fields for each section to avoid prompt bloat
        return str(job_data.get(section_key, job_data))

    def _extract_section_data(self, section_key: str, job_data: dict) -> dict:
        return job_data.get(section_key, {})
