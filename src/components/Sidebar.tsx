import { useState, useEffect } from 'react';
import { branchProxy } from '../lib/proxy';
import { Branch } from '../lib/db';
import { GitBranch, Plus, Trash2, GitMerge, ChevronRight, ChevronDown, PanelLeftClose } from 'lucide-react';

export default function Sidebar() {
    const [allBranches, setAllBranches] = useState<Branch[]>([]);
    const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [isOpen, setIsOpen] = useState(true);
    const [viewMode, setViewMode] = useState<'current' | 'branch'>('branch'); // Visual toggle

    useEffect(() => {
        chrome.storage.local.get(['activeBranchId'], (result) => {
            if (result.activeBranchId) {
                setActiveBranchId(result.activeBranchId as string);
                expandToBranch(result.activeBranchId as string, allBranches);
            }
        });

        loadData();

        const listener = (request: any) => {
            if (request.type === 'REFRESH_BRANCHES') {
                loadData();
                chrome.storage.local.get(['activeBranchId'], (result) => {
                    if (result.activeBranchId) setActiveBranchId(result.activeBranchId as string);
                });
            }
        };

        // @ts-ignore
        chrome.runtime.onMessage.addListener(listener);
        return () => chrome.runtime.onMessage.removeListener(listener);
    }, []);

    // Re-run expansion when branches are loaded for the first time
    useEffect(() => {
        if (activeBranchId && allBranches.length > 0) {
            expandToBranch(activeBranchId, allBranches);
        }
    }, [allBranches, activeBranchId]);

    // Save active branch
    useEffect(() => {
        if (activeBranchId) {
            chrome.storage.local.set({ activeBranchId });
        } else {
            chrome.storage.local.remove('activeBranchId');
        }
    }, [activeBranchId]);

    async function loadData() {
        const branches = await branchProxy.getAllBranches();
        setAllBranches(branches);
    }

    function expandToBranch(branchId: string, branches: Branch[]) {
        setExpanded(prev => {
            const next = new Set(prev);
            let current = branches.find(b => b.id === branchId);
            while (current && current.parentBranchId) {
                next.add(current.parentBranchId);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const parentId = current.parentBranchId!;
                current = branches.find(b => b.id === parentId);
            }
            return next;
        });
    }

    async function handleNewBranch() {
        const b = await branchProxy.createBranch({ label: 'New Conversation' });
        loadData();
        setActiveBranchId(b.id);
    }

    async function handleDelete(e: React.MouseEvent, id: string) {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this branch and its children?')) {
            await branchProxy.deleteBranch(id);
            loadData();
            if (activeBranchId === id) setActiveBranchId(null);
        }
    }

    async function handleMerge(e: React.MouseEvent, sourceBranch: Branch) {
        e.stopPropagation();
        if (!sourceBranch.parentBranchId) {
            alert('Cannot merge a root branch.');
            return;
        }
        if (confirm(`Merge "${sourceBranch.label}" into parent?`)) {
            await branchProxy.mergeBranch(sourceBranch.id, sourceBranch.parentBranchId);
            setActiveBranchId(sourceBranch.parentBranchId);
        }
    }

    function toggleExpand(e: React.MouseEvent, id: string) {
        e.stopPropagation();
        setExpanded(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    // Recursive Tree Renderer with L-connectors
    // We pass `isLastChild` to determine if we should stop drawing the vertical line
    function renderTree(parentId: string | null = null, depth = 0) {
        const children = allBranches.filter(b => b.parentBranchId === parentId);
        if (children.length === 0) return null;

        return (
            <div className="flex flex-col">
                {children.map((branch, index) => {
                    const isLast = index === children.length - 1;
                    const hasChildren = allBranches.some(b => b.parentBranchId === branch.id);
                    const isExpanded = expanded.has(branch.id);
                    const isActive = activeBranchId === branch.id;

                    return (
                        <div key={branch.id} className="relative">
                            {/* Branch Node */}
                            <div className="flex items-stretch">
                                {/* Indentation & Lines */}
                                {depth > 0 && (
                                    <div className="w-4 flex-shrink-0 relative">
                                        {/* Vertical line from parent */}
                                        <div className="absolute top-0 bottom-0 left-0 border-l border-zinc-700 h-full"></div>
                                        {/* Horizontal curve/L-shape to node */}
                                        <div className="absolute top-3 left-0 w-3 border-b border-zinc-700"></div>
                                        {/* Cover vertical line if last child */}
                                        {isLast && <div className="absolute top-3.5 bottom-0 left-[-1px] border-l-2 border-[#09090b] w-1"></div>}
                                    </div>
                                )}

                                <div className={`flex-1 min-w-0 ${depth > 0 ? 'ml-0' : ''}`}>
                                    <BranchItem
                                        branch={branch}
                                        isActive={isActive}
                                        hasChildren={hasChildren}
                                        isExpanded={isExpanded}
                                        onSelect={() => setActiveBranchId(branch.id)}
                                        onToggle={(e: React.MouseEvent) => toggleExpand(e, branch.id)}
                                        onDelete={(e: React.MouseEvent) => handleDelete(e, branch.id)}
                                        onMerge={(e: React.MouseEvent) => handleMerge(e, branch)}
                                    />

                                    {/* Children Container */}
                                    {hasChildren && isExpanded && (
                                        <div className="ml-2 pl-2 border-l border-zinc-700/50">
                                            {renderTree(branch.id, depth + 1)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed top-4 right-4 z-[9999] p-2 bg-[#09090b] text-zinc-400 rounded-md border border-zinc-800 hover:text-white shadow-lg transition-all"
            >
                <GitBranch size={20} />
            </button>
        )
    }

    return (
        <div className="fixed top-0 right-0 h-screen w-[350px] bg-[#09090b] text-zinc-100 font-sans flex flex-col border-l border-zinc-800 shadow-2xl z-[9999]">
            {/* Header */}
            <header className="px-4 py-4 border-b border-zinc-800 flex items-center justify-between bg-[#09090b] z-10">
                <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 hover:bg-zinc-800 rounded-md transition-colors text-zinc-400 hover:text-white"
                >
                    <PanelLeftClose size={18} />
                </button>

                <h1 className="font-semibold text-base tracking-tight text-white">BranchGPT</h1>

                <button
                    onClick={handleNewBranch}
                    className="p-1.5 hover:bg-zinc-800 rounded-md transition-colors text-zinc-400 hover:text-white"
                >
                    <Plus size={18} />
                </button>
            </header>

            {/* Tree View */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-zinc-800 bg-[#09090b]">
                {/* Search / Filter could go here */}

                <div className="space-y-1">
                    {allBranches.length === 0 ? (
                        <div className="text-center mt-20 text-zinc-500 text-sm">
                            <GitBranch className="mx-auto mb-2 opacity-20" size={32} />
                            <p>No conversation branches yet.</p>
                            <button onClick={handleNewBranch} className="text-blue-400 mt-2 hover:underline">Start New</button>
                        </div>
                    ) : (
                        renderTree(null)
                    )}
                </div>
            </div>

            {/* Footer with Toggle */}
            <div className="p-3 border-t border-zinc-800 bg-[#09090b]">
                <div className="flex bg-zinc-900/50 p-1 rounded-lg border border-zinc-800">
                    <button
                        onClick={() => setViewMode('current')}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'current' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        Current
                    </button>
                    <button
                        onClick={() => setViewMode('branch')}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'branch' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        Branch
                    </button>
                </div>
            </div>
        </div>
    );
}

function BranchItem({ branch, isActive, hasChildren, isExpanded, onSelect, onToggle, onDelete, onMerge }: any) {
    return (
        <div
            className={`
                group flex items-center gap-2 px-2 py-2 my-0.5 rounded-md cursor-pointer transition-all border
                ${isActive
                    ? 'bg-zinc-900 border-zinc-800'
                    : 'border-transparent hover:bg-zinc-900/50'
                }
            `}
            onClick={onSelect}
        >
            {/* Folder Icon / Branch Icon */}
            <div onClick={onToggle} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                {hasChildren ? (
                    isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                ) : (
                    <GitBranch size={14} className="opacity-50" />
                )}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0 flex items-center justify-between">
                <span className={`text-sm truncate ${isActive ? 'text-zinc-100 font-medium' : 'text-zinc-400'}`}>
                    {branch.label}
                </span>

                {/* HEAD Badge */}
                {isActive && (
                    <span className="ml-2 px-1.5 py-0.5 bg-blue-500 text-[10px] font-bold text-white rounded shadow-sm flex-shrink-0">
                        HEAD
                    </span>
                )}
            </div>

            {/* Hover Actions */}
            <div className={`flex items-center gap-1 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                <button
                    onClick={onMerge}
                    title="Merge"
                    className="p-1 hover:bg-blue-500/10 text-zinc-500 hover:text-blue-400 rounded"
                >
                    <GitMerge size={12} />
                </button>
                <button
                    onClick={onDelete}
                    title="Delete"
                    className="p-1 hover:bg-red-500/10 text-zinc-500 hover:text-red-400 rounded"
                >
                    <Trash2 size={12} />
                </button>
            </div>
        </div>
    )
}
