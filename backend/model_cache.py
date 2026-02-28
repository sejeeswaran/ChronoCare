"""
Model Cache
===========
Lazy-loading singleton cache for ML models.

Each model is deserialised from disk exactly once and kept in memory
for all subsequent calls, avoiding repeated I/O overhead.
"""

from __future__ import annotations

import pickle
from pathlib import Path
from typing import Any

# ---------------------------------------------------------------------------
# Internal cache
# ---------------------------------------------------------------------------

_MODEL_CACHE: dict[str, Any] = {}


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def load_model(model_path: str | Path) -> Any:
    """Load a pickled model, caching the result for future calls.

    Parameters
    ----------
    model_path : str | Path
        Absolute or relative path to the ``.pkl`` file.

    Returns
    -------
    model
        The deserialised scikit-learn (or compatible) estimator.

    Raises
    ------
    FileNotFoundError
        If *model_path* does not exist on disk.
    """
    key = str(model_path)

    if key not in _MODEL_CACHE:
        path = Path(model_path)
        if not path.exists():
            raise FileNotFoundError(
                f"Model file not found: {model_path}"
            )
        with open(path, "rb") as fh:
            _MODEL_CACHE[key] = pickle.load(fh)

    return _MODEL_CACHE[key]
