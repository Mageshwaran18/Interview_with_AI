"""
Evaluation Schema — Pydantic models for GUIDE evaluation results.

📚 What this does:
Defines the structure of evaluation outputs. Every evaluation
produces 5 pillar scores (G, U, I, D, E), each with sub-metrics,
plus a composite Q score.

🧠 What you'll learn:
- Nested Pydantic models
- Optional fields with defaults
- Dict fields for flexible sub-metric storage
"""

from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone


class SubMetricScore(BaseModel):
    """Individual sub-metric score within a pillar."""
    name: str = Field(..., description="Name of the sub-metric")
    value: float = Field(..., ge=0, le=100, description="Score 0-100")
    description: str = Field(default="", description="Description of the metric")
    data: Optional[Dict[str, Any]] = Field(default=None, description="Raw calculation data")


class PillarScore(BaseModel):
    """Score for a single pillar (G, U, I, D, or E)."""
    pillar_id: str = Field(..., description="Pillar code: G, U, I, D, or E")
    pillar_name: str = Field(..., description="Pillar full name")
    score: float = Field(..., ge=0, le=100, description="Normalized score 0-100")
    sub_metrics: List[SubMetricScore] = Field(default_factory=list, description="Individual metric scores")
    weight: float = Field(..., ge=0, le=1, description="Weight in composite calculation")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="When the score was computed")
    available: bool = Field(default=True, description="Whether this pillar was successfully evaluated (Phase 5.4)")
    error: Optional[str] = Field(default=None, description="Error message if pillar evaluation failed (Phase 5.4)")


class EvaluationResult(BaseModel):
    """Complete evaluation result for a session."""
    session_id: str = Field(..., description="Session ID being evaluated")
    pillar_g: PillarScore = Field(..., description="Goal Decomposition pillar")
    pillar_u: PillarScore = Field(..., description="Usage Efficiency pillar")
    pillar_i: PillarScore = Field(..., description="Iteration & Refinement pillar")
    pillar_d: PillarScore = Field(..., description="Detection & Validation pillar")
    pillar_e: PillarScore = Field(..., description="End Result Quality pillar")
    composite_q_score: float = Field(..., ge=0, le=100, description="Composite GUIDE score (Q)")
    weights: Dict[str, float] = Field(
        default_factory=lambda: {"G": 0.20, "U": 0.25, "I": 0.20, "D": 0.15, "E": 0.20},
        description="Weight of each pillar in composite score"
    )
    total_events: int = Field(default=0, description="Total events in session")
    session_duration_minutes: float = Field(default=0, description="Session duration in minutes")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="When evaluation was created")
    details: Optional[Dict[str, Any]] = None
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class EvaluationResponse(BaseModel):
    """API response after triggering evaluation."""
    success: bool = Field(..., description="Whether evaluation succeeded")
    session_id: str = Field(..., description="Session ID that was evaluated")
    message: str = Field(default="", description="Status message")
    evaluation: Optional[EvaluationResult] = Field(default=None, description="Full evaluation result if successful")
    errors: List[str] = Field(default_factory=list, description="List of errors if any")
    details: Optional[Dict[str, Any]] = None
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
