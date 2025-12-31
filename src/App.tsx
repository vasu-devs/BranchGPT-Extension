import { useState, useEffect } from 'react';
import { createBranch, deleteBranch, getAllBranches, mergeBranch } from './lib/branches';
import { getBranchMessages } from './lib/messages';
import { Branch, Message } from './lib/db';
import { GitBranch, Plus, User, Bot, Trash2, GitMerge, ChevronRight, ChevronDown } from 'lucide-react';

function App() {
    const [allBranches, setAllBranches] = useState<Branch[]>([]);
    const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

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

    // Effect: when activeBranchId changes, save it and load messages
    useEffect(() => {
        if (activeBranchId) {
            chrome.storage.local.set({ activeBranchId });
            loadMessages(activeBranchId);
            // Also expand path to this branch
            expandToBranch(activeBranchId);
        } else {
            setMessages([]);
            chrome.storage.local.remove('activeBranchId');
        }
    }, [activeBranchId]);

    async function loadData() {
        const branches = await getAllBranches();
        setAllBranches(branches);
    }

    async function loadMessages(branchId: string) {
        const msgs = await getBranchMessages(branchId);
        setMessages(msgs);
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
        const b = await createBranch({ label: 'New Conversation' });
        loadData();
        setActiveBranchId(b.id);
    }

    async function handleDelete(e: React.MouseEvent, id: string) {
        e.stopPropagation();
        await deleteBranch(id);
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
        await mergeBranch(sourceBranch.id, sourceBranch.parentBranchId);

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

    // Get Breadcrumb path
    function getBreadcrumbs(branchId: string | null) {
        const path: Branch[] = [];
        if (!branchId) return path;

        let current = allBranches.find(b => b.id === branchId);
        while (current) {
            path.unshift(current);
            if (current.parentBranchId) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const pid = current.parentBranchId!;
                current = allBranches.find(b => b.id === pid);
            } else {
                current = undefined;
            }
        }
        return path;
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

    const breadcrumbs = getBreadcrumbs(activeBranchId);

    return (
        <div className="w-full h-screen bg-[#09090b] text-zinc-100 font-sans flex flex-col">
            {/* Header */}
            <header className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between bg-[#09090b]/95 backdrop-blur z-10 sticky top-0">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-purple-500/10 rounded-md">
                        <GitBranch size={16} className="text-purple-400" />
                    </div>
                    <span className="font-semibold text-sm tracking-tight">BranchGPT</span>
                </div>
                <button
                    onClick={handleNewBranch}
                    className="p-1.5 hover:bg-zinc-800 rounded-md transition-colors text-zinc-400 hover:text-white"
                    title="New Root Branch"
                >
                    <Plus size={16} />
                </button>
            </header>

            {/* Main Content: Split View */}
            <div className="flex-1 flex flex-col min-h-0">
                {/* Top: Tree View */}
                <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-zinc-800 border-b border-zinc-800 min-h-[35%]">
                    <h3 className="text-[10px] uppercase font-bold text-zinc-500 mb-2 px-2 flex justify-between">
                        <span>Graph</span>
                        <span className="text-[9px] opacity-50">Recursive</span>
                    </h3>
                    {allBranches.length === 0 ? (
                        <div className="text-center text-zinc-500 py-8 text-xs">No branches yet</div>
                    ) : renderTree(null)}
                </div>

                {/* Bottom: Active Branch Inspector & Breadcrumbs */}
                <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-zinc-800 bg-zinc-900/30 flex flex-col">
                    <div className="sticky top-0 bg-[#09090b]/95 backdrop-blur z-10 border-b border-zinc-800/50 pb-2 mb-2">
                        {/* Breadcrumbs */}
                        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none whitespace-nowrap px-1 pb-1">
                            <span className="text-[10px] text-zinc-600">PATH:</span>
                            {breadcrumbs.length > 0 ? (
                                breadcrumbs.map((b, i) => (
                                    <div key={b.id} className="flex items-center">
                                        {i > 0 && <ChevronRight size={8} className="text-zinc-600 mx-0.5" />}
                                        <button
                                            onClick={() => setActiveBranchId(b.id)}
                                            className={`text-[10px] hover:text-purple-400 transition-colors ${i === breadcrumbs.length - 1 ? 'text-purple-300 font-medium' : 'text-zinc-500'}`}
                                        >
                                            {b.label}
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <span className="text-[10px] text-zinc-700 italic">None selected</span>
                            )}
                        </div>
                    </div>

                    {activeBranchId ? (
                        <div className="space-y-4 p-2 pb-4">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-zinc-700' :
                                        msg.role === 'system' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-600/20 text-green-400'}`}>
                                        {msg.role === 'user' ? <User size={10} /> : msg.role === 'system' ? <GitMerge size={10} /> : <Bot size={10} />}
                                    </div>
                                    <div className={`text-[11px] p-2 rounded-lg max-w-[90%] leading-relaxed ${msg.role === 'user' ? 'bg-zinc-800 text-zinc-200' :
                                            msg.role === 'system' ? 'bg-blue-900/10 border border-blue-500/20 text-blue-300 italic' :
                                                'bg-transparent border border-zinc-800 text-zinc-300'
                                        }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {messages.length === 0 && <div className="text-center text-[10px] text-zinc-500 py-4">No messages captured</div>}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-zinc-600 text-[10px]">
                            Select a branch to view timeline
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="p-1.5 border-t border-zinc-800 text-[10px] text-zinc-600 flex justify-between px-3">
                <span>Nodes: {allBranches.length}</span>
                <span>DAG Mode</span>
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

export default App;
