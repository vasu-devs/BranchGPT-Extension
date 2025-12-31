import { useState, useEffect } from 'react';
import { createBranch, deleteBranch, getAllBranches } from './lib/branches';
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
                // Should we auto-switch?
                // The background script sets storage, so let's re-read it
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

    async function handleMerge(e: React.MouseEvent, id: string) {
        e.stopPropagation();
        alert(`Merge feature: Appends branch ${id} content to parent (Not fully implemented in MVP yet)`);
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
                                onMerge={(e: React.MouseEvent) => handleMerge(e, branch.id)}
                            />
                            {hasChildren && isExpanded && renderTree(branch.id, depth + 1)}
                        </div>
                    );
                })}
            </div>
        );
    }

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
                {/* Top: Tree View (Resizable ideally, but fixed for MVP is fine) */}
                <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-zinc-800 border-b border-zinc-800 min-h-[40%]">
                    <h3 className="text-[10px] uppercase font-bold text-zinc-500 mb-2 px-2">Branches</h3>
                    {allBranches.length === 0 ? (
                        <div className="text-center text-zinc-500 py-8 text-xs">No branches yet</div>
                    ) : renderTree(null)}
                </div>

                {/* Bottom: Active Branch Inspector */}
                <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-zinc-800 bg-zinc-900/30 flex flex-col">
                    <h3 className="text-[10px] uppercase font-bold text-zinc-500 mb-2 px-2 sticky top-0 bg-[#09090b]/50 backdrop-blur z-10">
                        {activeBranchId ? 'Active Conversation' : 'Select a Branch'}
                    </h3>
                    {activeBranchId ? (
                        <div className="space-y-4 p-2 pb-4">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-zinc-700' : 'bg-green-600/20 text-green-400'}`}>
                                        {msg.role === 'user' ? <User size={10} /> : <Bot size={10} />}
                                    </div>
                                    <div className={`text-[11px] p-2 rounded-lg max-w-[90%] leading-relaxed ${msg.role === 'user'
                                        ? 'bg-zinc-800 text-zinc-200'
                                        : 'bg-transparent border border-zinc-800 text-zinc-300'
                                        }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {messages.length === 0 && <div className="text-center text-[10px] text-zinc-500 py-4">No messages captured</div>}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-zinc-600 text-[10px]">
                            Select a branch to view messages
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="p-1.5 border-t border-zinc-800 text-[10px] text-zinc-600 flex justify-between px-3">
                <span>{allBranches.length} branches</span>
                <span>Tree View Active</span>
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
                <button onClick={onMerge} className="p-1 hover:bg-purple-500/20 text-zinc-500 hover:text-purple-400 rounded">
                    <GitMerge size={10} />
                </button>
                <button onClick={onDelete} className="p-1 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 rounded">
                    <Trash2 size={10} />
                </button>
            </div>
        </div>
    )
}

export default App;
