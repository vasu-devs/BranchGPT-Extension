import { useState, useEffect } from 'react';
import { getRootBranches, createBranch } from './lib/branches';
import { getBranchMessages } from './lib/messages';
import { Branch, Message } from './lib/db';
import { GitBranch, Plus, MessageSquare, ChevronLeft, User, Bot } from 'lucide-react';

function App() {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);

    useEffect(() => {
        loadBranches();

        // @ts-ignore
        chrome.runtime.onMessage.addListener((request) => {
            if (request.type === 'REFRESH_BRANCHES') {
                loadBranches();
                if (activeBranchId) loadMessages(activeBranchId);
            }
        });
    }, [activeBranchId]);

    async function loadBranches() {
        const roots = await getRootBranches();
        setBranches(roots);
    }

    async function loadMessages(branchId: string) {
        const msgs = await getBranchMessages(branchId);
        setMessages(msgs);
    }

    async function handleNewBranch() {
        const b = await createBranch({ label: 'New Conversation' });
        loadBranches();
        setActiveBranchId(b.id);
    }

    function selectBranch(id: string) {
        setActiveBranchId(id);
        loadMessages(id);
    }

    return (
        <div className="w-full h-screen bg-[#09090b] text-zinc-100 font-sans flex flex-col">
            {/* Header */}
            <header className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between bg-[#09090b]/95 backdrop-blur z-10 sticky top-0">
                <div className="flex items-center gap-2">
                    {activeBranchId ? (
                        <button onClick={() => setActiveBranchId(null)} className="hover:text-purple-400 transition-colors">
                            <ChevronLeft size={16} />
                        </button>
                    ) : (
                        <div className="p-1.5 bg-purple-500/10 rounded-md">
                            <GitBranch size={16} className="text-purple-400" />
                        </div>
                    )}
                    <span className="font-semibold text-sm tracking-tight">
                        {activeBranchId ? 'Timeline' : 'BranchGPT'}
                    </span>
                </div>
                {!activeBranchId && (
                    <button
                        onClick={handleNewBranch}
                        className="p-1.5 hover:bg-zinc-800 rounded-md transition-colors text-zinc-400 hover:text-white"
                        title="New Root Branch"
                    >
                        <Plus size={16} />
                    </button>
                )}
            </header>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                {!activeBranchId ? (
                    // Branch List
                    branches.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-center text-zinc-500 space-y-3">
                            <GitBranch size={24} className="opacity-20" />
                            <p className="text-xs">No branches yet.<br />Start chatting or click +</p>
                        </div>
                    ) : (
                        branches.map((branch) => (
                            <div key={branch.id} onClick={() => selectBranch(branch.id)}>
                                <BranchItem branch={branch} />
                            </div>
                        ))
                    )
                ) : (
                    // Message View
                    <div className="space-y-4 p-2 pb-10">
                        {messages.length === 0 && <div className="text-center text-xs text-zinc-500">Empty branch</div>}
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-zinc-700' : 'bg-green-600/20 text-green-400'}`}>
                                    {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                                </div>
                                <div className={`text-xs p-2.5 rounded-lg max-w-[85%] leading-relaxed ${msg.role === 'user'
                                        ? 'bg-zinc-800 text-zinc-200'
                                        : 'bg-transparent border border-zinc-800 text-zinc-300'
                                    }`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-zinc-800 text-[10px] text-zinc-600 text-center flex justify-between px-4">
                <span>v1.0.1</span>
                <span>{activeBranchId ? `${messages.length} msgs` : `${branches.length} branches`}</span>
            </div>
        </div>
    );
}

function BranchItem({ branch }: { branch: Branch }) {
    return (
        <div className="group flex items-center gap-2 p-2 rounded-md hover:bg-zinc-800/50 cursor-pointer transition-all border border-transparent hover:border-zinc-800">
            <div className="flex flex-col items-center self-stretch py-1">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-700 group-hover:bg-purple-500 transition-colors"></div>
                <div className="w-px flex-1 bg-zinc-800 my-0.5 group-hover:bg-zinc-700"></div>
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-medium text-zinc-300 group-hover:text-purple-300 truncate transition-colors">
                        {branch.label}
                    </h3>
                    <span className="text-[10px] text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        {new Date(branch.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
                <div className="text-[10px] text-zinc-500 truncate mt-0.5 flex items-center gap-1">
                    <MessageSquare size={8} />
                    <span>View Timeline</span>
                </div>
            </div>
        </div>
    )
}

export default App;
