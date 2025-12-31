import { useState, useEffect } from 'react';
import { branchProxy } from '../lib/proxy';
import { Branch } from '../lib/db';
import { GitBranch, Plus, Trash2, GitMerge, ChevronRight, ChevronDown, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export default function Sidebar() {
    const [allBranches, setAllBranches] = useState<Branch[]>([]);
    const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [isOpen, setIsOpen] = useState(true);

    useEffect(() => {
        // Init: Load from storage
        chrome.storage.local.get(['activeBranchId'], (result) => {
            if (result.activeBranchId) {
                setActiveBranchId(result.activeBranchId as string);
            }
        });

        loadData();

        // Listen for updates
        // @ts-ignore
        chrome.runtime.onMessage.addListener((request) => {
            if (request.type === 'REFRESH_BRANCHES') {
                loadData();
                chrome.storage.local.get(['activeBranchId'], (result) => {
                    if (result.activeBranchId) setActiveBranchId(result.activeBranchId as string);
                });
            }
        });
    }, []);

    // Effect: when activeBranchId changes, save it
    useEffect(() => {
        if (activeBranchId) {
            chrome.storage.local.set({ activeBranchId });
            // Also expand path to this branch
            expandToBranch(activeBranchId);
        } else {
            chrome.storage.local.remove('activeBranchId');
        }
    }, [activeBranchId]);

    async function loadData() {
        const branches = await branchProxy.getAllBranches();
        setAllBranches(branches);
    }

    function expandToBranch(branchId: string) {
        // Find parents and expand them
        setExpanded(prev => {
            const next = new Set(prev);
            let current = allBranches.find(b => b.id === branchId);
            while (current && current.parentBranchId) {
                next.add(current.parentBranchId);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const parentId = current.parentBranchId!;
                current = allBranches.find(b => b.id === parentId);
            }
            return next;
        });
    }

    async function handleNewBranch() {
        // New Root Branch
        const b = await branchProxy.createBranch({ label: 'New Conversation' });
        loadData();
        setActiveBranchId(b.id);
    }

    async function handleDelete(e: React.MouseEvent, id: string) {
        e.stopPropagation();
        await branchProxy.deleteBranch(id);
        loadData();
        if (activeBranchId === id) setActiveBranchId(null);
    }

    async function handleMerge(e: React.MouseEvent, sourceBranch: Branch) {
        e.stopPropagation();
        if (!sourceBranch.parentBranchId) {
            alert('Cannot merge a root branch (no parent).');
            return;
        }

        // Merge source into parent
        await branchProxy.mergeBranch(sourceBranch.id, sourceBranch.parentBranchId);

        // Switch view to parent to see result
        setActiveBranchId(sourceBranch.parentBranchId);
        alert('Merged successfully! Switched to parent branch.');
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

    // Recursive Tree Renderer
    function renderTree(parentId: string | null = null, depth = 0) {
        const children = allBranches.filter(b => b.parentBranchId === parentId);
        if (children.length === 0) return null;

        return (
            <div className={`flex flex-col ${depth > 0 ? 'ml-3 border-l border-zinc-800' : ''}`}>
                {children.map(branch => {
                    const hasChildren = allBranches.some(b => b.parentBranchId === branch.id);
                    const isExpanded = expanded.has(branch.id);
                    const isActive = activeBranchId === branch.id;

                    return (
                        <div key={branch.id} className="relative">
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
                            {hasChildren && isExpanded && renderTree(branch.id, depth + 1)}
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
                className="fixed top-4 right-4 z-50 p-2 bg-[#09090b] text-zinc-400 rounded-md border border-zinc-800 hover:text-white shadow-lg"
                title="Open BranchGPT"
            >
                <PanelLeftOpen size={20} />
            </button>
        )
    }

    return (
        <div className="fixed top-0 right-0 h-screen w-[320px] bg-[#09090b] text-zinc-100 font-sans flex flex-col border-l border-zinc-800 shadow-2xl z-[9999]">
            {/* Header */}
            <header className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between bg-[#09090b]/95 backdrop-blur z-10 sticky top-0">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-purple-500/10 rounded-md">
                        <GitBranch size={16} className="text-purple-400" />
                    </div>
                    <span className="font-semibold text-sm tracking-tight">BranchGPT</span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={handleNewBranch}
                        className="p-1.5 hover:bg-zinc-800 rounded-md transition-colors text-zinc-400 hover:text-white"
                        title="New Root Branch"
                    >
                        <Plus size={16} />
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1.5 hover:bg-zinc-800 rounded-md transition-colors text-zinc-400 hover:text-white"
                        title="Close Sidebar"
                    >
                        <PanelLeftClose size={16} />
                    </button>
                </div>
            </header>

            {/* Main Content: Tree View Only */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-zinc-800">
                <h3 className="text-[10px] uppercase font-bold text-zinc-500 mb-4 px-2 flex justify-between items-center">
                    <span>Repository</span>
                    <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-full">{allBranches.length} Nodes</span>
                </h3>
                {allBranches.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-zinc-500 text-xs gap-2 border-2 border-dashed border-zinc-800/50 rounded-lg m-2">
                        <GitBranch size={24} className="opacity-20" />
                        <p>No active branches</p>
                        <button onClick={handleNewBranch} className="text-purple-400 hover:underline">Start Branching</button>
                    </div>
                ) : (
                    <div className="pl-1">
                        {renderTree(null)}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-1.5 border-t border-zinc-800 text-[10px] text-zinc-600 flex justify-between px-3">
                <span>v0.1.0</span>
                <span>Tree Mode</span>
            </div>
        </div>
    );
}

function BranchItem({ branch, isActive, hasChildren, isExpanded, onSelect, onToggle, onDelete, onMerge }: any) {
    return (
        <div className={`
            group flex items-center gap-1.5 p-1.5 rounded-md cursor-pointer transition-all border 
            ${isActive ? 'bg-purple-500/10 border-purple-500/20' : 'border-transparent hover:bg-zinc-800/50'}
        `}>
            {/* Toggler */}
            <div
                className={`p-0.5 rounded hover:bg-zinc-700/50 text-zinc-500 ${!hasChildren ? 'invisible' : ''}`}
                onClick={onToggle}
            >
                {isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
            </div>

            {/* Label */}
            <div className="flex-1 min-w-0" onClick={onSelect}>
                <div className={`text-xs font-medium truncate ${isActive ? 'text-purple-300' : 'text-zinc-300'}`}>
                    {branch.label}
                </div>
            </div>

            {/* Actions */}
            <div className={`flex items-center gap-1 ${isActive || 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                <button
                    onClick={onMerge}
                    title="Merge to Parent"
                    className="p-1 hover:bg-blue-500/20 text-zinc-500 hover:text-blue-400 rounded"
                >
                    <GitMerge size={10} />
                </button>
                <button
                    onClick={onDelete}
                    title="Prune"
                    className="p-1 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 rounded"
                >
                    <Trash2 size={10} />
                </button>
            </div>
        </div>
    )
}
