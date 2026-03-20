import json
import networkx as nx
from pathlib import Path

DATA_PATH = Path(__file__).parent.parent / "data" / "skill_graph.json"


class SkillGraph:
    def __init__(self):
        self.graph = nx.DiGraph()
        self._node_meta: dict[str, dict] = {}
        self._load()

    def _load(self):
        data = json.loads(DATA_PATH.read_text())
        for skill, meta in data["nodes"].items():
            self._node_meta[skill] = meta
            self.graph.add_node(skill, **meta)
        for src, tgt in data["edges"]:
            self.graph.add_edge(src, tgt)

    # ------------------------------------------------------------------ #
    # Node introspection
    # ------------------------------------------------------------------ #

    @property
    def nodes(self) -> set[str]:
        return set(self.graph.nodes)

    def get_category(self, skill: str) -> str:
        return self._node_meta.get(skill, {}).get("category", "unknown")

    def assign_stage(self, skill: str) -> str:
        return self._node_meta.get(skill, {}).get("stage", "Foundation")

    def add_leaf_node(self, skill: str) -> None:
        """Add an unknown skill as a leaf node (no prerequisites)."""
        if skill not in self.graph:
            meta = {"stage": "Foundation", "category": "unknown"}
            self._node_meta[skill] = meta
            self.graph.add_node(skill, **meta)

    # ------------------------------------------------------------------ #
    # Graph traversal
    # ------------------------------------------------------------------ #

    def get_prerequisites(self, skill: str) -> list[str]:
        """Return all ancestors of a skill in topological order."""
        if skill not in self.graph:
            return []
        ancestors = nx.ancestors(self.graph, skill)
        subgraph = self.graph.subgraph(ancestors)
        try:
            return list(nx.topological_sort(subgraph))
        except nx.NetworkXUnfeasible:
            return list(ancestors)

    def topological_order(self, skills: list[str]) -> list[str]:
        """Return skills in valid topological (prerequisite-first) order."""
        if not skills:
            return []
        skill_set = set(skills)
        subgraph = self.graph.subgraph(skill_set)
        try:
            ordered = list(nx.topological_sort(subgraph))
            # topological_sort gives sources first (prerequisites), which is
            # exactly the order we want for a learning pathway.
            return ordered
        except nx.NetworkXUnfeasible:
            # Cycle detected (should not happen with a proper DAG); fall back.
            return skills

    def get_edges_for(self, skills: list[str]) -> list[tuple[str, str]]:
        """Return edges between a subset of skill nodes (for DAG viz)."""
        skill_set = set(skills)
        return [
            (src, tgt)
            for src, tgt in self.graph.edges()
            if src in skill_set and tgt in skill_set
        ]


# Singleton instance loaded once at startup
_instance: SkillGraph | None = None


def get_skill_graph() -> SkillGraph:
    global _instance
    if _instance is None:
        _instance = SkillGraph()
    return _instance