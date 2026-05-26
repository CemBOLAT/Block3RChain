from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum
from typing import Optional


class PartitionRejectReason(StrEnum):
    SINGLE_POLE = "single_pole"
    RIVAL = "rival"
    IMBALANCE = "imbalance"
    EXPLOITED = "exploited"


@dataclass(frozen=True)
class PartitionEvaluation:
    score: float
    is_valid: bool
    reject_reason: Optional[PartitionRejectReason] = None
    detail: Optional[str] = None

    @property
    def log_message(self) -> str:
        if self.is_valid:
            return "valid"
        base = f"PROHIBITED: {self.reject_reason.value}"
        return f"{base} ({self.detail})" if self.detail else base

    @classmethod
    def valid(cls, score: float) -> PartitionEvaluation:
        return cls(score=score, is_valid=True)

    @classmethod
    def rejected(
        cls,
        reason: PartitionRejectReason,
        detail: Optional[str] = None,
    ) -> PartitionEvaluation:
        return cls(
            score=float("inf"),
            is_valid=False,
            reject_reason=reason,
            detail=detail,
        )
