"""
Phase 4: Dashboard Service — Aggregation, ranking, and statistics logic.

Reads from evaluations_collection (Phase 3) to compute dashboard data.
"""

import logging
from typing import Optional, List, Dict, Any
from app.database import evaluations_collection

logger = logging.getLogger(__name__)


def _extract_pillar_scores(eval_doc: dict) -> Dict[str, float]:
    """Extract pillar scores dict from an evaluation document."""
    pillars = {}
    for key in ["pillar_g", "pillar_u", "pillar_i", "pillar_d", "pillar_e"]:
        pillar_data = eval_doc.get(key, {})
        if isinstance(pillar_data, dict):
            pid = pillar_data.get("pillar_id", key[-1].upper())
            pillars[pid] = pillar_data.get("score", 0.0)
    return pillars


def _safe_iso(dt) -> Optional[str]:
    """Safely convert datetime to ISO string."""
    if dt is None:
        return None
    try:
        return dt.isoformat()
    except Exception:
        return str(dt)


async def get_dashboard_stats() -> Dict[str, Any]:
    """
    Compute aggregate statistics across all evaluations.
    
    Returns dict with: total_sessions, average/max/min Q scores,
    pillar averages, and score distribution buckets.
    """
    try:
        all_evals = list(evaluations_collection.find().sort("created_at", -1))
        
        if not all_evals:
            return {
                "total_sessions": 0,
                "average_q_score": 0.0,
                "highest_q_score": 0.0,
                "lowest_q_score": 0.0,
                "pillar_averages": {"G": 0, "U": 0, "I": 0, "D": 0, "E": 0},
                "score_distribution": [
                    {"range_label": "0-20", "count": 0, "percentage": 0},
                    {"range_label": "20-40", "count": 0, "percentage": 0},
                    {"range_label": "40-60", "count": 0, "percentage": 0},
                    {"range_label": "60-80", "count": 0, "percentage": 0},
                    {"range_label": "80-100", "count": 0, "percentage": 0},
                ],
            }
        
        q_scores = []
        pillar_sums = {"G": 0.0, "U": 0.0, "I": 0.0, "D": 0.0, "E": 0.0}
        pillar_counts = {"G": 0, "U": 0, "I": 0, "D": 0, "E": 0}
        
        # Score distribution buckets
        buckets = {"0-20": 0, "20-40": 0, "40-60": 0, "60-80": 0, "80-100": 0}
        
        for ev in all_evals:
            q = ev.get("composite_q_score", 0.0)
            q_scores.append(q)
            
            # Bucket the Q score
            if q < 20:
                buckets["0-20"] += 1
            elif q < 40:
                buckets["20-40"] += 1
            elif q < 60:
                buckets["40-60"] += 1
            elif q < 80:
                buckets["60-80"] += 1
            else:
                buckets["80-100"] += 1
            
            # Accumulate pillar scores
            pscores = _extract_pillar_scores(ev)
            for pid, score in pscores.items():
                if pid in pillar_sums:
                    pillar_sums[pid] += score
                    pillar_counts[pid] += 1
        
        total = len(q_scores)
        pillar_averages = {}
        for pid in pillar_sums:
            if pillar_counts[pid] > 0:
                pillar_averages[pid] = round(pillar_sums[pid] / pillar_counts[pid], 2)
            else:
                pillar_averages[pid] = 0.0
        
        distribution = []
        for label, count in buckets.items():
            distribution.append({
                "range_label": label,
                "count": count,
                "percentage": round((count / total) * 100, 1) if total > 0 else 0,
            })
        
        return {
            "total_sessions": total,
            "average_q_score": round(sum(q_scores) / total, 2) if total > 0 else 0.0,
            "highest_q_score": round(max(q_scores), 2) if q_scores else 0.0,
            "lowest_q_score": round(min(q_scores), 2) if q_scores else 0.0,
            "pillar_averages": pillar_averages,
            "score_distribution": distribution,
        }
        
    except Exception as e:
        logger.error(f"Failed to compute dashboard stats: {e}", exc_info=True)
        return {
            "total_sessions": 0,
            "average_q_score": 0.0,
            "highest_q_score": 0.0,
            "lowest_q_score": 0.0,
            "pillar_averages": {},
            "score_distribution": [],
        }


async def get_session_rankings(
    limit: int = 50, sort_by: str = "composite_q_score", order: str = "desc"
) -> List[Dict[str, Any]]:
    """
    Get ranked sessions sorted by the specified field.
    
    Args:
        limit: Max results
        sort_by: Field to sort by (composite_q_score or pillar)
        order: 'asc' or 'desc'
    """
    try:
        sort_direction = -1 if order == "desc" else 1
        
        # Map pillar sort keys
        sort_field_map = {
            "composite_q_score": "composite_q_score",
            "G": "pillar_g.score",
            "U": "pillar_u.score",
            "I": "pillar_i.score",
            "D": "pillar_d.score",
            "E": "pillar_e.score",
        }
        mongo_sort_field = sort_field_map.get(sort_by, "composite_q_score")
        
        results = list(
            evaluations_collection.find()
            .sort(mongo_sort_field, sort_direction)
            .limit(limit)
        )
        
        rankings = []
        for idx, ev in enumerate(results):
            rankings.append({
                "rank": idx + 1,
                "session_id": ev.get("session_id", ""),
                "composite_q_score": round(ev.get("composite_q_score", 0.0), 2),
                "pillar_scores": _extract_pillar_scores(ev),
                "created_at": _safe_iso(ev.get("created_at")),
                "duration_minutes": round(ev.get("session_duration_minutes", 0.0), 2),
            })
        
        return rankings
        
    except Exception as e:
        logger.error(f"Failed to get rankings: {e}", exc_info=True)
        return []


async def get_session_detail(session_id: str) -> Optional[Dict[str, Any]]:
    """
    Get full evaluation detail for a single session.
    Includes all pillar breakdowns with sub-metrics.
    """
    try:
        ev = evaluations_collection.find_one(
            {"session_id": session_id},
            sort=[("created_at", -1)]
        )
        
        if not ev:
            return None
        
        # Build pillar breakdowns
        pillars = []
        for key, name in [
            ("pillar_g", "Goal Decomposition"),
            ("pillar_u", "Usage Efficiency"),
            ("pillar_i", "Iteration & Refinement"),
            ("pillar_d", "Detection & Validation"),
            ("pillar_e", "End Result Quality"),
        ]:
            pillar_data = ev.get(key, {})
            if isinstance(pillar_data, dict):
                sub_metrics = []
                for sm in pillar_data.get("sub_metrics", []):
                    if isinstance(sm, dict):
                        sub_metrics.append({
                            "name": sm.get("name", ""),
                            "value": round(sm.get("value", 0.0), 2),
                            "description": sm.get("description", ""),
                        })
                
                pillars.append({
                    "pillar_id": pillar_data.get("pillar_id", key[-1].upper()),
                    "pillar_name": name,
                    "score": round(pillar_data.get("score", 0.0), 2),
                    "weight": pillar_data.get("weight", 0.0),
                    "sub_metrics": sub_metrics,
                })
        
        return {
            "session_id": ev.get("session_id", ""),
            "composite_q_score": round(ev.get("composite_q_score", 0.0), 2),
            "pillars": pillars,
            "total_events": ev.get("total_events", 0),
            "duration_minutes": round(ev.get("session_duration_minutes", 0.0), 2),
            "created_at": _safe_iso(ev.get("created_at")),
        }
        
    except Exception as e:
        logger.error(f"Failed to get session detail for {session_id}: {e}", exc_info=True)
        return None


async def get_score_trends(limit: int = 20) -> List[Dict[str, Any]]:
    """
    Get chronological score data for trend visualization.
    Returns oldest-first for proper chart rendering.
    """
    try:
        results = list(
            evaluations_collection.find()
            .sort("created_at", 1)  # Oldest first for trend
            .limit(limit)
        )
        
        trends = []
        for ev in results:
            trends.append({
                "session_id": ev.get("session_id", ""),
                "composite_q_score": round(ev.get("composite_q_score", 0.0), 2),
                "pillar_scores": _extract_pillar_scores(ev),
                "created_at": _safe_iso(ev.get("created_at")),
            })
        
        return trends
        
    except Exception as e:
        logger.error(f"Failed to get score trends: {e}", exc_info=True)
        return []
