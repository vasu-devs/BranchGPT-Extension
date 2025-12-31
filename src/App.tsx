import { useState, useEffect } from 'react';
import { getRootBranches, createBranch } from './lib/branches';
import { Branch } from './lib/db';
import { Plus } from 'lucide-react';

function App() {
    const [branches, setBranches] = useState<Branch[]>([]);

    useEffect(() => {
        loadBranches();
    }, []);

    async function loadBranches() {
        const roots = await getRootBranches();
        setBranches(roots);
    }

    async function handleNewBranch() {
        await createBranch({ label: 'New Conversation' });
        loadBranches();
    }

    return (
        <div className="w-[300px] h-screen bg-zinc-900 text-zinc-100 p-4 font-sans border-l border-zinc-800">
            <header className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                    BranchGPT
                </h1>
                <button
                    onClick={handleNewBranch}
                    className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
                >
                    <Plus size={20} />
                </button>
            </header>

            <div className="space-y-2">
                {branches.map((branch) => (
                    <div
                        key={branch.id}
                        className="p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 cursor-pointer border border-zinc-700/50"
                    >
                        <div className="font-medium text-sm">{branch.label}</div>
                        <div className="text-xs text-zinc-500 mt-1">
                            {new Date(branch.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                ))}

                {branches.length === 0 && (
                    <div className="text-center text-zinc-500 py-8 text-sm">
                        No branches yet. Start one!
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;
