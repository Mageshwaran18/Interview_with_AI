"""
Phase 4: Dashboard Schema — Pydantic models for Results Dashboard API.

Defines response shapes for dashboard stats, rankings, session detail, and trends.
"""

from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
from datetime import datetime


class SessionSummary(BaseModel):
    """Lightweight session card for rankings and lists."""
    session_id: str
    composite_q_score: float = Field(default=0.0, ge=0, le=100)
    pillar_scores: Dict[str, float] = Field(default_factory=dict)
    created_at: Optional[str] = None
    duration_minutes: float = 0.0
    total_events: int = 0


class ScoreDistributionBucket(BaseModel):
    """A histogram bucket for score distribution."""
    range_label: str  # e.g. "0-20", "20-40"
    count: int = 0
    percentage: float = 0.0


class DashboardStats(BaseModel):
    """Aggregate statistics across all evaluated sessions."""
    total_sessions: int = 0
    average_q_score: float = 0.0
    highest_q_score: float = 0.0
    lowest_q_score: float = 0.0
    pillar_averages: Dict[str, float] = Field(default_factory=dict)
    score_distribution: List[ScoreDistributionBucket] = Field(default_factory=list)


class RankingEntry(BaseModel):
    """A single row in the session ranking table."""
    rank: int
    session_id: str
    composite_q_score: float = 0.0
    pillar_scores: Dict[str, float] = Field(default_factory=dict)
    created_at: Optional[str] = None
    duration_minutes: float = 0.0


class MetricDetail(BaseModel):
    """Individual metric within a pillar breakdown."""
    name: str
    value: float = 0.0
    description: str = ""


class PillarBreakdown(BaseModel):
    """Full breakdown of a single pillar with sub-metrics."""
    pillar_id: str
    pillar_name: str
    score: float = 0.0
    weight: float = 0.0
    sub_metrics: List[MetricDetail] = Field(default_factory=list)


class SessionDetail(BaseModel):
    """Full evaluation detail for a single session."""
    session_id: str
    composite_q_score: float = 0.0
    pillars: List[PillarBreakdown] = Field(default_factory=list)
    total_events: int = 0
    duration_minutes: float = 0.0
    created_at: Optional[str] = None


class TrendPoint(BaseModel):
    """A single point in the score trend chart."""
    session_id: str
    composite_q_score: float = 0.0
    pillar_scores: Dict[str, float] = Field(default_factory=dict)
    created_at: Optional[str] = None


class DashboardResponse(BaseModel):
    """Top-level dashboard API response."""
    success: bool = True
    stats: Optional[DashboardStats] = None
    rankings: List[RankingEntry] = Field(default_factory=list)
    recent_sessions: List[SessionSummary] = Field(default_factory=list)
    message: str = ""
