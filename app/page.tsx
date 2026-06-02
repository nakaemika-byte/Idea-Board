"use client";

import {
  Background,
  Connection,
  ConnectionMode,
  Controls,
  Edge,
  Handle,
  MiniMap,
  Node,
  NodeProps,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  AlignCenter,
  AlertTriangle,
  Boxes,
  CirclePlus,
  CornerDownRight,
  Link2Off,
  PanelRightClose,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Tags,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type Idea = {
  id: string;
  title: string;
  body: string;
  tags: string[];
  createdAt: string;
  x: number;
  y: number;
};

type IdeaLink = {
  id: string;
  source: string;
  target: string;
};

type BoardState = {
  ideas: Idea[];
  links: IdeaLink[];
  selectedIdeaId: string;
};

type IdeaNodeData = {
  idea: Idea;
  selected: boolean;
  highlighted: boolean;
};

const STORAGE_KEY = "milanote-style-idea-board:v1";

const initialIdeas: Idea[] = [
  {
    id: "idea-blank",
    title: "",
    body: "",
    tags: [],
    createdAt: "2026-06-02T03:00:00.000Z",
    x: 120,
    y: 120,
  },
];

const initialLinks: IdeaLink[] = [];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function createIdea(index: number): Idea {
  const now = new Date();

  return {
    id: `idea-${now.getTime()}`,
    title: "新しいアイデア",
    body: "ここに思いついたことを残します。",
    tags: ["メモ"],
    createdAt: now.toISOString(),
    x: 40 + (index % 4) * 180,
    y: 80 + Math.floor(index / 4) * 150,
  };
}

function createLinkId(source: string, target: string) {
  return `link-${source}-${target}`;
}

function IdeaCardNode({ data }: NodeProps<Node<IdeaNodeData>>) {
  const { idea, selected, highlighted } = data;
  const visibleTags = idea.tags.map((tag) => tag.trim()).filter(Boolean);

  return (
    <div
      className={[
        "idea-card-node",
        selected ? "idea-card-node-selected" : "",
        highlighted ? "idea-card-node-highlighted" : "",
      ].join(" ")}
    >
      <Handle type="target" position={Position.Left} className="node-handle" />
      <div className="idea-card-node-meta">
        <span>{formatDate(idea.createdAt)}</span>
        <Sparkles aria-hidden="true" size={14} />
      </div>
      <h2 className={!idea.title ? "empty-card-title" : ""}>{idea.title || "新しいアイデア"}</h2>
      <p className={!idea.body ? "empty-card-copy" : ""}>{idea.body || "メモを入力してください"}</p>
      {visibleTags.length ? (
        <div className="node-tags">
          {visibleTags.map((tag, index) => (
            <span key={`${tag}-${index}`}>{tag}</span>
          ))}
        </div>
      ) : null}
      <Handle type="source" position={Position.Right} className="node-handle" />
    </div>
  );
}

const nodeTypes = {
  idea: IdeaCardNode,
};

export default function Home() {
  return (
    <ReactFlowProvider>
      <IdeaBoard />
    </ReactFlowProvider>
  );
}

function IdeaBoard() {
  const [ideas, setIdeas] = useState<Idea[]>(initialIdeas);
  const [links, setLinks] = useState<IdeaLink[]>(initialLinks);
  const [selectedIdeaId, setSelectedIdeaId] = useState(initialIdeas[0].id);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);
  const [resetSnapshot, setResetSnapshot] = useState<BoardState | null>(null);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);

    if (saved) {
      try {
        const parsed = JSON.parse(saved) as BoardState;

        if (parsed.ideas?.length) {
          setIdeas(parsed.ideas);
          setLinks(parsed.links ?? []);
          setSelectedIdeaId(parsed.selectedIdeaId ?? parsed.ideas[0].id);
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }

    setHasLoaded(true);
  }, []);

  useEffect(() => {
    if (!hasLoaded) {
      return;
    }

    const nextState: BoardState = {
      ideas,
      links,
      selectedIdeaId,
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  }, [hasLoaded, ideas, links, selectedIdeaId]);

  const selectedIdea = ideas.find((idea) => idea.id === selectedIdeaId) ?? ideas[0];
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const matchesSearch = useCallback(
    (idea: Idea) => {
      if (!normalizedQuery) {
        return false;
      }

      const haystack = [idea.title, idea.body, ...idea.tags].join(" ").toLowerCase();
      return haystack.includes(normalizedQuery);
    },
    [normalizedQuery],
  );

  const flowNodes: Node<IdeaNodeData>[] = useMemo(
    () =>
      ideas.map((idea) => ({
        id: idea.id,
        type: "idea",
        position: { x: idea.x, y: idea.y },
        initialWidth: 260,
        initialHeight: 150,
        handles: [
          {
            id: null,
            type: "target",
            position: Position.Left,
            x: 0,
            y: 75,
            width: 9,
            height: 9,
          },
          {
            id: null,
            type: "source",
            position: Position.Right,
            x: 260,
            y: 75,
            width: 9,
            height: 9,
          },
        ],
        data: {
          idea,
          selected: idea.id === selectedIdeaId,
          highlighted: matchesSearch(idea),
        },
      })),
    [ideas, matchesSearch, selectedIdeaId],
  );

  const flowEdges: Edge[] = useMemo(
    () =>
      links.map((link) => ({
        id: link.id,
        source: link.source,
        target: link.target,
        type: "smoothstep",
        animated: link.source === selectedIdeaId || link.target === selectedIdeaId,
        style: {
          stroke: link.source === selectedIdeaId || link.target === selectedIdeaId ? "#e06b58" : "#93a6a4",
          strokeWidth: link.source === selectedIdeaId || link.target === selectedIdeaId ? 2.4 : 1.5,
        },
      })),
    [links, selectedIdeaId],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);

  useEffect(() => {
    setNodes(flowNodes);
  }, [flowNodes, setNodes]);

  const updateSelectedIdea = (patch: Partial<Idea>) => {
    setIdeas((currentIdeas) =>
      currentIdeas.map((idea) => (idea.id === selectedIdeaId ? { ...idea, ...patch } : idea)),
    );
  };

  const updateTagAt = (index: number, value: string) => {
    if (!selectedIdea) {
      return;
    }

    const nextTags = selectedIdea.tags.length ? [...selectedIdea.tags] : [""];
    nextTags[index] = value;
    updateSelectedIdea({ tags: nextTags.slice(0, 6) });
  };

  const addTagField = () => {
    if (!selectedIdea || selectedIdea.tags.length >= 6) {
      return;
    }

    const currentTags = selectedIdea.tags.length ? selectedIdea.tags : [""];
    updateSelectedIdea({ tags: [...currentTags, ""].slice(0, 6) });
  };

  const removeTagAt = (index: number) => {
    if (!selectedIdea) {
      return;
    }

    updateSelectedIdea({ tags: selectedIdea.tags.filter((_, tagIndex) => tagIndex !== index) });
  };

  const connectIdeas = useCallback((connection: Connection) => {
    const { source, target } = connection;

    if (!source || !target || source === target) {
      return;
    }

    setLinks((currentLinks) => {
      const alreadyLinked = currentLinks.some(
        (link) =>
          (link.source === source && link.target === target) ||
          (link.source === target && link.target === source),
      );

      if (alreadyLinked) {
        return currentLinks;
      }

      return [
        ...currentLinks,
        {
          id: createLinkId(source, target),
          source,
          target,
        },
      ];
    });
  }, []);

  const addIdea = () => {
    const nextIdea = createIdea(ideas.length);
    setIdeas((currentIdeas) => [...currentIdeas, nextIdea]);
    setLinks((currentLinks) =>
      selectedIdeaId
        ? [
            ...currentLinks,
            {
              id: createLinkId(selectedIdeaId, nextIdea.id),
              source: selectedIdeaId,
              target: nextIdea.id,
            },
          ]
        : currentLinks,
    );
    setSelectedIdeaId(nextIdea.id);
  };

  const resetBoard = () => {
    setIsResetDialogOpen(true);
  };

  const confirmResetBoard = () => {
    setResetSnapshot({
      ideas,
      links,
      selectedIdeaId,
    });
    setIdeas(initialIdeas);
    setLinks(initialLinks);
    setSelectedIdeaId(initialIdeas[0].id);
    setSearchQuery("");
    setIsResetDialogOpen(false);
  };

  const undoReset = () => {
    if (!resetSnapshot) {
      return;
    }

    setIdeas(resetSnapshot.ideas);
    setLinks(resetSnapshot.links);
    setSelectedIdeaId(resetSnapshot.selectedIdeaId);
    setResetSnapshot(null);
  };

  const deleteSelectedIdea = () => {
    if (!selectedIdea) {
      return;
    }

    const remainingIdeas = ideas.filter((idea) => idea.id !== selectedIdea.id);
    setIdeas(remainingIdeas);
    setLinks((currentLinks) =>
      currentLinks.filter((link) => link.source !== selectedIdea.id && link.target !== selectedIdea.id),
    );
    setSelectedIdeaId(remainingIdeas[0]?.id ?? "");
  };

  const removeLink = (ideaId: string) => {
    if (!selectedIdea) {
      return;
    }

    setLinks((currentLinks) =>
      currentLinks.filter(
        (link) =>
          !(
            (link.source === selectedIdea.id && link.target === ideaId) ||
            (link.source === ideaId && link.target === selectedIdea.id)
          ),
      ),
    );
  };

  const arrangeBoard = () => {
    const centerIndex = ideas.findIndex((idea) => idea.id === selectedIdeaId);
    const anchor = centerIndex >= 0 ? ideas[centerIndex] : ideas[0];
    const otherIdeas = ideas.filter((idea) => idea.id !== anchor.id);

    setIdeas([
      { ...anchor, x: 120, y: 140 },
      ...otherIdeas.map((idea, index) => {
        const angle = (index / Math.max(otherIdeas.length, 1)) * Math.PI * 2;
        return {
          ...idea,
          x: 130 + Math.cos(angle) * 360,
          y: 150 + Math.sin(angle) * 230,
        };
      }),
    ]);
  };

  const relatedIdeas = selectedIdea
    ? links
        .filter((link) => link.source === selectedIdea.id || link.target === selectedIdea.id)
        .map((link) => ideas.find((idea) => idea.id === (link.source === selectedIdea.id ? link.target : link.source)))
        .filter((idea): idea is Idea => Boolean(idea))
    : [];

  return (
    <main className="app-shell">
      <aside className="left-toolbar" aria-label="ボード操作">
        <div className="toolbar-brand">
          <Boxes aria-hidden="true" size={22} />
        </div>
        <button className="icon-button primary" type="button" onClick={addIdea} title="追加">
          <CirclePlus aria-hidden="true" size={20} />
        </button>
        <button className="icon-button" type="button" onClick={arrangeBoard} title="整理">
          <AlignCenter aria-hidden="true" size={20} />
        </button>
        <button className="icon-button" type="button" onClick={resetBoard} title="リセットする">
          <RefreshCw aria-hidden="true" size={19} />
        </button>
      </aside>

      <section className="board-region" aria-label="アイデアボード">
        <header className="topbar">
          <div>
            <p className="eyebrow">Idea Board</p>
            <h1>発想をつないで育てる</h1>
          </div>
          <label className="search-field">
            <Search aria-hidden="true" size={18} />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="検索"
            />
          </label>
        </header>

        <div className="canvas-wrap">
          <ReactFlow
            nodes={nodes}
            edges={flowEdges}
            nodeTypes={nodeTypes}
            onNodesChange={(changes) => {
              onNodesChange(changes);

              setIdeas((currentIdeas) =>
                currentIdeas.map((idea) => {
                  const positionChange = changes.find(
                    (change) => change.type === "position" && change.id === idea.id && change.position,
                  );

                  return positionChange?.type === "position" && positionChange.position
                    ? { ...idea, x: positionChange.position.x, y: positionChange.position.y }
                    : idea;
                }),
              );
            }}
            onConnect={connectIdeas}
            onNodeClick={(_, node) => setSelectedIdeaId(node.id)}
            connectionMode={ConnectionMode.Loose}
            connectionLineStyle={{ stroke: "#e06b58", strokeWidth: 2 }}
            fitView
            fitViewOptions={{ padding: 0.24 }}
            proOptions={{ hideAttribution: true }}
            minZoom={0.35}
            maxZoom={1.35}
          >
            <Background color="#d8ddda" gap={22} size={1} />
            <Controls position="bottom-left" showInteractive={false} />
            <MiniMap
              position="bottom-right"
              nodeColor={(node) => (node.id === selectedIdeaId ? "#e06b58" : "#91b9b3")}
              maskColor="rgba(247, 248, 246, 0.72)"
              pannable
              zoomable
            />
          </ReactFlow>
        </div>
      </section>

      <aside className="inspector" aria-label="アイデア詳細">
        <div className="inspector-header">
          <div>
            <p className="eyebrow">Detail</p>
            <h2>詳細</h2>
          </div>
          <PanelRightClose aria-hidden="true" size={20} />
        </div>

        {selectedIdea ? (
          <div className="inspector-content">
            <label className="field">
              <span>タイトル</span>
              <input
                value={selectedIdea.title}
                onChange={(event) => updateSelectedIdea({ title: event.target.value })}
              />
            </label>

            <label className="field">
              <span>メモ</span>
              <textarea
                value={selectedIdea.body}
                onChange={(event) => updateSelectedIdea({ body: event.target.value })}
                rows={7}
              />
            </label>

            <div className="field">
              <span>
                <Tags aria-hidden="true" size={15} />
                タグ
              </span>
              <div className="tag-editor">
                {(selectedIdea.tags.length ? selectedIdea.tags : [""]).map((tag, index) => (
                  <div className="tag-input-row" key={`${selectedIdea.id}-tag-${index}`}>
                    <input
                      value={tag}
                      onChange={(event) => updateTagAt(index, event.target.value)}
                      placeholder="タグを入力"
                    />
                    {selectedIdea.tags.length ? (
                      <button
                        className="tag-remove-button"
                        type="button"
                        onClick={() => removeTagAt(index)}
                        aria-label={`タグ${index + 1}を削除`}
                        title="タグを削除"
                      >
                        <X aria-hidden="true" size={15} />
                      </button>
                    ) : null}
                  </div>
                ))}
                <button
                  className="tag-add-button"
                  type="button"
                  onClick={addTagField}
                  disabled={selectedIdea.tags.length >= 6}
                >
                  <Plus aria-hidden="true" size={15} />
                  タグを追加
                </button>
              </div>
            </div>

            <section className="related-panel">
              <div className="related-title">
                <CornerDownRight aria-hidden="true" size={16} />
                <span>関連</span>
              </div>
              {relatedIdeas.length ? (
                <div className="related-list">
                  {relatedIdeas.map((idea) => (
                    <div className="related-item" key={idea.id}>
                      <button type="button" onClick={() => setSelectedIdeaId(idea.id)}>
                        {idea.title}
                      </button>
                      <button
                        className="related-remove"
                        type="button"
                        onClick={() => removeLink(idea.id)}
                        aria-label={`${idea.title}との関連を解除`}
                        title="関連を解除"
                      >
                        <Link2Off aria-hidden="true" size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p>関連カードはまだありません。</p>
              )}
            </section>

            <button className="danger-button" type="button" onClick={deleteSelectedIdea}>
              <Trash2 aria-hidden="true" size={16} />
              カードを削除
            </button>
          </div>
        ) : (
          <p className="empty-state">カードを選択してください。</p>
        )}
      </aside>

      {resetSnapshot ? (
        <div className="undo-toast" role="status">
          <span>ボードをリセットしました</span>
          <button type="button" onClick={undoReset}>
            元に戻す
          </button>
        </div>
      ) : null}

      {isResetDialogOpen ? (
        <div className="dialog-backdrop" role="presentation">
          <section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="reset-dialog-title">
            <div className="confirm-dialog-icon">
              <AlertTriangle aria-hidden="true" size={22} />
            </div>
            <div className="confirm-dialog-copy">
              <h2 id="reset-dialog-title">ボードをリセットしますか？</h2>
              <p>現在のカードと関連線は空のカード1枚に戻ります。リセット直後なら元に戻せます。</p>
            </div>
            <div className="confirm-dialog-actions">
              <button className="secondary-button" type="button" onClick={() => setIsResetDialogOpen(false)}>
                キャンセル
              </button>
              <button className="danger-button compact" type="button" onClick={confirmResetBoard}>
                リセットする
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
